# Changelog

All notable changes to Portfolio Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-08-10

### ⚠️ Important Update Notice
**After updating to v0.3.1, users should run Settings → Update Historical Prices** to benefit from the new performance optimizations and ensure portfolio data integrity. This rebuilds your portfolio timeline using the dramatically improved in-memory processing introduced in this version.

### 🚀 Performance Improvements
- **Optimized Evolution Timeline Recalculation**: Dramatically improved speed using in-memory data processing instead of database queries per date
- **Intelligent Partial Rebuilds**: Evolution timeline now rebuilds only from affected dates instead of complete recalculation, improving performance by up to 70%
- **Pre-loaded Data Processing**: Added `calculatePortfolioStateOptimized` method for efficient batch data processing

### 🐛 Critical Bug Fixes
- **Fixed SQL Binding Errors**: Resolved "Wrong API use: tried to bind a value of an unknown type (undefined)" error when updating sales
- **Fixed Portfolio Entry Deletion**: Resolved "getPortfolioStateAsOfDate is not a function" error when deleting portfolio entries
- **Fixed Loading Indicators**: Added missing spinner animations for tax update operations
- **Fixed UI Label Issues**: Corrected "Current option:" label display during evolution timeline rebuild phase
- **Fixed Version Display**: Resolved version showing "Loading..." in packaged builds with retry mechanism and fallback values

### 🔄 Code Quality & Maintenance
- **Removed Dead Code**: Cleaned up ~240 lines of obsolete recalculation methods and duplicate functions
- **Standardized Operations**: All portfolio operations now use the same optimized recalculation approach for consistency
- **Enhanced Error Handling**: Added proper parameter validation and SQL.js binding patterns throughout
- **Dynamic Version Management**: Window title and footer now properly fetch version information from package.json

### ⚡ Technical Enhancements
- Tax amount updates now properly trigger evolution recalculation (affects unrealized gains calculations)
- Enhanced createPortfolioSnapshot method with optimized portfolio state calculation
- Improved IPC communication reliability in packaged builds
- Better fallback handling for version display in offline scenarios

### 🛠️ Developer Experience
- Consistent SQL.js binding patterns across all database operations
- Improved debugging with better error messages and logging
- Streamlined codebase with unified recalculation methodology

## [0.3.0] - 2025-08-10

### Added
- **🕐 Historical Price Management System**: Complete historical price integration
  - **Automatic Historical Price Fetching**: System automatically fetches real grant date prices when adding new grants
  - **Smart Price Derivation**: Intelligently derives missing grant date prices from next available trading day
  - **Bulk Historical Updates**: Settings → "Update Historical Prices" to rebuild historical data for entire portfolio
  - **Real-time Progress Tracking**: Visual progress bars for both price fetching and portfolio recalculation phases
  - **Data Quality Handling**: System rounds derived prices to nearest 10 for consistency (e.g., 50.41 → 50.00)
- **Enhanced Grant Addition Workflow**: 
  - Historical price modal with detailed fetch progress and results
  - Visual indicators for derived prices with tooltips explaining the source
  - User-controlled workflow - users manually proceed after reviewing fetched prices
- **Intelligent Progress Management**:
  - Timeline rebuild progress with detailed step-by-step feedback
  - Optimized progress updates (every 10%) to prevent UI overwhelming
  - Clear phase separation between data fetching and portfolio recalculation

### Enhanced
- **Portfolio Evolution Accuracy**: Portfolio timeline now uses actual historical grant date prices instead of hardcoded €10 values
- **Database Migration System**: Automatic migration for existing users to populate historical grant date prices
- **Price Update Efficiency**: Auto-update on startup only runs when prices are actually outdated, reducing unnecessary scraping
- **User Experience**: Historical price fetch modal no longer auto-closes, giving users control over the workflow

### Fixed
- **Grant Date Price Accuracy**: Replaced all hardcoded €10 values with real historical prices from grant dates
- **Timeline Rebuild Progress**: Fixed "18/17" display issue and static progress bar during portfolio recalculation
- **Tax Calculations**: Tax estimates now use actual fetched grant date prices instead of hardcoded values
- **Modal Management**: Historical price fetch modal properly shows only close button (not cancel) and prevents accidental closure during fetch
- **Performance Issues**: Reduced historical price update frequency to prevent UI freezing during large portfolio rebuilds

### Technical Improvements
- **Enhanced Historical Scraper**: Added grant date price derivation logic with comprehensive logging
- **Database Schema**: Added `grant_date_price` column with proper migration handling for existing users  
- **Progress Reporting**: Backend methods now support progress callbacks for real-time UI updates
- **Error Handling**: Improved error handling and user feedback during historical price operations
- **CSS Styling**: Added visual styling for derived price indicators with hover tooltips

### Performance Notes
- **Processing Time**: Historical price updates can take 5-15 minutes for large portfolios depending on grant count
- **Internet Requirement**: Historical price fetching requires active internet connection
- **Background Processing**: System processes historical data in phases with clear visual feedback

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

### Version 0.3.0 Highlights
This major release introduces **intelligent historical price management**, transforming portfolio accuracy from hardcoded estimates to real historical grant date prices. The system now automatically fetches and derives accurate historical prices, providing true portfolio evolution tracking with comprehensive progress feedback during processing.

**Key Features:**
- **Automatic Historical Price Integration**: Real grant date prices replace €10 estimates
- **Smart Price Derivation**: Handles missing data by intelligently deriving from available dates  
- **Bulk Portfolio Updates**: Rebuild entire portfolio historical data with visual progress tracking
- **Enhanced Accuracy**: Tax calculations and evolution tracking now use actual historical prices

⚠️ **Important**: First-time historical price update may take 5-15 minutes depending on portfolio size. This is a one-time process that significantly improves portfolio accuracy.

### Version 0.2.0 Highlights  
Enhanced user experience with improved portfolio analysis capabilities and real-time profit/loss calculations based on user-selected time periods.

### Upgrade Instructions
1. Close the existing Portfolio Tracker application
2. Download and install version 0.3.0
3. Your existing data will be preserved automatically  
4. **First Launch**: System will automatically migrate database to support historical prices
5. **Recommended**: Run "Settings → Update Historical Prices" to populate accurate grant date prices (may take several minutes)

### Known Issues
- Historical price updates require stable internet connection
- Large portfolios (15+ grants) may require extended processing time for historical updates

### Future Roadmap
- Enhanced reporting capabilities with historical price insights
- Portfolio performance benchmarking against historical data
- Additional chart types leveraging historical price accuracy
- Advanced filtering and search features with historical context