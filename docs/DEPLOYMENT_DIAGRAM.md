# EcoStep System Deployment Diagram Specification

**Document Title:** Physical & Cloud System Deployment Architecture & UML Deployment Diagram  
**Target System:** EcoStep — Smart Piezoelectric Footstep Kinetic Energy Monitoring System  
**Applicability:** BSIT Capstone Project Technical Documentation (System Architecture & Deployment Modeling)  
**Date of Specification:** November 13, 2026  
**Format:** Black & White (Monochrome Academic Print) / Mermaid / draw.io Compatible  
**Layout Optimization:** 2-Column Portrait Bond Paper Layout (Letter 8.5" × 11" / Long 8.5" × 13")  

---

## Table of Contents
1. [Architectural Deployment Overview](#1-architectural-deployment-overview)
2. [Mermaid Deployment Diagram Code (Bond Paper 2-Column Layout)](#2-mermaid-deployment-diagram-code-bond-paper-2-column-layout)
3. [Instructions for Importing into draw.io](#3-instructions-for-importing-into-drawio)
4. [Deployment Nodes & Execution Environments Breakdown](#4-deployment-nodes--execution-environments-breakdown)
   - [4.1 Hardware Tier: Piezoelectric Floor Mat & ESP32 Node](#41-hardware-tier-piezoelectric-floor-mat--esp32-node)
   - [4.2 Client Presentation Tier: Workstation / Mobile Browser](#42-client-presentation-tier-workstation--mobile-browser)
   - [4.3 Application Backend Tier: NestJS Node.js Runtime](#43-application-backend-tier-nestjs-nodejs-runtime)
   - [4.4 Database Tier: MongoDB Atlas Cloud Replica Set](#44-database-tier-mongodb-atlas-cloud-replica-set)
   - [4.5 Cognitive AI Tier: Dual-Provider Cloud LLM Engine](#45-cognitive-ai-tier-dual-provider-cloud-llm-engine)
5. [Network Protocols & Security Specifications](#5-network-protocols--security-specifications)

---

## 1. Architectural Deployment Overview

The **EcoStep** monitoring system utilizes a hybrid IoT edge-to-cloud deployment topology. Physical kinetic energy generation occurs at the **Hardware Tier**, where footstep stress on piezoelectric floor tiles generates alternating current (AC) pulses that are rectified, smoothed, and digitized by an **ESP32 microcontroller**.

Telemetry is dispatched through two complementary communication channels:
1. **Direct Edge Pairing (Web Bluetooth API):** The ESP32 exposes a Bluetooth Low Energy (BLE) GATT server operating Nordic UART Service (`6e400001-...`), allowing live client browser pairing without requiring internet access.
2. **Cloud/Local Network Telemetry Ingestion (Wi-Fi):** Telemetry packets are posted via HTTPS REST with an `X-API-Key` credential directly to the NestJS application server.

The **Application Backend** operates within a **Node.js 22 LTS** runtime, performing numerical energy integration ($\int P \, dt$), managing milestone goal locks, persisting immutable audit logs, and hosting real-time **Socket.IO** WebSocket connections. Data persistence is managed remotely via **MongoDB Atlas** with encrypted TLS 1.3 connections, while natural language intelligence for **EcoGuide** is served through a dual-provider cloud pipeline (**Google Gemini 3.5 Flash** with automatic failover to **Groq Cloud**).

---

## 2. Mermaid Deployment Diagram Code (Bond Paper 2-Column Layout)

This diagram is specifically arranged in a **2-column portrait grid** (Hardware & Backend on the left; Client, Database & AI Cloud on the right) with vertically stacked database and AI blocks so that it fits completely inside the printable margins of standard bond paper (**8.5" × 11" Short** or **8.5" × 13" Long**) in draw.io without crossing the page boundary line.

```mermaid
flowchart TB
    %% =========================================================================
    %% PURE BLACK & WHITE STYLING (FOR ACADEMIC THESIS PRINT & DRAW.IO)
    %% =========================================================================
    classDef default fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef nodeBox fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000;
    classDef subBox fill:#ffffff,stroke:#000000,stroke-width:1.5px,stroke-dasharray: 4 4,color:#000000;
    classDef artifactBox fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef cloudBox fill:#ffffff,stroke:#000000,stroke-width:2px,stroke-dasharray: 6 3,color:#000000;

    %% =========================================================================
    %% COLUMN 1 (LEFT): HARDWARE TIER & BACKEND APPLICATION SERVER
    %% =========================================================================
    subgraph COL_LEFT[" "]
        direction TB

        subgraph NODE_HW["«device»<br/><b>EcoStep Kinetic Energy Floor Mat</b>"]
            direction TB
            subgraph ESP32_EXEC["«execution environment»<br/><b>ESP32 Microcontroller Node</b>"]
                direction TB
                HW_SENS["«hardware component»<br/><b>PZT Piezoelectric Discs &<br/>Rectifier / Capacitor Bank</b>"]
                FW_APP["«artifact»<br/><b>ecostep_firmware.ino</b><br/>• Step Detection Engine<br/>• Ingestion & Voltage Sampler"]
                BLE_MOD["«component»<br/><b>BLE GATT Peripheral</b><br/>(Nordic UART 6e400001)"]
                WIFI_MOD["«component»<br/><b>Wi-Fi HTTP Client</b><br/>(X-API-Key Auth Header)"]

                HW_SENS -->|Analog Signals| FW_APP
                FW_APP --> BLE_MOD
                FW_APP --> WIFI_MOD
            end
        end

        subgraph NODE_BACKEND["«execution environment»<br/><b>Backend Application Server (Host / VM)</b>"]
            direction TB
            subgraph NODE_RUNTIME["«execution environment»<br/><b>Node.js 22 LTS Runtime</b>"]
                direction TB
                NEST_APP["«artifact»<br/><b>NestJS Application (dist/main.js)</b><br/>• REST API Controllers (14 modules)<br/>• Energy Integration (P = V × I, ∫P dt)<br/>• Milestones & Locking Engine<br/>• PDF / Excel Reporting Engine<br/>• Audit & Diagnostic Services"]
                SOCKET_GW["«component»<br/><b>Socket.IO WebSocket Gateway</b><br/>(Port :3000 / Real-Time Telemetry)"]
                SESSION_CACHE["«in-memory cache»<br/><b>SessionManager RAM Cache</b><br/>(Map&lt;string, ChatSession&gt; / 30m TTL)"]

                NEST_APP <--> SOCKET_GW
                NEST_APP <--> SESSION_CACHE
            end
        end
    end

    %% =========================================================================
    %% COLUMN 2 (RIGHT): CLIENT WORKSTATION, DATABASE & AI CLOUD
    %% =========================================================================
    subgraph COL_RIGHT[" "]
        direction TB

        subgraph NODE_CLIENT["«device»<br/><b>Client Workstation / Mobile Device</b>"]
            direction TB
            subgraph BROWSER_ENV["«execution environment»<br/><b>Web Browser (Google Chrome / Chromium)</b>"]
                direction TB
                SPA_ARTIFACT["«artifact»<br/><b>EcoStep Web App (dist/)</b><br/>• React 19 SPA / Tailwind CSS<br/>• TanStack React Query<br/>• KaTeX Math Typesetting"]
                BLE_CLIENT["«subsystem»<br/><b>Web Bluetooth API Client</b><br/>(EcoStepBleClient.ts)"]
                ECOGUIDE_UI["«component»<br/><b>EcoGuide Chatbot UI</b>"]

                SPA_ARTIFACT --> BLE_CLIENT
                SPA_ARTIFACT --> ECOGUIDE_UI
            end
        end

        subgraph NODE_DB["«cloud service»<br/><b>MongoDB Atlas Cloud Database</b>"]
            direction TB
            subgraph DB_CLUSTER["«database system»<br/><b>MongoDB 7.x Replica Set</b>"]
                direction TB
                COLL_READINGS[("«database collection»<br/><b>energy_readings</b><br/>(Time-Series Telemetry)")]
                COLL_CORE[("«database collections»<br/><b>users</b> • <b>sensors</b> • <b>audit_logs</b><br/>(RBAC, IoT Nodes & Security Trail)")]
                COLL_CONFIG[("«database collections»<br/><b>milestone_targets</b> • <b>reports</b> • <b>diagnostic_tests</b><br/>(Monthly Goals, Reports & Calibration)")]
                COLL_READINGS ~~~ COLL_CORE ~~~ COLL_CONFIG
            end
        end

        subgraph NODE_AI["«cloud service»<br/><b>External AI Inference Cloud</b>"]
            direction TB
            AI_GEMINI["«external service»<br/><b>Google Gemini 3.5 Flash API</b><br/>(Primary Conversational LLM)"]
            AI_GROQ["«external service»<br/><b>Groq Cloud API</b><br/>(openai/gpt-oss-120b Failover)"]
            AI_GEMINI ~~~ AI_GROQ
        end
    end

    %% =========================================================================
    %% PHYSICAL & NETWORK PROTOCOL LINKS
    %% =========================================================================
    BLE_MOD <==>|"BLE 2.4 GHz<br/>(Web Bluetooth)"| BLE_CLIENT
    WIFI_MOD ==>|"HTTPS / REST<br/>X-API-Key Ingestion"| NEST_APP

    SPA_ARTIFACT <==>|"HTTPS (Port 3000)<br/>REST (JSON/JWT)"| NEST_APP
    SPA_ARTIFACT <==>|"WSS (WebSocket)<br/>Live Telemetry"| SOCKET_GW

    NEST_APP <==>|"TLS 1.3 / Mongoose<br/>(Port 27017)"| DB_CLUSTER

    NEST_APP ==>|"HTTPS / REST (Primary)"| AI_GEMINI
    NEST_APP -.->|"HTTPS / REST (Failover)"| AI_GROQ

    %% =========================================================================
    %% INVISIBLE COLUMN CONTAINERS (FOR GRID ALIGNMENT)
    %% =========================================================================
    style COL_LEFT fill:none,stroke:none
    style COL_RIGHT fill:none,stroke:none

    %% =========================================================================
    %% APPLY BLACK & WHITE MONOCHROME STYLES
    %% =========================================================================
    style NODE_HW fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style ESP32_EXEC fill:#ffffff,stroke:#000000,stroke-width:1.5px,stroke-dasharray: 4 4,color:#000000
    style NODE_CLIENT fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style BROWSER_ENV fill:#ffffff,stroke:#000000,stroke-width:1.5px,stroke-dasharray: 4 4,color:#000000
    style NODE_BACKEND fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    style NODE_RUNTIME fill:#ffffff,stroke:#000000,stroke-width:1.5px,stroke-dasharray: 4 4,color:#000000
    style NODE_DB fill:#ffffff,stroke:#000000,stroke-width:2px,stroke-dasharray: 6 3,color:#000000
    style DB_CLUSTER fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000
    style NODE_AI fill:#ffffff,stroke:#000000,stroke-width:2px,stroke-dasharray: 6 3,color:#000000

    linkStyle default stroke:#000000,stroke-width:1.5px,color:#000000;
```

---

## 3. Instructions for Importing into draw.io

To render and edit this deployment diagram in **draw.io**:

1. Open **[draw.io](https://app.diagrams.net/)** (or draw.io Desktop).
2. Create a new diagram or open an existing one.
3. In the top application menu bar, navigate to:
   $$\text{Arrange} \longrightarrow \text{Insert} \longrightarrow \text{Advanced} \longrightarrow \text{Mermaid...}$$
4. In the dialog window that appears, select and delete any default sample text.
5. Copy the code block from [Section 2](#2-mermaid-deployment-diagram-code-bond-paper-2-column-layout) above (from `flowchart TB` down to the last `linkStyle` line) and paste it into the editor.
6. Click the blue **Insert** button.
7. draw.io will instantly translate the Mermaid code into fully editable vector diagram shapes neatly positioned within your portrait page boundary!

---

## 4. Deployment Nodes & Execution Environments Breakdown

### 4.1 Hardware Tier: Piezoelectric Floor Mat & ESP32 Node
* **Stereotype:** `«device»` / `«execution environment»`
* **Physical Hardware:**
  * PZT Lead Zirconate Titanate piezoelectric ceramic transducers.
  * Schottky diode bridge rectifier circuit and smoothing capacitor bank.
  * ESP32 microcontroller with 32-bit dual-core Xtensa LX6 CPU, 520 KB SRAM, integrated 2.4 GHz Wi-Fi and Bluetooth v4.2 BR/EDR and BLE.
* **Deployed Artifact:**
  * `ecostep_firmware.ino`: Compiled C++ Arduino binary responsible for interrupt-driven step counting, ADC voltage sampling, and dual BLE/Wi-Fi dispatch.

### 4.2 Client Presentation Tier: Workstation / Mobile Browser
* **Stereotype:** `«device»` / `«execution environment»`
* **Execution Environment:** Chromium-based web browser (Google Chrome, Microsoft Edge) supporting the **Web Bluetooth API**.
* **Deployed Artifact:**
  * Single Page Application bundle (`dist/`) containing React 19, Tailwind CSS 4, TanStack Query 5, and KaTeX LaTeX mathematical typesetting.
* **Client Subsystems:**
  * `EcoStepBleClient.ts`: Direct browser-to-hardware GATT connection manager.
  * `EcoGuide.tsx`: Conversational AI interface with streaming responses and equation formatting.

### 4.3 Application Backend Tier: NestJS Node.js Runtime
* **Stereotype:** `«execution environment»`
* **Runtime:** Node.js version 22 LTS on Windows 11 / Linux Server.
* **Deployed Artifact:**
  * `dist/main.js`: Enterprise NestJS 11 TypeScript application compiled to modular JavaScript.
* **Core Components:**
  * **REST API Layer:** 14 controller modules handling authentication, sensor management, analytics, and diagnostics.
  * **Socket.IO Gateway:** WebSocket server streaming real-time footstep power spikes to connected dashboards.
  * **SessionManager In-Memory Cache:** Dedicated RAM cache holding 30-minute anonymous chat histories (`Map<string, ChatSession>`), preventing unnecessary database writes.

### 4.4 Database Tier: MongoDB Atlas Cloud Replica Set
* **Stereotype:** `«cloud service»` / `«database system»`
* **Infrastructure:** MongoDB Atlas managed cluster with automatic failover, automated backup, and TLS 1.3 wire encryption.
* **Persistent Collections:**
  * `energy_readings`: High-frequency time-series telemetry.
  * `users`: Administrative user credentials, RBAC roles, and access code hashes.
  * `sensors`: Registered hardware metadata and API keys.
  * `milestone_targets`: Monthly targets, configuration deadlines, and locking state.
  * `audit_logs`: Append-only immutable trail of administrative actions.
  * `reports`: Metadata and file references for generated audit/energy reports.
  * `diagnostic_tests`: Tile calibration records and accuracy percentages.

### 4.5 Cognitive AI Tier: Dual-Provider Cloud LLM Engine
* **Stereotype:** `«cloud service»`
* **Primary Provider:** **Google Gemini 3.5 Flash API** via HTTPS REST with server-side API key authentication.
* **Failover Provider:** **Groq Cloud API** (`openai/gpt-oss-120b`) triggered automatically upon encountering HTTP 429 (rate limit), 5xx errors, or network timeouts.

---

## 5. Network Protocols & Security Specifications

| Connection | Origin Node | Destination Node | Protocol / Port | Authentication & Security |
| :--- | :--- | :--- | :--- | :--- |
| **Edge Hardware Telemetry** | ESP32 GATT Server | Client Browser | Bluetooth Low Energy (2.4 GHz) | Nordic UART GATT UUID (`6e400001-...`) |
| **Wi-Fi Ingestion** | ESP32 Wi-Fi Client | NestJS Backend | HTTPS / REST (Port 443/3000) | `X-API-Key` Custom Header (`esp32_...`) |
| **Client API Calls** | React SPA | NestJS Backend | HTTPS / REST (Port 443/3000) | JSON Web Token (JWT Bearer Token) |
| **Live Telemetry Stream**| React SPA | Socket.IO Gateway | WSS / WebSocket (Port 3000) | Origin Validation & JWT Handshake |
| **Database Persistence** | NestJS Backend | MongoDB Atlas | TLS 1.3 / Mongoose Wire (Port 27017) | SCRAM-SHA-256 + IP Whitelist (`mongodb+srv://`) |
| **AI Prompting** | NestJS Backend | Gemini / Groq Cloud | HTTPS / REST (Port 443) | Server-Side Secret API Key |
