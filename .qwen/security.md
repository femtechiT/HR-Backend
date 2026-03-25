# Security

## Core Philosophy
Security is not a feature you add at the end — it's a habit you build into every decision.
Assume all external input is hostile until proven otherwise.

## Input Validation
- Validate ALL input at the boundary of your system — APIs, CLI args, file reads, environment variables.
- Validate type, length, format, and range — not just presence.
- Reject invalid input early. Don't try to sanitize malicious input into safe input.
- Never trust data just because it came from your own database if it was originally user-supplied.

## Secrets & Credentials
- Never hardcode secrets, API keys, passwords, or tokens — not even temporarily.
- Use environment variables or a secrets manager. Always.
- Never log secrets, even partially. Mask them in all output.
- Rotate credentials if they are ever accidentally exposed, no exceptions.

## Authentication & Authorization
- Authentication = who you are. Authorization = what you're allowed to do. Never confuse them.
- Always verify authorization on every protected action — don't assume a logged-in user has permission.
- Use short-lived tokens. Implement token refresh, not long expiry.
- Never implement your own crypto. Use established, maintained libraries.

## Common Vulnerabilities
- SQL/NoSQL Injection: Always use parameterized queries or ORMs. Never concatenate user input into queries.
- XSS: Never inject raw user content into HTML. Always encode output in the appropriate context.
- CSRF: Use anti-CSRF tokens for state-changing requests.
- Path traversal: Sanitize and validate all file paths derived from user input.
- Dependency risk: Keep dependencies updated. Audit them regularly.

## Data
- Store only what you need. The best way to protect data is to not have it.
- Hash passwords with a strong, slow algorithm (bcrypt, argon2). Never store plaintext or MD5/SHA1.
- Encrypt sensitive data at rest if it could cause harm if the database is compromised.

## Error Messages
- Never expose stack traces, internal paths, or system details in production error responses.
- Errors should be helpful to legitimate users, not informative to attackers.
