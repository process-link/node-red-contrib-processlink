# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-02-16

### Added

- **notify group** node for sending notifications to managed ProcessMail groups
- Channel-agnostic delivery: ProcessMail fans out to email/SMS per member preferences
- File attachment support (inline or link-only) for group notifications
- Unit tests for notify-group request body building and validation

## [1.0.4] - 2025-02-05

### Added

- Timestamp prefix option: automatically prefix filenames with `YYYY-MM-DD_HH-MM-SS_`
- Improved filename documentation explaining how it appears in Process Link Files

## [1.0.3] - 2025-02-05

### Added

- Importable JSON example flow in README for easy customer onboarding

## [1.0.2] - 2025-02-05

### Changed

- Switch to Bearer token authentication (`Authorization: Bearer <apiKey>`)
- Update documentation to reference Process Link Portal → Developer → API Keys
- Add Process Link logo to README header

## [1.0.0] - 2025-02-03

### Added

- Initial release
- **files upload** node for uploading files to Process Link Files API
- **processlink-config** configuration node for credential management
- Support for dynamic filenames via `msg.filename`
- Status indicators for upload progress
- Comprehensive error handling with status codes
- Example flow included
- Process Link branding (logo and banner)

### API

- Authentication uses Bearer token (`Authorization: Bearer <apiKey>`)
- Site identification via `x-site-id` header
- Get credentials from Process Link Portal → Developer → API Keys

### Security

- API keys stored encrypted by Node-RED
- All API communication over HTTPS
- Keys never logged or exposed in flow exports
