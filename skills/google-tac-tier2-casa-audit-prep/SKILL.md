---
name: google-tac-tier2-casa-audit-prep
description: >-
  Prepares codebases for Google TAC Tier 2 and CASA Tier 2 application security
  assessments (third-party / CASA-style SAQ, OWASP ASVS themes on external interfaces).
  Maps the standard 23-item self-assessment questionnaire to file-level evidence, tests,
  and gaps; guides hardening OAuth, webhooks, APIs, crypto, and logging. Use when
  prepping for Google ecosystem security review, CASA workbook evidence, building an
  audit evidence pack, answering assessors with repo pointers, tracing SAQ items to
  source, or searching for TAC Tier 2 / CASA audit prep.
---

# Google TAC Tier 2 / CASA application security audit prep (code-first)

**Search terms:** TAC Tier 2, CASA Tier 2, Google app security assessment, third-party security review, SAQ evidence.

## Purpose

Prepare for **TAC Tier 2** (third-party / application security assessment in Google’s ecosystem; commonly aligned with **CASA Tier 2** and **OWASP ASVS** themes on **externally accessible interfaces**).

**Primary focus: the codebase** — auth, APIs, OAuth, webhooks, crypto, logging, deletion, and mobile surfaces. Documentation and the **self-assessment questionnaire (SAQ)** exist to **organize evidence**, not to replace implementation proof.

**Secondary focus: the SAQ** — The 23 standard items below are a **coverage matrix**. For each item, the default deliverable is:

1. **Code path(s)** — file + symbol or route (e.g. `convex/http.ts` `/oauth/...`, `requireIdentity` in `convex/lib/auth.ts`).
2. **Test or scan** — test file, CI job, or honest “not covered / manual process.”
3. **Gap** — if Partial/No/N/A: one sentence why, plus fix or process owner.

Do **not** lead with narrative paragraphs; lead with **traceability**. Narratives belong in an evidence pack **after** code pointers are stable.

## How to work (agent workflow)

1. **Inventory attack surface in code** — List HTTP routes, serverless handlers, OAuth/callback URLs, webhooks, public client entry points, env-driven secrets.
2. **Map SAQ items → evidence** — For each of the 23 items, fill: Applicable (Yes/No/N/A/Partial), **primary code reference**, tests, gap.
3. **Harden and test** — Prefer TDD for security fixes; add or extend tests that fail if the control regresses.
4. **Document** — Short evidence pack (diagrams, data flow, env matrix) that **links to** the same paths already cited in step 2.
5. **Scans** — Dependency audit, SAST, secret scan, optional DAST; record in `preaudit-results` or equivalent.
6. **Sanitized bundle** — If required: minimal zip + root `package.json` + lockfile + README pointing to auth/OAuth directories (no `.env`, no `node_modules`).

## Core principles

- **Code is the source of truth** — If the SAQ says “verify X,” the answer is incomplete without **where in repo X is enforced or disclaimed**.
- **Honest applicability** — N/A with justification (e.g. no LDAP, no cookie sessions on mobile API-only flows). Partial is better than false Yes.
- **Platform vs application** — TLS at rest for managed DB, IdP session cookies, DNS: cite **provider** where your code does not implement the control; still document **your** configuration (e.g. Clerk dashboard, Convex env).
- **No enforcement on client alone** — Describe server-side checks (API, gateway, serverless, backend functions).

## SAQ checklist (full text) — map each row to code

Use this list as the **complete** question set. Wording follows the standard CASA-style workbook; numbering is fixed **1–23**.

