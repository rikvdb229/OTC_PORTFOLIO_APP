# Changelog

All notable changes to Portfolio Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-02

### Added
- **Evolution Tab Enhancement**: Added period-based profit/loss calculation display
  - Shows "Change since [date]: [amount] ([percentage])" in Evolution tab header
  - Dynamically calculates gain/loss based on selected time period (30 days, 90 days, 1 year, all time)
  - Real-time updates when switching between filter periods
  - Proper currency formatting with € symbol
  - Color-coded display (green for gains, red for losses)
- **Improved Tab System**: Enhanced tab header layout and functionality
  - Left-aligned statistics display with right-aligned filter buttons
  - Tab-specific content visibility (stats only show on Evolution tab)
  - CSS Grid layout for reliable horizontal alignment

### Fixed
- **Electron Startup Issues**: Resolved application startup problems
  - Fixed corrupted Electron installation preventing app launch
  - Cleaned up node_modules and reinstalled dependencies
- **Security Vulnerabilities**: Updated dependencies to fix security issues
  - Ran `npm audit fix` to resolve critical vulnerabilities
  - Updated deprecated packages (rimraf v5.0.1 → v6.0.1)
- **UI Layout Issues**: Fixed Evolution tab header layout problems
  - Resolved buttons appearing below text instead of horizontally aligned
  - Fixed stats appearing on all tabs instead of just Evolution tab
  - Implemented proper CSS Grid solution for consistent layout

### Changed
- **Version Management**: Updated version system
  - Application version updated from 0.1.0 to 0.2.0
  - Updated version references across codebase
  - Consistent version display in UI

### Technical Improvements
- **Code Organization**: Enhanced function structure and exports
  - Added `updateEvolutionPeriodStats` to DataLoader module
  - Improved error handling in evolution data calculations
  - Better separation of concerns between UI and business logic
- **CSS Architecture**: Improved styling system
  - Replaced complex flexbox with reliable CSS Grid layout
  - Simplified CSS with proper inheritance and specificity
  - Enhanced tab system integration

## [0.1.0] - 2025-07-09

### Added
- **Initial Release**: Portfolio Tracker application
  - Stock options portfolio management
  - Grant tracking and monitoring
  - Portfolio evolution visualization
  - Chart-based analysis tools
  - Sales history management
  - Tax calculation features
- **Core Features**:
  - Portfolio overview with total value calculations
  - Grant history with status tracking
  - Evolution tracking with historical data
  - Interactive charts and visualizations
  - Export and import capabilities
  - Database persistence with SQLite

### Technical Foundation
- **Electron Application**: Desktop app built with Electron framework
- **Database Integration**: SQLite database for data persistence
- **UI Framework**: Custom HTML/CSS/JavaScript interface
- **Modular Architecture**: Organized codebase with utility modules
- **Cross-Platform Support**: Windows, macOS, and Linux compatibility

---

## Release Notes

### Version 0.2.0 Highlights
This release focuses on enhancing the user experience with improved portfolio analysis capabilities. The standout feature is the new Evolution tab enhancement that provides real-time profit/loss calculations based on user-selected time periods, giving users better insights into their portfolio performance over time.

### Upgrade Instructions
1. Close the existing Portfolio Tracker application
2. Download and install version 0.2.0
3. Your existing data will be preserved automatically
4. No manual migration required

### Known Issues
- None reported for this version

### Future Roadmap
- Enhanced reporting capabilities
- Additional chart types and visualizations  
- Portfolio performance benchmarking
- Advanced filtering and search features