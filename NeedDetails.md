# Project Details: Cyber-Resilient Infrastructure Platform (CRIP)

## Objectives of developing software/application:
The main goal of this software is to build a "digital security guard" for critical industries like hospitals, farms, and city utilities. Just like a physical security guard watches cameras and stops intruders, this platform watches computer networks to:
1.  **Spot Hackers Instantly:** Use smart computer programs (Machine Learning) to recognize when someone is trying to break in, even if they are using new tricks.
2.  **Stop Attacks Automatically:** If a threat is found, the system immediately blocks the attacker or shuts down the connection without waiting for a human to press a button.
3.  **Give Clear Warnings:** Show a simple dashboard to the people in charge so they can see exactly what is happening in real-time, like a weather map for cyber attacks.
4.  **Keep Records for Bosses:** Automatically create report cards (PDFs) that show how well the system is working, which is useful for checking safety rules.
5.  **Protect Secret Information:** Make sure that only the right people can log in and that all data is locked safely away from prying eyes.

## List of Keywords:
*   **Simple Terms:** Digital Security Guard, Automatic Defense, Hacker Detection, Real-Time Monitoring, Safety Reports, User Levels.
*   **Technical Terms:** Intrusion Detection System (IDS), Anomaly Detection, Machine Learning, Role-Based Access Control (RBAC), Encryption, Firewall, Threat Intelligence, Two-Factor Authentication.

## End-Users of the software:
This software is built for three main types of people who work in security:

1.  **System Administrator (The "Chief of Police"):**
    *   **Role:** The person who sets the rules for the whole system.
    *   **What they do:** They decide how strict the security should be, create keys for devices to connect, and make sure the whole system is running smoothly.
2.  **Sector Owner (The "Department Head"):**
    *   **Role:** The manager responsible for one specific area, like the "Head of Hospital IT" or "Farm Manager."
    *   **What they do:** They get alerts only about their own area and can approve special actions to protect their specific equipment.
3.  **Security Analyst (The "Detective"):**
    *   **Role:** The expert who investigates suspicious activity.
    *   **What they do:** They look at the detailed data charts to figure out if a weird event was just a glitch or a real hacker attack.

## Listing of functionality/features/main modules to be provided in the software:

### 1. User Access & Security Module
This module handles everything related to who is allowed to enter the system.
*   **Secure Login (Submodule):**
    *   Users log in with their email and password, but to be extra safe, we also send a rigorous code to their email (OTP) that they must enter. This is like having two locks on a door.
*   **Role Management (Submodule):**
    *   The system knows the difference between a "Boss" (Admin) and a "Worker" (Analyst). It automatically hides buttons and sensitive data from people who aren't supposed to see them.
*   **Session Protection (Submodule):**
    *   When someone logs in, we give them a digital "badge" (cookie) that is invisible to hackers. This ensures that even if a hacker tricks a user, they can't steal their login session easy.

### 2. Data Collection & Processing Module
This module is the "ears" of the system, listening to everything happening on the network.
*   **Live Data Feed (Submodule):**
    *   The system watches a constant stream of information coming from devices (like login attempts or sensor readings) in real-time, just like a stock market ticker.
*   **High-Speed Traffic Control (Submodule):**
    *   We use a super-fast memory system (Redis) to organize this data so the system doesn't get overwhelmed, even if thousands of events happen at once.
*   **Secure Archives (Submodule):**
    *   Every single event is written down permanently in a secure database (Supabase), creating a history book of everything that has ever happened.

### 3. Intelligent Threat Detection Module (The "Brain")
This is the smart part of the system that decides if something is dangerous.
*   **Behavior Analysis (Submodule):**
    *   Instead of just looking for "bad words," the system looks at *behavior*. For example, if a user who usually logs in once a day suddenly logs in 50 times in a minute, the system knows that is suspicious.
*   **AI Judgment (Submodule):**
    *   We use Artificial Intelligence to give every event a "danger score." If the score is high, it marks it as a threat (like "High Severity Attack").
*   **Fail-Safe Mode (Submodule):**
    *   If the AI ever stops working, the system automatically switches to a backup set of rigid rules to keep everyone safe, so security is never turned off.

### 4. System Control & Governance Module
This module gives the Admins the knobs and dials to control the platform.
*   **Sensitivity Settings (Submodule):**
    *   Admins can turn a dial to make the system more paranoid (Strict) or more relaxed (Lenient) depending on the threat level of the day.
*   **Device Key Management (Submodule):**
    *   Admins can create unique digital "passports" (API Keys) for every device. If a device is stolen, they can cancel its passport instantly.
*   **Health Check (Submodule):**
    *   The system monitors its own heartbeat, checking things like memory usage and connection speed to ensure it doesn't crash.

### 5. Incident Response Module
This module acts like the "reflexes" of the system—acting fast when there is pain.
*   **Smart Alerts (Submodule):**
    *   When a threat is found, the system explains *why* it thinks it's bad (e.g., "This IP address is trying too many passwords").
*   **Instant Defense (Submodule):**
    *   With one click, a security officer can "Block IP" to ban an attacker or "Disable User" to lock a compromised account immediately.
*   **Sector Notification (Submodule):**
    *   If a hospital is under attack, the system sends an urgent email specifically to the Hospital Manager, not bothering the Farm Manager.

### 6. Dashboard & Reporting Module
This module shows the data in a way humans can read easily.
*   **Live Threat Map (Submodule):**
    *   A visual dashboard showing charts and graphs that update continuously, so you can watch the security status live.
*   **Executive Dossiers (Submodule):**
    *   The system can generate a professional PDF report with one click. This is perfect for showing the boss or an auditor that everything is under control.
*   **Device Analytics (Submodule):**
    *   Detailed gauges (like a car dashboard) showing exactly how hard the computer servers are working.
