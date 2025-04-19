# Changelog

## 1.3.0

### Added

- Support for multiple hash algorithms (SHA-1, SHA-256, SHA-512)
- Custom character set support for token generation
- Configurable token length (digits)
- Configurable time period
- Built-in rate limiting utility to prevent brute force attacks
- Enhanced QR code URI generation with algorithm, digits, and period parameters
- Comprehensive tests for all new features
- Updated documentation with examples for new features

### Changed

- Updated API to support more configuration options
- Improved type definitions for better TypeScript support
- Enhanced security recommendations in documentation

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-04-19

### Minor Changes

- 612bfe6: Enhanced documentation and UI improvements:
  - Added comprehensive README with detailed examples and API documentation
  - Added npm badges and improved visual presentation
  - Added motivation section and security considerations
  - Updated demo React component with improved UI/UX features:
    - Added copy buttons for secret and token
    - Added visual countdown timer
    - Improved layout with two-column design
    - Added toast notifications for copy actions
  - Fixed API documentation to match current implementation
  - Updated GitHub profile links and attribution

## [1.1.0] - 2024-03-21

### Added

- Enhanced README with comprehensive documentation and examples
- Added beautiful badges for npm version, license, downloads, and bundle size
- Added detailed motivation section explaining the package's purpose
- Added complete React component examples
- Added extensive API documentation
- Added QR code generation examples
- Added security considerations section

### Changed

- Updated the demo React component with improved UI/UX
- Improved code examples in documentation
- Updated footer with correct GitHub profile link

### Fixed

- Fixed documentation for API parameters and return types
- Corrected example code to match current API implementation
