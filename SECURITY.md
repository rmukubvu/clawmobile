# Security Policy

## Supported Versions

Security fixes are applied to the latest `main` branch.

## Reporting A Vulnerability

Do not open public issues for suspected security vulnerabilities.

Report vulnerabilities privately to: security@picoclaw.dev

Include:

- Affected component/file
- Reproduction steps or proof of concept
- Potential impact
- Suggested mitigation (if available)

We will acknowledge receipt within 72 hours and provide status updates as we
triage and remediate.

## Secret Hygiene

Before opening a pull request, verify that no secrets are committed:

- API keys
- Access tokens
- Signing keys or certificates
- Personal production endpoints

If credentials are leaked, rotate them immediately and notify maintainers.
