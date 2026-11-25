import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

interface LaptopWifiNetwork {
  ssid: string
  rssi?: number
  secure?: boolean
}

function parseWindowsNetshOutput(stdout: string): LaptopWifiNetwork[] {
  const networks = new Map<string, LaptopWifiNetwork>()
  let currentSsid = ''
  let currentSecure = true

  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim()
    const ssidMatch = line.match(/^SSID\s+\d+\s*:\s*(.*)$/i)
    if (ssidMatch) {
      currentSsid = ssidMatch[1].trim()
      currentSecure = true
      if (currentSsid && !networks.has(currentSsid)) {
        networks.set(currentSsid, { ssid: currentSsid, secure: true })
      }
      continue
    }

    if (!currentSsid) continue

    const authMatch = line.match(/^Authentication\s*:\s*(.+)$/i)
    if (authMatch) {
      currentSecure = !/^open$/i.test(authMatch[1].trim())
      const existing = networks.get(currentSsid)
      if (existing) {
        existing.secure = currentSecure
      }
      continue
    }

    const signalMatch = line.match(/^Signal\s*:\s*(\d+)%$/i)
    if (signalMatch) {
      const pct = Number(signalMatch[1])
      const rssi = Math.round(pct / 2 - 100)
      const existing = networks.get(currentSsid)
      if (existing && (existing.rssi === undefined || rssi > existing.rssi)) {
        existing.rssi = rssi
      }
    }
  }

  return Array.from(networks.values()).sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
}

function parseLinuxNmcliOutput(stdout: string): LaptopWifiNetwork[] {
  const networks = new Map<string, LaptopWifiNetwork>()
  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const [rawSsid, rawSignal, rawSecurity] = line.split(':')
    const ssid = (rawSsid || '').trim()
    if (!ssid) continue
    const signalPct = Number(rawSignal)
    const rssi = Number.isFinite(signalPct) ? Math.round(signalPct / 2 - 100) : undefined
    const secure = Boolean(rawSecurity && rawSecurity.trim() !== '' && rawSecurity.trim() !== '--')
    const existing = networks.get(ssid)
    if (!existing || ((rssi ?? -100) > (existing.rssi ?? -100))) {
      networks.set(ssid, { ssid, rssi, secure })
    }
  }
  return Array.from(networks.values()).sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
}

function parseMacAirportOutput(stdout: string): LaptopWifiNetwork[] {
  const networks = new Map<string, LaptopWifiNetwork>()
  const lines = stdout.split(/\r?\n/).slice(1)
  for (const line of lines) {
    const match = line.match(/^\s*(.+?)\s+[0-9a-f:]{17}\s+(-?\d+)\s+\S+\s+\S+\s+\S+\s+(.*)$/i)
    if (!match) continue
    const ssid = match[1].trim()
    if (!ssid) continue
    const rssi = Number(match[2])
    const security = match[3].trim()
    const secure = !/^NONE$/i.test(security)
    const existing = networks.get(ssid)
    if (!existing || rssi > (existing.rssi ?? -100)) {
      networks.set(ssid, { ssid, rssi, secure })
    }
  }
  return Array.from(networks.values()).sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
}

async function scanHostLaptopWifi(): Promise<LaptopWifiNetwork[]> {
  if (process.platform === 'win32') {
    const { stdout } = await execFileAsync('netsh', ['wlan', 'show', 'networks', 'mode=bssid'], {
      timeout: 5000,
      windowsHide: true,
    })
    return parseWindowsNetshOutput(stdout)
  }

  if (process.platform === 'linux') {
    const { stdout } = await execFileAsync(
      'nmcli',
      ['-t', '-f', 'SSID,SIGNAL,SECURITY', 'dev', 'wifi', 'list', '--rescan', 'auto'],
      { timeout: 5000 },
    )
    return parseLinuxNmcliOutput(stdout)
  }

  if (process.platform === 'darwin') {
    const { stdout } = await execFileAsync(
      '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport',
      ['-s'],
      { timeout: 5000 },
    )
    return parseMacAirportOutput(stdout)
  }

  return []
}

function laptopWifiScanPlugin(): Plugin {
  return {
    name: 'ecostep-laptop-wifi-scan',
    configureServer(server) {
      server.middlewares.use('/__local/wifi-scan', async (req, res) => {
        if (req.method && req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')

        try {
          const networks = await scanHostLaptopWifi()
          res.statusCode = 200
          res.end(JSON.stringify({ source: 'laptop', networks }))
        } catch (err: any) {
          res.statusCode = 200
          res.end(
            JSON.stringify({
              source: 'laptop',
              networks: [],
              error: err?.message || 'Unable to scan laptop Wi-Fi networks',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000';

  return {
  plugins: [react(), svgr(), laptopWifiScanPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React dependencies
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          
          // Large icon library
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          
          // Chart libraries (used in Analytics, Reports, Diagnostics, Energy pages)
          if (id.includes('node_modules/recharts') || 
              id.includes('node_modules/d3-')) {
            return 'charts';
          }
          
          // Form and validation libraries
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/@hookform') || 
              id.includes('node_modules/zod')) {
            return 'forms';
          }
          
          // Data fetching and state management
          if (id.includes('node_modules/@tanstack/react-query') || 
              id.includes('node_modules/axios')) {
            return 'data-fetching';
          }
          
          // Real-time communication
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client')) {
            return 'socket';
          }
          
          // Utility libraries
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/lodash-es')) {
            return 'utils';
          }
          
          // Chat & Markdown utilities (loaded with EcoGuide)
          if (id.includes('node_modules/marked') || 
              id.includes('node_modules/dompurify')) {
            return 'markdown-purify';
          }
          
          // Split node_modules vendor code into smaller chunks
          if (id.includes('node_modules/')) {
            return 'vendor-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Keep the warning threshold at 500KB
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Rewrite Origin header to match target so deployed backends don't reject localhost dev requests via CORS
            if (proxyReq.getHeader('origin')) {
              proxyReq.setHeader('origin', apiProxyTarget);
            }
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  };
})