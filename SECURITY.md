# Security Policy

## Supported Versions

RepoLens is under active development.

| Version        | Supported   |
| -------------- | ----------- |
| Latest release | Yes         |
| Older releases | Best effort |

Security fixes will generally target the latest release.

## Reporting a Vulnerability

Please **do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

If you believe you have found a security vulnerability in RepoLens, please report it privately through GitHub's **private vulnerability reporting** feature when available.

If private reporting is unavailable, contact the maintainer through the contact information available on the repository profile.

### Please Include

When reporting a vulnerability, please provide:

* A clear description of the vulnerability
* The affected version, tag, or commit
* Steps to reproduce the issue
* Expected and actual behavior
* Relevant logs, screenshots, or proof of concept where appropriate
* Any potential security impact you identified

Please **do not include passwords, access tokens, API keys, personal information, or other sensitive data** in your report.

## Responsible Disclosure

Please allow reasonable time for the vulnerability to be investigated and addressed before publicly disclosing security-sensitive details.

Security reports will be reviewed based on their severity, reproducibility, and potential impact.

Where appropriate, the maintainer may provide a fix, mitigation, or additional guidance before public disclosure.

## Scope

This policy covers security vulnerabilities in RepoLens itself, including:

* Repository ingestion
* Static analysis
* Backend and REST APIs
* Web UI
* CLI
* Repository-source handling
* GitHub integration

Third-party dependencies should generally be reported through the security process of the affected upstream project, unless the vulnerability specifically affects how RepoLens uses or integrates that dependency.

## Security Considerations

RepoLens analyzes repository source code and project metadata. Users should avoid providing repositories containing secrets or sensitive information unless they understand and accept the risks associated with analyzing that content.

RepoLens should not be considered a secret-management or security-scanning system unless a feature is explicitly documented as providing such functionality.

## Policy Updates

This policy may be updated as RepoLens evolves and its security reporting and response processes become more mature.
