<div align="center">

# 🛡️ KAVACH-X
### **ADVANCED CYBER-RESILIENT INFRASTRUCTURE PRESERVATION**

![KavachX Banner](https://img.shields.io/badge/SECURITY-OPERATIONAL-39ff14?style=for-the-badge&logo=shippable&logoColor=white)
![Inference Engine](https://img.shields.io/badge/COGNITIVE_ENGINE-XGBOOST-00f3ff?style=for-the-badge)
![Encryption](https://img.shields.io/badge/ENCRYPTION-AES--256-bc13fe?style=for-the-badge)

**"Securing the Digital Nervous System of Critical Infrastructure"**

[**LEARN MORE**](#-mission-overview) • [**SYSTEM ARCHITECTURE**](#-tactical-architecture) • [**THREAT HEURISTICS**](#-cognitive-intelligence-ml) • [**SOP DEPLOYMENT**](#-deployment-sop)

---
</div>

## 🌐 MISSION OVERVIEW

**KavachX** (Armour-X) is a high-fidelity security monitoring and autonomous resilience platform designed for the preservation of critical infrastructure. In an era of cyber-physical threats, KavachX provides a multi-tenant oversight layer for three vital domains:

*   🏥 **HEALTHCARE INFRASTRUCTURE**: Defending patient telemetry and IoMT devices from ransomware and synchronization disruption.
*   🌾 **SMART AGRICULTURE**: Preserving irrigation grid integrity and nutrient-delivery sensor arrays from unauthorized interception.
*   🏙️ **URBAN MUNICIPAL SYSTEMS**: Protecting smart grid actuators and water management systems from large-scale DDoS and lateral penetration.

---

## 📈 TACTICAL ARCHITECTURE

### **I. High-Fidelity Infrastructure Map**
The KavachX ecosystem is a distributed 3-tier intelligence network.

```mermaid
graph TD
    subgraph "SENSING & SIMULATION LAYER"
        AstraX["AstraX: Multi-Vector Threat Simulator"]
    end

    subgraph "RESILIENCE LAYER (BACKEND)"
        API["Node.js / Express Gateway"]
        Redis["Redis: Sliding Window Context Memory"]
        EventProc["Event Processing Pipeline (SOP)"]
        Response["Autonomous Response Service"]
    end

    subgraph "COGNITIVE ENGINE (ML)"
        MLService["Python ML Inception API"]
        XGB["XGBoost (15-Feature Inference)"]
    end

    subgraph "OPERATIONAL PERSISTENCE"
        DB["PostgreSQL / Supabase"]
    end

    subgraph "OPERATOR INTERFACE (KAVACH-HUB)"
        Dashboard["Command Dashboard (Live)"]
        Alerts["Anomaly Stream (SSE Broadcast)"]
        Settings["Governance Interface"]
    end

    AstraX -- "36-Feature Raw Telemetry" --> API
    API --> EventProc
    EventProc -- "Context Remittance" --> Redis
    EventProc -- "Inference Request" --> MLService
    MLService --> XGB
    XGB -- "Risk/Severity Categorization" --> MLService
    MLService -- "Classified Heuristics" --> EventProc
    EventProc -- "Atomic Commit" --> DB
    EventProc -- "Trigger Mitigation" --> Response
    Response -- "Auto-Mitigation" --> API
    Dashboard <--> API
    API -- "Broadcast" --> Alerts
    Settings -- "Threshold Calibration" --> DB
```

### **II. Operational Horizontal Flow**
A streamlined view of the "Ingestion-to-Alert" lifecycle.

```mermaid
graph LR
    Sim["Simulator (AstraX)"] -- "JSON Stream" --> Gate["Express Gateway"]
    Gate -- "Inference" --> ML["ML Engine"]
    ML -- "Severity" --> Gate
    Gate -- "Persist" --> SQL["Postgres (Supabase)"]
    SQL -- "Live Sync" --> UI["Dashboard"]
    Gate -- "Cache" --> RD["Redis"]
```

---

## 📊 DATA MODEL (ER DIAGRAM)

The core data structure ensures strict relationship integrity between operational events, classified alerts, and governance policies.

```mermaid
erDiagram
    USERS ||--o{ ALERTS : "resolves"
    ALERTS }|--|| SECTORS : "reported_on"
    EVENTS }|--|| SECTORS : "belongs_to"
    USERS ||--o{ SECTORS : "owns"
    OTP_VERIFICATIONS ||--|| USERS : "verifies"
    SETTINGS_SECURITY ||--o{ ALERTS : "governs"
    
    USERS {
        uuid id PK
        string email
        string role "ADMIN | ANALYST | SECTOR_OWNER"
        string sector "HEALTHCARE | AGRICULTURE | URBAN"
        string name
        boolean is_verified
    }
    
    ALERTS {
        uuid id PK
        string sector
        string type "DDoS | MITM | RANSOMWARE | etc."
        string severity "HIGH | MEDIUM | LOW"
        float risk_score
        string status "ACTIVE | RESOLVED"
        string resolution_type "AUTOMATED | MANUAL"
        uuid resolved_by FK
    }

    EVENTS {
        uuid id PK
        string sector
        string type
        string severity
        jsonb metadata "Raw Telemetry & 36 Features"
    }

    SECTORS {
        uuid id PK
        string name "HEALTHCARE | AGRICULTURE | URBAN"
        boolean is_enabled
        uuid owner_id FK
    }
```

---

## 🔬 COGNITIVE INTELLIGENCE (ML)

The KavachX Cognitive Engine distills 36 raw telemetry points into **7 Essential Vulnerability Pillars**:

| Pillar | Focus Area | High-Risk Indicators |
| :--- | :--- | :--- |
| **Login Failure Sigma** | Identity & Access | Bruteforce, Credential Stuffing, Parallel Auth |
| **Payload Entropy** | Network Traffic | Anomalous Packet Size, Buffer Overflows, Malformed Headers |
| **SYN-Flood Coefficient** | Availability | TCP State Exhaustion, DDoS, Half-Open Connections |
| **MITM Risk Index** | Data Integrity | ARP Spoofing, SSL/TLS Mismatch, Certificate Hijacks |
| **Ransomware Vector** | File Integrity | Unauthorized IO, Modification Rate Spikes, Encrypted Extension Renames |
| **Topology Scan Risk** | Reconnaissance | Port Scanning, Horizontal Movement, Nmap Indicators |
| **Phishing Probability** | Human Vector | Domain Age, Keyword Entropy, URL Redirections |

---

## 🛡️ DEFENSIVE MEASURES & CONTROLS

| Control | Protocol | Operational Outcome |
| :--- | :--- | :--- |
| **Autonomous Defense** | Direct Suppression | Automated firewall rules & IP blocking for HIGH severity threats. |
| **Identity Sovereignty** | JWT/HTTP-Only | Zero-persistence session tokens; immunity to XSS-based hijacking. |
| **Database Isolation** | Postgres RLS | Strict Row-Level Security ensures SECTOR_OWNERS never bleed data. |
| **Telemetry Recalibration** | Dynamic Thresholds | Admins can adjust ML sensitivity (Sigma thresholds) on the fly. |
| **Cryptographic Rotation** | API Key Cycling | Instant token expiration to neutralize compromised data streams. |

---

## ⚙️ DEPLOYMENT SOP

Initialize the KavachX ecosystem following this precise sequence:

### **SOP-01: ML COGNITIVE ENGINE**
```bash
cd ML
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### **SOP-02: RESILIENCE GATEWAY (BACKEND)**
```bash
cd backend
npm install
# Configure .env with Supabase & Redis credentials
npm run dev
```

### **SOP-03: OPERATOR HUB (FRONTEND)**
```bash
cd frontend
npm install
npm run dev
```

---

## 🤝 PROJECT CONTRIBUTORS

*Lead Command & Contributors to be documented...*

---

<div align="center">

**[ 🛡️ SECURE ] [ ⚡ RESILIENT ] [ 🧠 AUTONOMOUS ]**

```text
--------------------------------------------------------------------------------
[ KAVACH-X CORE ] [ SECURITY PROTOCOL: V4.0 ] [ AUTHORIZED ACCESS ONLY ]
--------------------------------------------------------------------------------
```

*DESIGNED FOR THE ADVANCED AGENTIC CODING CHALLENGE*  
*Team: Cache Me If You Can*

</div>