| #      | Requirement (verbatim intent)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1**  | Verify documentation and justification of all the application's trust boundaries, components, and significant data flows.                                                                                                                                                                                                                                                                                                                                                                  |
| **2**  | Verify the application does not use unsupported, insecure, or deprecated client-side technologies such as NSAPI plugins, Flash, Shockwave, ActiveX, Silverlight, NACL, or client-side Java applets.                                                                                                                                                                                                                                                                                        |
| **3**  | Verify that trusted enforcement points, such as access control gateways, servers, and serverless functions, enforce access controls. Never enforce access controls on the client.                                                                                                                                                                                                                                                                                                          |
| **4**  | Verify that all sensitive data is identified and classified into protection levels.                                                                                                                                                                                                                                                                                                                                                                                                        |
| **5**  | Verify that all protection levels have an associated set of protection requirements, such as encryption requirements, integrity requirements, retention, privacy and other confidentiality requirements, and that these are applied in the architecture.                                                                                                                                                                                                                                   |
| **6**  | Verify that the application employs integrity protections, such as code signing or subresource integrity. The application must not load or execute code from untrusted sources, such as loading includes, modules, plugins, code, or libraries from untrusted sources or the Internet.                                                                                                                                                                                                     |
| **7**  | Verify that the application has protection from subdomain takeovers if the application relies upon DNS entries or DNS subdomains, such as expired domain names, out of date DNS pointers or CNAMEs, expired projects at public source code repos, or transient cloud APIs, serverless functions, or storage buckets (`*autogen-bucket-id*.cloud.example.com`) or similar. Protections can include ensuring that DNS names used by applications are regularly checked for expiry or change. |
| **8**  | Verify that the application has anti-automation controls to protect against excessive calls such as mass data exfiltration, business logic requests, file uploads or denial of service attacks.                                                                                                                                                                                                                                                                                            |
| **9**  | Verify that files obtained from untrusted sources are stored outside the web root, with limited permissions.                                                                                                                                                                                                                                                                                                                                                                               |
| **10** | Verify that files obtained from untrusted sources are scanned by antivirus scanners to prevent upload and serving of known malicious content.                                                                                                                                                                                                                                                                                                                                              |
| **11** | Verify API URLs do not expose sensitive information, such as the API key, session tokens etc.                                                                                                                                                                                                                                                                                                                                                                                              |
| **12** | Verify that authorization decisions are made at both the URI, enforced by programmatic or declarative security at the controller or router, and at the resource level, enforced by model-based permissions.                                                                                                                                                                                                                                                                                |
| **13** | Verify that enabled RESTful HTTP methods are a valid choice for the user or action, such as preventing normal users using DELETE or PUT on protected API or resources.                                                                                                                                                                                                                                                                                                                     |
| **14** | Verify that the application build and deployment processes are performed in a secure and repeatable way, such as CI / CD automation, automated configuration management, and automated deployment scripts.                                                                                                                                                                                                                                                                                 |
| **15** | Verify that the application, configuration, and all dependencies can be re-deployed using automated deployment scripts, built from a documented and tested runbook in a reasonable time, or restored from backups in a timely fashion.                                                                                                                                                                                                                                                     |
| **16** | Verify that authorized administrators can verify the integrity of all security-relevant configurations to detect tampering.                                                                                                                                                                                                                                                                                                                                                                |
| **17** | Verify that web or application server and application framework debug modes are disabled in production to eliminate debug features, developer consoles, and unintended security disclosures.                                                                                                                                                                                                                                                                                               |
| **18** | Verify that the supplied Origin header is not used for authentication or access control decisions, as the Origin header can easily be changed by an attacker.                                                                                                                                                                                                                                                                                                                              |
| **19** | Verify that cookie-based session tokens utilize the `SameSite` attribute to limit exposure to cross-site request forgery attacks. ([C6](https://owasp.org/www-project-proactive-controls/#div-numbering))                                                                                                                                                                                                                                                                                  |
| **20** | Verify that the application protects against LDAP injection vulnerabilities, or that specific security controls to prevent LDAP injection have been implemented. ([C4](https://owasp.org/www-project-proactive-controls/#div-numbering))                                                                                                                                                                                                                                                   |
| **21** | Verify that the application protects against Local File Inclusion (LFI) or Remote File Inclusion (RFI) attacks.                                                                                                                                                                                                                                                                                                                                                                            |
| **22** | Verify that regulated private data is stored encrypted while at rest, such as Personally Identifiable Information (PII), sensitive personal information, or data assessed likely to be subject to EU's GDPR.                                                                                                                                                                                                                                                                               |
| **23** | Verify that all cryptographic operations are constant-time, with no 'short-circuit' operations in comparisons, calculations, or returns, to avoid leaking information.                                                                                                                                                                                                                                                                                                                     |

### Per-row code-first template (use when filling the workbook)

```text
#N [one-line title]
Applicable: Yes | No | N/A | Partial
Code: path/to/file.ext (function or route) — what enforces or proves this
Tests: path/to/test or "none — add"
Platform/process: only if control is mostly IdP/hosting (name provider + what you configure)
Gap: if Partial/No — concrete next step
```

## Typical code hunt patterns (TAC / CASA Tier 2)

- **AuthZ** — Middleware, route guards, `ctx.auth`, `require*` helpers, per-row checks in DB handlers (not only route existence).
- **Secrets** — Env usage; compare shared secrets with constant-time helpers where applicable; no secrets in URLs.
- **OAuth / OIDC** — Callback handling, state/nonce, redirect allowlists, token storage, refresh revocation.
- **HTTP surface** — Explicit methods/paths; webhook verification (HMAC, OIDC JWT).
- **Logging** — No token bodies; redact PII; `__DEV__` vs production logging on clients.
- **Crypto** — At-rest encryption for app-managed keys; avoid claiming global constant-time (#23)—cite specific comparisons (e.g. timing-safe string compare for shared secrets).

## Scans and bundle (supporting evidence, not the main story)

- **Scans** — Record commands, dates, outcomes in one file; attach CI output when possible.
- **SAST zip** — Root manifest + lockfile + relevant packages; `README` maps reviewers to auth/OAuth/backend dirs; strip `.env*` and `node_modules`.

## Output format (when assisting the user)

1. **Surface map** — Bulleted list of security-relevant code areas with paths.
2. **SAQ 1–23 table** — Applicable + **Code:** line for each (or N/A reason).
3. **Gaps / remediation** — Ordered by severity.
4. **Evidence pack outline** — Links to diagrams/docs **after** code table is filled.

## What not to do

- Do not treat the SAQ as finished work without **file-level** evidence.
- Do not over-claim **#6** (SRI everywhere) or **#23** (all crypto constant-time) without proof.
- Do not ship secrets in bundles or paste live keys into chat.

---

Adapt paths and stack (React Native, Next.js, Convex, Firebase, etc.) to the repository under review.
