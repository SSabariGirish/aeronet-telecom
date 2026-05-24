# 🌐 AeroNet Telecom: DevSecOps & AppSec Portfolio Project

![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)
![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Backend-Python%20Flask-3776AB?logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql&logoColor=white)
![Security](https://img.shields.io/badge/Security-Hardened-brightgreen?logo=spring-security)

## Project Overview
AeroNet Telecom is a purposely built, containerised 3-tier web application designed to demonstrate applied **DevSecOps**, **Application Security (AppSec)**, and **Infrastructure Security (InfraSec)** methodologies. 

Initially engineered with a critical attack chain (involving JWT forgery, UI spoofing, and Server-Side Request Forgery), the project was formally audited and subsequently hardened to enterprise standards using Zero Trust principles, cryptographic validation, and Docker least-privilege configurations.

---

## Architecture
The application utilises a modern microservice architecture, fully orchestrated via Docker Compose:
**Frontend:** React.js (Vite) served via Nginx.
**Backend:** Python (Flask) REST API.
**Database:** MySQL 8.0 (utilising `bcrypt` for secure credential storage).
**Network:** Isolated internal Docker bridge network (`aeronet-network`).

---

## Security Vulnerabilities & Remediations
This project highlights a complete "Red-to-Blue" lifecycle. The following vulnerabilities were successfully identified, documented via GRC Audit, and patched at the source code and infrastructure levels.

### Application Security (AppSec)
| Vulnerability | Exploitation | Remediation (Implemented) |
| :--- | :--- | :--- |
| **Broken Authentication** | Offline dictionary attack against weak JWT signatures to forge `admin` roles. | Upgraded to cryptographically secure 256-bit keys injected via runtime environment variables. |
| **UI Spoofing** | Modifying `localStorage` to trick the React UI into revealing hidden admin components. | Engineered a backend `/api/verify` endpoint to enforce cryptographic session validation on page load. |
| **SSRF** | Leveraging internal API endpoints to bypass firewalls and read hidden microservices. | Implemented strict `urllib.parse` domain allowlisting and removed verbose error reflections. |
| **Insecure Passwords** | Database stored plaintext passwords. | Migrated database initialisation and Python logic to utilise `bcrypt` hashing. |

### Infrastructure Security (InfraSec)
| Vulnerability | Exploitation | Remediation (Implemented) |
| :--- | :--- | :--- |
| **Hardcoded Secrets** | AWS IAM Keys and DB passwords committed to `docker-compose.yml`. | Migrated to local `.env` vault. Enforced `os.environ` Zero-Trust fail-safes in Python to prevent insecure fallbacks. |
| **Root Execution** | Python backend container executed processes as the `root` user. | Rewrote Dockerfile to enforce the Principle of Least Privilege using a dedicated `appuser`. |
| **Exposed Ports** | MySQL port `3306` bound to host network interfaces. | Removed host port bindings; isolated DB strictly to the internal Docker bridge network. |

---

## Project Structure
```text
aeronet-telecom/
├── frontend/               # React Vite application & Nginx Dockerfile
├── backend/                # Python Flask API & secured Dockerfile
├── db_init/                # MySQL initialisation scripts (schema & bcrypt seeds)
├── docker-compose.yml      # Orchestration & isolated networking
├── .gitignore              # Secures .env and virtual environments
├── 01-AeroNet-Security-Audit.md      # Formal GRC Risk Assessment (Before)
└── 02-AeroNet-Remediation-Report.md  # Engineering Execution Report (After)