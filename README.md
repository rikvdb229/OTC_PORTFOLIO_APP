# Portfolio Tracker

A comprehensive desktop application for managing stock options portfolios, built with Electron and designed for tracking employee stock option plans and investment portfolios.

![Portfolio Tracker](assets/logo.svg)

## Version 0.2.0

**Status**: Beta Version  
**Build Date**: July 9, 2025  
**License**: MIT  

## Features

### 📊 Portfolio Management
- **Real-time Portfolio Tracking**: Monitor your total portfolio value, active options, and performance metrics
- **Grant Management**: Track stock option grants with exercise prices, quantities, and vesting schedules
- **Performance Analytics**: View portfolio evolution over time with interactive charts and graphs

### 📈 Evolution Analysis
- **Period-based Analysis**: View portfolio changes over 30 days, 90 days, 1 year, or all time
- **Profit/Loss Calculation**: Real-time calculation of gains/losses with percentage changes
- **Historical Tracking**: Comprehensive evolution data with snapshot comparisons
- **Visual Indicators**: Color-coded gains (green) and losses (red) for quick reference

### 🔍 Data Visualization
- **Interactive Charts**: Multiple chart types for portfolio analysis
- **Time-series Data**: Historical performance tracking with detailed timelines
- **Filtering Options**: Flexible date range selections for focused analysis
- **Export Capabilities**: Export data for external analysis

### 💰 Financial Tools
- **Tax Calculations**: Automated tax amount calculations with customizable rates
- **Currency Support**: Multi-currency display with Euro (€) as primary currency
- **Sales Tracking**: Complete sales history with profit/loss calculations
- **Target Monitoring**: Track progress against portfolio targets

## Installation

### 🚀 Standalone Portable Version (Recommended)

**No installation required!** Download and run the portable executable:

1. **Download**: Get the latest `Portfolio Tracker 0.2.0.exe` from the [Releases](../../releases) page
2. **Run**: Double-click the .exe file to start the application
3. **Portable**: No installation needed - run from anywhere (Desktop, USB stick, network drive)

#### ✨ Portable Features
- **🗂️ Fully Self-Contained**: All dependencies bundled in single .exe file
- **💾 Local Data Storage**: Database stored next to .exe file - completely offline
- **🔒 Privacy First**: No internet connection required, no data sent online
- **📁 Run Anywhere**: Desktop, Documents, USB stick, network drive - your choice
- **⚡ Instant Start**: No installation, no admin rights needed

### 🛠️ Development Setup (For Developers)

Only needed if you want to modify the application:

#### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Operating System**: Windows, macOS, or Linux

#### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rikvdb229/OTC_PORTFOLIO_APP.git
   cd OTC_PORTFOLIO_APP
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development version**:
   ```bash
   npm start
   ```

#### Build for Distribution

```bash
# Build portable .exe for Windows
npm run build

# Build for all platforms (development)
npm run build:all
```

## 💾 Data Storage & Privacy

### Local Database Storage
- **Location**: `portfolio.db` file created next to the .exe
- **Format**: SQLite database (industry standard)
- **Size**: Typically under 1MB for normal usage
- **Backup**: Manual backup by copying the .db file

### Complete Privacy
- **🔒 100% Offline**: No internet connection required for operation
- **🚫 No Data Transmission**: Your data never leaves your computer
- **🏠 Local Only**: Database stored locally on your machine
- **👤 Full Control**: You own and control all your data
- **🔐 Secure**: No cloud storage, no external servers, no data collection

### Portability
- **📁 Run from anywhere**: Desktop, USB stick, network drive
- **💼 Business Use**: Perfect for corporate environments with restricted internet
- **🏃‍♂️ Mobile**: Take your portfolio data with you on USB stick
- **🔄 Easy Backup**: Just copy the .exe and .db files

## Usage

### Getting Started

1. **Launch the Application**: Double-click `Portfolio Tracker 0.2.0.exe`
2. **First Run**: The app creates a `portfolio.db` file next to the .exe
3. **Add Your First Grant**: Click "➕ Add Grants" to input your stock option information
4. **Track Performance**: Navigate between tabs to view different aspects of your portfolio
5. **Monitor Evolution**: Use the Evolution tab to see how your portfolio changes over time

