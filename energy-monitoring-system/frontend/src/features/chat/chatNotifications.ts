import { showToast } from '@/components/common/Toast';

export const CHAT_ALERTS_MUTED_KEY = 'ecostep_chat_alerts_muted';
const PREF_EVENT = 'ecostep:chat-alerts-pref';

let sharedAudioCtx: AudioContext | null = null;

export function isChatAlertsMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CHAT_ALERTS_MUTED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setChatAlertsMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_ALERTS_MUTED_KEY, String(muted));
    window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: { muted } }));
  } catch {
    // Ignore storage errors
  }
}

export function subscribeChatAlertsPref(
  listener: (muted: boolean) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ muted?: boolean }>;
    listener(Boolean(custom.detail?.muted ?? isChatAlertsMuted()));
  };
  window.addEventListener(PREF_EVENT, handler);
  return () => window.removeEventListener(PREF_EVENT, handler);
}

/**
 * Play a soft, crisp two-tone chime using the browser's Web Audio API.
 * Gracefully no-ops if audio context is unavailable or blocked before user gesture.
 */
export function playMessageChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 880, start: 0, duration: 0.12 }, // A5
      { freq: 1174.66, start: 0.09, duration: 0.18 }, // D6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.1, now + note.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.start + note.duration,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.02);
    }
  } catch {
    // Ignore Web Audio errors
  }
}

/**
 * Show an incoming chat toast and play the chime unless the user muted chat alerts.
 */
export function notifyIncomingChatMessage(options: {
  senderName?: string;
  count?: number;
}): void {
  if (isChatAlertsMuted()) return;

  const count = Math.max(1, options.count ?? 1);
  const sender = options.senderName?.trim();
  const label =
    count > 1
      ? `${count} new messages${sender ? ` from ${sender}` : ''}`
      : `1 new message${sender ? ` from ${sender}` : ''}`;

  showToast(label, 'info');
  playMessageChime();
}
