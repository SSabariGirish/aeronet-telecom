# Security Audit Report: AeroNet Telecom Portal

**Date:** May 2026  
**Lead Auditor:** Sabari Girish Srinivasan
**Scope:** AeroNet Customer Portal (Dockerised 3-Tier Architecture)  
**Frameworks Applied:** OWASP Top 10 (2021), CIS Docker Benchmarks  

---

## 1. Executive Summary

A comprehensive security and architecture audit of the AeroNet Telecom portal was conducted to assess the security posture of both the application layer and the underlying Docker infrastructure. The audit revealed a critical attack chain spanning Application Security (AppSec) and Infrastructure Security (InfraSec). 

An attacker can leverage broken JSON Web Token (JWT) authentication to bypass access controls. Combined with a lack of client-side validation, this exposes hidden administrative diagnostic tools. From there, a Server-Side Request Forgery (SSRF) vulnerability allows the attacker to bypass the Docker network firewall and extract hardcoded cloud credentials from internal microservices. Immediate remediation is required across the Software Development Life Cycle (SDLC).

---

## 2. Risk Register Summary

| Risk ID | Category | Vulnerability | Severity (CVSS) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **APP-001** | AppSec | Broken Authentication (Weak JWT Secret) | Critical (9.1) | OPEN |
| **INF-001** | InfraSec | Hardcoded Secrets & Insecure Fallbacks | Critical (9.8) | OPEN |
| **APP-002** | AppSec | Server-Side Request Forgery (SSRF) | High (8.6) | OPEN |
| **INF-002** | InfraSec | Container Process Running as Root | High (7.5) | OPEN |
| **INF-003** | InfraSec | Exposed Internal Database Ports | Medium (5.3) | OPEN |
| **APP-003** | AppSec | UI Spoofing (Unverified Client-Side State) | Medium (4.3) | OPEN |

---

## 3. Detailed Findings & Remediation Plan

### ### APP-001: Broken Authentication (Weak JWT Secret)
* **Description:** The JSON Web Token (JWT) implementation utilises a weak and guessable secret key (`aeronet_secret`). 
* **Impact:** Attackers can intercept their own token, crack the signature offline using dictionary attacks, manipulate the payload to elevate their privileges to `role: admin`, and re-sign the token.
* **Remediation:** 1. Generate a cryptographically secure, 256-bit random string for the JWT secret.
  2. Inject the secret into the Flask application via environment variables.

### ### INF-001: Hardcoded Secrets & Insecure Fallbacks
* **Description:** Database passwords and AWS IAM access keys are stored in plaintext within `docker-compose.yml`. Furthermore, the Python backend utilises insecure hardcoded fallback values if environment variables fail to load (The "Fallback Trap").
* **Impact:** If the repository is compromised, threat actors can immediately hijack the database and AWS cloud environment. Insecure fallbacks ensure the app boots in a vulnerable state rather than failing safely.
* **Remediation:** 1. Migrate all plaintext secrets to a local `.env` file and update `.gitignore`.
  2. Update `docker-compose.yml` to reference variables dynamically (`${MYSQL_ROOT_PASSWORD}`).
  3. Enforce strict `os.environ` checks in Python to trigger a fatal application crash if secure secrets are missing.

### ### APP-002: Server-Side Request Forgery (SSRF)
* **Description:** The `/api/admin/system_ping` endpoint accepts arbitrary URLs from users and fetches them via the Python backend without sanitization.
* **Impact:** Allows an attacker to use the backend server as a proxy to scan the internal Docker bridge network and interact with hidden, unauthenticated microservices (e.g., the Legacy Backup container).
* **Remediation:** 1. Implement a strict URL Allowlist using `urllib.parse` to verify the requested hostname before execution.

### ### INF-002: Container Process Running as Root
* **Description:** The backend `Dockerfile` does not specify a `USER` directive. Consequently, the Flask application runs with root privileges inside the container.
* **Impact:** If an attacker achieves Remote Code Execution (RCE), they inherit root privileges, significantly increasing the likelihood of a successful container escape to the host machine.
* **Remediation:** 1. Create a dedicated, low-privilege `appuser` within the `Dockerfile`.
  2. Append the `USER appuser` directive before the `CMD` instruction to enforce the Principle of Least Privilege.

### ### INF-003: Exposed Internal Database Ports
* **Description:** The MySQL database service in Docker Compose explicitly binds port `3306` to the host machine's port `3306`.
* **Impact:** Bypasses Docker's internal network isolation, exposing the database to the host's external network interfaces and increasing the risk of brute-force attacks.
* **Remediation:** 1. Remove the `ports: - "3306:3306"` mapping from the `db` service.

### ### APP-003: UI Spoofing (Unverified Client-Side State)
* **Description:** The React frontend relies solely on the unverified payload of a JWT stored in `localStorage` to render sensitive administrative UI components.
* **Impact:** An attacker can modify the token payload in their browser to trick the frontend into displaying the Admin Diagnostic Tool, constituting a failure in Defense in Depth.
* **Remediation:** 1. Implement a backend `/api/verify` endpoint.
  2. Require the React frontend to cryptographically validate the session token with the server upon page load before rendering administrative components.

---
**Sign-off:** *Audit documented and pending remediation execution.*