### 📁 File Management
- **Database**: `portfolio.db` - Contains all your portfolio data
- **Backup**: Copy both `.exe` and `.db` files to backup location
- **Move**: Copy both files to new location and run from there
- **Share**: Never share the `.db` file (contains your private financial data)

### Navigation

- **Portfolio Tab**: Overview of current holdings and total values
- **Evolution Tab**: Historical performance and time-based analysis
- **Chart Tab**: Visual representations of portfolio data
- **Sales History**: Record and track completed transactions
- **Grant History**: Manage and monitor stock option grants

### Key Functions

#### Portfolio Overview
- View total portfolio value and option counts
- Monitor target achievement and return percentages
- Track latest price updates and changes

#### Evolution Analysis
- Select time periods: 30 days, 90 days, 1 year, or all time
- View profit/loss calculations: "Change since [date]: [amount] ([percentage])"
- Real-time updates when switching between periods

#### Grant Management
- Add new grants with exercise prices and quantities
- Track vesting schedules and sellable quantities
- Monitor status changes (Active, Partially Sold, Sold)

## Configuration

### Database
- **Type**: SQLite (local file storage)
- **Location**: `portfolio.db` in application directory
- **Backup**: Automatic backup creation and restoration

### Settings
- **Target Percentage**: Customizable portfolio target (default: 65%)
- **Tax Rate**: Automatic tax calculation rate (default: 30%)
- **Currency Symbol**: Display currency (default: €)
- **Auto Price Updates**: Enable/disable automatic price refreshing

## Technical Architecture

### Built With
- **[Electron](https://www.electronjs.org/)**: Desktop application framework
- **[SQLite](https://www.sqlite.org/)**: Local database storage
- **[Chart.js](https://www.chartjs.org/)**: Interactive charts and visualizations
- **HTML/CSS/JavaScript**: Frontend interface and interactions

### Project Structure
```
portfolio-tracker/
├── main.js              # Electron main process
├── renderer.js          # Main renderer process
├── portfolio-db.js      # Database operations
├── scraper.js           # Data scraping utilities
├── index.html           # Main application UI
├── styles/              # CSS stylesheets
├── utils/               # Utility modules
├── ui/                  # UI component generators
├── libs/                # Third-party libraries
└── assets/              # Icons and images
```

### Key Modules
- **DataLoader**: Handles data loading and evolution calculations
- **StatsManager**: Portfolio statistics and performance metrics
- **UIStateManager**: Application state and interface management
- **IPCCommunication**: Inter-process communication handling
- **PortfolioCalculations**: Business logic for portfolio calculations

## Development

### Requirements
- Node.js 18+
- Electron 33+
- Modern web browser for testing

### Development Commands
```bash
# Start in development mode
npm run dev

# Run with debugging
npm start --dev

# Install dependencies
npm install

# Clean build
npm run clean && npm install
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex business logic
- Maintain consistent file organization

## Troubleshooting

### Common Issues

**Portable .exe won't start**:
- Run from a writable location (not Program Files)
- Check Windows Defender/antivirus isn't blocking the file
- Ensure you have sufficient disk space (100MB+ recommended)
- Try running from Desktop or Documents folder

**Database errors**:
- Ensure the folder containing the .exe is writable
- Check that `portfolio.db` file isn't opened by another program
- Verify antivirus isn't blocking database file creation
- Try running from a different location (Desktop, Documents)

**Performance issues**:
- Close other applications to free up memory
- Reduce chart data range for large datasets
- Ensure adequate disk space for database operations
- Try running from local drive instead of network drive

### Development Issues (npm/Node.js)

**Development version won't start**:
- Delete `node_modules` folder and run `npm install`
- Check that Node.js and npm versions meet requirements
- Verify no other instances are running

### Support
For issues and feature requests, please:
1. Check the troubleshooting section above
2. Review existing issues in the repository
3. Create a new issue with detailed information

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/) framework
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons and UI components designed for modern desktop interfaces
- Database functionality provided by [SQLite](https://www.sqlite.org/)

---

**Portfolio Tracker v0.2.0** - Professional stock options portfolio management made simple.