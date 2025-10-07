# Changelog

All notable changes to Portfolio Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-10-07

### ✨ New Features
- **Belgian Time-Based Updates**: Price updates now enforced after 09:00 Belgian time using external time API
  - No dependency on user's local system clock
  - Automatic DST handling via WorldTimeAPI and TimeAPI.io
  - Smart scheduling: auto-enables update button when time reached
  - Hybrid reliability: setTimeout + polling backup (handles computer sleep)
  - One update per day enforcement

### 🔧 Technical Improvements
- **New Time Service**: `services/timeService.js` provides Belgian time verification
  - Primary: WorldTimeAPI (http://worldtimeapi.org)
  - Fallback: TimeAPI.io (https://timeapi.io)
  - 2-minute buffer (09:02) ensures bank data is published
- **Smart Update Scheduler**: Auto-schedules update if app opens before 09:00
  - Primary timer to exact time (09:02)
  - Polling backup every 10 minutes (catches timer failures)
  - Both canceled once update completes
- **Enhanced Auto-Update**: Works correctly even if app starts before 09:00

### 🔒 Enforcement Rules
- Updates blocked before 09:00 Belgian time (clear user message with current time)
- Updates blocked if already updated today
- Applies to all grant types (KBC, ING, mixed portfolios)

### 🎯 User Experience
- Button states: "Available after 09:00" / "Update available" / "✅ Updated Today"
- Auto-enables at 09:00 (no manual refresh needed)
- Respects auto-update setting
- Works offline after initial time check

## [0.4.0] - 2025-10-06

⚠️ **IMPORTANT: Backup your database before installing this release.** While database migrations are tested, we recommend exporting your portfolio data (Settings → Export Database) before updating as a safety precaution.

### 🐛 Critical Bug Fixes - ING Grants

- **Fixed ING Grant Value Calculation**: ING grants now display correct total values in Portfolio tab
  - Root cause: ING API was returning price quotes with value = 0, which were being stored in database
  - Added filtering to exclude zero/null prices at all levels: API fetch, historical scraper, and database storage
  - Implemented database migration to automatically clean existing zero prices on app startup
  - ING grants now correctly contribute to total portfolio value calculations

- **Fixed Price History Matching**: Corrected price lookup for grants with same exercise price
  - Updated price_history JOIN to match on both `exercise_price` AND `grant_date` (previously only exercise_price)
  - Ensures grants with identical exercise prices but different grant dates get correct historical prices
  - Aligns portfolio overview calculation with evolution timeline logic
  - Particularly important for ING grants where multiple grants can share same underlying value

### 🔧 Technical Improvements

- **Enhanced ING Quote Validation**:
  - `fetchIngQuotes()` now filters out quotes with price ≤ 0 before processing
  - Historical scraper validates and reports filtered zero prices
  - Database storage layer prevents zero prices from being persisted
  - Clear error messages when all prices for an ISIN are zero

- **Database Migration System**:
  - Added `migrateRemoveZeroPrices()` migration to clean legacy data
  - Automatically removes zero/null prices from price_history table
  - Logs count of cleaned entries for transparency
  - Runs on app startup via existing migration framework

- **Improved Error Handling**:
  - Better error messages for ING grants with no valid price data
  - Prevents crashes when ING API returns invalid data
  - Graceful fallbacks for edge cases

### 📦 Upgrade Notes

1. **Automatic Migration**: On first launch of v0.4.0, zero prices will be automatically removed from your database
2. **Re-fetch ING Prices**: After upgrade, update prices for ING grants to fetch clean historical data
3. **Portfolio Values**: ING grant values should now display correctly in Portfolio tab and contribute to total portfolio value
4. **Evolution Timeline**: ING grants now properly appear in evolution timeline with "Grant received" notes (same as KBC grants)

### 🙏 Acknowledgments

Thanks to users who reported the ING grant value issue and helped identify the zero price root cause.

## [0.3.9] - 2025-10-05

⚠️ **IMPORTANT: Backup your database before installing this release.** While database migrations are tested, we recommend exporting your portfolio data (Settings → Export Database) before updating as a safety precaution.

### 🎉 Major New Feature - ING Grant Support
- **ING Employee Stock Options Support**: Full support for ING stock option plans alongside KBC
  - Add ING grants using ISIN (FOP number) from your ING option plan documents
  - Automatic product info retrieval from ING API using ISIN
  - Real-time historical price fetching for ING products
  - Dual-source portfolio management in single application
  - Separate pricing logic respecting ING vs KBC data structures

### ✨ ING-Specific Features
- **Improved Grant Addition UX**: Form fields now hidden until KBC/ING source is selected
  - Cleaner initial interface with two-step process
  - Clear instructional text: "Please select grant source (KBC or ING)"
  - Reduces confusion by showing only relevant fields for selected source
  - Prevents accidental submissions with wrong grant type
  - ISIN field appears only for ING grants

- **Accurate ING Grant Pricing**: ING grants now use actual first available historical price
  - Uses real market prices from ING API without artificial rounding
  - KBC grants retain rounding to nearest €10 as before
  - More accurate amount granted calculations for ING options
  - Historical price derivation respects source-specific requirements
  - First available price used for grant value (not current price)

### 🚀 Performance Optimizations
- **Smart Price Updates**: Price update process now only fetches for active/partially sold grants
  - Skips fully sold grants (quantity_remaining = 0)
  - Significantly faster update times for portfolios with historical sales
  - Reduces unnecessary API calls and processing time

### 🐛 Bug Fixes
- **Windows Exit Behavior**: Fixed app not properly closing on Windows
  - Removed problematic cleanup handlers causing process to hang
  - App now exits cleanly when all windows are closed
  - Simplified quit logic for better reliability

- **Build Configuration**: Fixed missing services directory in packaged builds
  - Added services/**/* to electron-builder files list
  - Resolves "Cannot find module './services/ingService'" error
  - Ensures all ING-related functionality works in production builds

### 🔧 Technical Improvements
- **ING Historical Price Flow**: Enhanced historical price fetching for ING grants
  - Properly updates `firstAvailablePrice` dataset attribute
  - Correctly passes price data through grant addition pipeline
  - Fixed modal display to show ING-specific price information
  - Automatic historical price fetch triggered on ISIN entry

### 🙏 Special Thanks
- **@TomGun87**: For the heavy lifting on ING implementation and core architecture
- All contributors and testers who helped refine the ING grant workflow

### 📦 Upgrade Notes
1. **Backup First**: Export your database before updating (Settings → Export Database)
2. Close existing Portfolio Tracker application
3. Install version 0.3.9
4. Your data will be preserved, but backup provides safety net for any migration issues
5. If adding ING grants: Historical prices will auto-fetch when you enter a valid ISIN

## [0.3.8] - 2025-09-26

### 🔧 Infrastructure Improvements
- **GitHub Actions Optimization**: Removed non-functional macOS build from CI/CD pipeline
  - Streamlined build process to Windows and Linux only
  - Reduced build time and eliminated macOS build failures
  - Updated release artifacts to exclude macOS DMG files
- **Build Configuration**: Cleaned up release workflow dependencies and artifact handling

### 📦 Release Process
- **Automated Releases**: Improved release pipeline reliability by focusing on supported platforms
- **Documentation**: Updated installation instructions to reflect Windows and Linux support only

## [0.3.7] - 2025-09-20

### ✨ New Features
- **Normalized Price % Column**: Added new column to portfolio table showing current price position within historical range
  - Shows percentage position between historical minimum and maximum prices (e.g., 73.2% = near historical high)
  - Color-coded display: green for high position (≥66%), red for low position (≤33%), neutral for middle range
  - Available in both portfolio table and detailed option info modal
  - Pre-calculated values for optimal performance

### 🔧 Technical Improvements
- **Backend Price Analysis**: Added `calculateNormalizedPricePercentage()` method to portfolio database
  - Fetches complete price history for each option during data loading
  - Handles edge cases: missing data, flat price history, invalid values
  - Returns null for options with insufficient historical data
- **Enhanced Portfolio Overview**: Extended `getPortfolioOverview()` to include normalized percentage calculations
- **UI Table Updates**: Expanded "Current Status and Performance" section from 4 to 5 columns

## [0.3.6] - 2025-08-18

### ✨ New Features
- **GitHub Actions CI/CD**: Added automated build pipelines for multi-platform releases
  - Automated Windows, macOS, and Linux builds on every release
  - Continuous integration testing on push and pull requests
  - Support for manual workflow triggers for testing

### 🔧 Improvements
- **Extended Bank Holidays**: Added Belgian bank holidays from 2026 to 2040
  - Comprehensive list of all Belgian national holidays
  - Excludes regional and compensatory holidays
  - Ensures accurate price update scheduling for the next 15 years

### 🐛 Bug Fixes
- **Fixed Automatic Price Update**: Resolved issue where automatic price update tried to update prices during non-bank work days
  - New function added `isBankWorkDay`
  - Prices update only when `isBankWorkDay = true` and `priceStatus.isCurrent = false`

## [0.3.5] - 2025-08-14

### 🐛 Bug Fixes
- **Fixed Sell Modal Grant Price Display**: Resolved issue where sell modal was showing incorrect grant date price
  - Sell modal now correctly displays the historical price from the grant date
  - Ensures accurate profit/loss calculations when planning sales

### 🔧 Improvements
- **Enhanced Version Checker**: Replaced modal notification with non-intrusive toast notification
  - Toast appears in bottom-right corner without blocking workflow
  - Can continue working while notification is present
  - Better UX during price updates - toast doesn't interfere with progress modal
  - Cleaner visual hierarchy with proper z-index management
  
### 🎨 UI/UX Updates  
- **Toast Notification Design**: Implemented modern toast-style notification for version updates
  - Smooth slide-in animation from right edge
  - Persistent notification until user interaction (no auto-hide)
  - Clear action buttons: "Dismiss (14 days)" vs "View Release"
  - Maintains visibility during all app operations

## [0.3.4] - 2025-08-11

### 🔧 Bug Fixes
- **Fixed Grant Date Price Calculation**: Resolved issue where grant amounts were calculated using current prices instead of historical grant date prices
  - Updated `addPortfolioEntry` to properly fetch historical prices for grant date
  - Fixed fallback logic to find closest historical price on or before grant date
  - Ensures accurate amount granted calculations for new grants
- **Fixed Version Display Consistency**: Resolved version mismatch between development and standalone builds
  - Updated all hardcoded fallback versions from 0.3.1 to current version
  - Fixed version display in footer and window title for standalone builds
  - Added comprehensive debugging for version loading issues

### 🔧 Technical Improvements  
- **Enhanced Historical Price Queries**: Improved database queries to prioritize grant date prices over current prices
- **Better Version Loading**: Added robust fallback mechanisms for version display in packaged applications
- **Debug Logging**: Added detailed logging for version loading and grant price calculations

## [0.3.3] - 2025-08-11

### ✨ New Features
- **Automatic Version Checker**: Added automatic version checking against GitHub releases
  - Checks for new versions 10 seconds after app startup (non-intrusive)
  - Shows stylized modal notification with direct link to latest release
  - Smart dismissal system: Close (×) vs "Maybe Later" (14-day dismissal)
  - Completely silent operation - no network errors shown to users
  - Respects user preferences with localStorage-based dismissal tracking

### 🔧 Technical Improvements
- **Lightweight Implementation**: Version checker adds minimal overhead with intelligent caching
- **User-Friendly Design**: Modal matches app styling with proper close/dismiss differentiation
- **Privacy-Conscious**: Only makes GitHub API calls when necessary, fails silently on network issues
- **Content Security Policy**: Updated CSP to allow GitHub API access for version checking

### 🐛 Bug Fixes
- **Fixed IPC Handler Conflict**: Resolved duplicate 'get-app-version' handler registration causing startup errors
- **Fixed Footer Initialization**: Resolved undefined variable errors in footer version display
- **Added Missing Function**: Added `getPriceUpdateStatus` function for price update automation

## [0.3.2] - 2025-08-11

### 🐛 Critical Bug Fix
- **Fixed Evolution Table Updates**: Resolved issue where evolution entries were not properly updated after price scraping from KBC
- Regular price scraper now correctly rebuilds evolution timeline from the updated price date forward
- Evolution entries now reflect current prices instead of showing outdated portfolio values

### ⚡ Technical Improvements
- **Unified Evolution Processing**: All portfolio operations (add grant, record sale, update tax, delete entry, update prices) now consistently use `rebuildCompleteEvolutionTimeline()` 
- **Removed Redundant Functions**: Eliminated obsolete `createPortfolioSnapshot()` and `createEvolutionEntryForGrant()` functions (~160 lines of dead code)
- **Preserved Event Generation**: Evolution events (grant and sale notes) continue to be generated from actual database data via `getAllSignificantEvents()`
- **Optimized Performance**: Evolution rebuilds only from affected dates forward, maintaining excellent performance

### 🔧 Code Quality
- **Consistent Architecture**: Streamlined evolution update approach across all operations for better maintainability
- **Enhanced Data Integrity**: Evolution timeline now always accurately reflects the latest scraped prices

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