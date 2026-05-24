# Security Audit Report: AeroNet Telecom Portal

**Date:** May 2026

**Lead Auditor:** Sabari Girish Srinivasan

**Scope:** AeroNet Customer Portal (Dockerised 3-Tier Architecture)

**Frameworks Applied:** OWASP Top 10 (2021), CIS Docker Benchmarks


## 1. Executive Summary

A comprehensive security and architecture audit of the AeroNet Telecom portal was conducted to assess the security posture of both the application layer and the underlying Docker infrastructure. The audit revealed a critical attack chain spanning Application Security (AppSec) and Infrastructure Security (InfraSec).

While baseline defenses exist, severe implementation flaws negate them. An attacker can leverage broken JSON Web Token (JWT) authentication to bypass access controls. A Server-Side Request Forgery (SSRF) vulnerability, specifically a bypass in the domain allowlist via Open Redirects, allows the attacker to bypass the Docker network firewall and extract hardcoded cloud credentials from internal microservices. Furthermore, cryptographic failures in the database expose all user passwords in plaintext. Immediate remediation is required across the Software Development Life Cycle (SDLC).


## 2. Risk Register Summary

| **Risk ID** | **Category** | **Vulnerability**                            | **Severity (CVSS)** | **Status** |
| ----------- | ------------ | -------------------------------------------- | ------------------- | ---------- |
| **APP-001** | AppSec       | Broken Authentication (Weak JWT Secret)      | Critical (9.1)      | OPEN       |
| **INF-001** | InfraSec     | Hardcoded Secrets & Insecure Fallbacks       | Critical (9.8)      | OPEN       |
| **APP-002** | AppSec       | SSRF Allowlist Bypass (Open Redirect)        | Critical (9.1)      | OPEN       |
| **APP-004** | AppSec       | Cryptographic Failures (Plaintext Passwords) | High (8.8)          | OPEN       |
| **INF-002** | InfraSec     | Container Process Running as Root            | High (7.5)          | OPEN       |
| **APP-005** | AppSec       | Insecure CORS Configuration                  | Medium (5.4)        | OPEN       |
| **APP-006** | AppSec       | Denial of Service (Unhandled JWT Exception)  | Medium (5.3)        | OPEN       |
| **INF-003** | InfraSec     | Exposed Internal Database Ports              | Medium (5.3)        | OPEN       |
| **APP-003** | AppSec       | UI Spoofing (Unverified Client-Side State)   | Medium (4.3)        | OPEN       |


## 3. Detailed Findings & Remediation Plan

### APP-001: Broken Authentication (Weak JWT Secret)

- **Description:** The JSON Web Token (JWT) implementation utilises a weak and guessable secret key ('`aeronet_secret'`).

- **Impact:** Attackers can intercept their token, crack the signature offline, manipulate the payload to elevate privileges to `role: admin`, and re-sign the token.

- **Remediation:** Generate a cryptographically secure, 256-bit random string and inject it via environment variables.


### INF-001: Hardcoded Secrets & Insecure Fallbacks

- **Description:** Database passwords and AWS IAM access keys are stored in plaintext within `docker-compose.yml`. The Python backend utilises insecure hardcoded fallback values if variables fail to load.

- **Impact:** Repository compromise leads to immediate database and cloud hijacking.

- **Remediation:** Migrate plaintext secrets to a local `.env` file and enforce strict `os.environ` checks in Python to trigger a fatal application crash if secure secrets are missing.


### APP-002: SSRF Allowlist Bypass (Open Redirect)

- **Description:** The `/api/admin/system_ping` endpoint attempts to prevent SSRF via a domain allowlist. However, the `requests` library automatically follows HTTP redirects.

- **Impact:** An attacker can supply an allowed domain (e.g., `google.com`) that redirects to the internal `legacy-backup` container, bypassing the filter and stealing internal AWS/DB secrets.

- **Remediation:** Disable automatic redirects in the Python `requests` library (`allow_redirects=False`) and reject any response resulting in a 3XX status code.


### APP-004: Cryptographic Failures (Plaintext Passwords)

- **Description:** The database initialisation script (`init.sql`) inserts raw plaintext passwords. The backend login logic compares user input directly against these plaintext values.

- **Impact:** A database compromise immediately exposes all user credentials without requiring the attacker to crack any hashes.

- **Remediation:** Implement a strong hashing algorithm like `bcrypt`. Hash passwords before insertion and use `bcrypt.checkpw()` during the login flow.


### INF-002: Container Process Running as Root

- **Description:** The backend `Dockerfile` does not specify a `USER` directive, running the Flask application as root.

- **Impact:** If an attacker achieves Remote Code Execution (RCE), they inherit root privileges, increasing the likelihood of container escape.

- **Remediation:** Create a low-privilege '`appuser'` within the `Dockerfile` and append the `USER appuser` directive.


### APP-005: Insecure CORS Configuration

- **Description:** The Flask backend instantiates `CORS(app)` without parameters, defaulting to allowing all origins (`*`).

- **Impact:** Any malicious website visited by a user can send cross-origin API requests to the AeroNet backend, expanding the attack surface.

- **Remediation:** Restrict CORS origins strictly to the frontend application's URL.


### APP-006: Denial of Service (Unhandled JWT Exception)

- **Description:** The `/api/verify` endpoint splits the Authorisation header but passes the resulting array directly to `jwt.decode()`, triggering an unhandled `TypeError` instead of a standard token error.

- **Impact:** Causes a localised Denial of Service (HTTP 500) for authenticated features, breaking the API.

- **Remediation:** Extract the token string from the array index (e.g., `parts`) before passing it to the PyJWT library.


### INF-003: Exposed Internal Database Ports

- **Description:** The MySQL database binds port `3306` to the host machine.

- **Impact:** Exposes the database to external network interfaces, risking brute-force attacks.

- **Remediation:** Remove the `ports: - "3306:3306"` mapping from the `db` service.


### APP-003: UI Spoofing (Unverified Client-Side State)

- **Description:** The React frontend relies on an unverified JWT payload in `localStorage` to render administrative UI components.

- **Impact:** Attackers can modify the token in the browser to display the Admin Diagnostic Tool.

- **Remediation:** Require the React frontend to cryptographically validate the session token with a backend `/api/verify` endpoint upon page load.

**Sign-off:** _Audit documented and pending remediation execution._
