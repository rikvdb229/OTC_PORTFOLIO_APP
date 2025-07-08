# 📊 Portfolio Tracker

A powerful Electron-based desktop application for tracking and managing stock option portfolios with real-time data scraping, comprehensive analytics, and professional reporting features.

![Portfolio Tracker](https://img.shields.io/badge/version-1.0.2-blue.svg)
![Electron](https://img.shields.io/badge/Electron-32.2.6-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Features

### 📈 Portfolio Management
- **Real-time Portfolio Tracking**: Monitor your stock options with live price updates
- **Grant Management**: Record and track option grants with exercise prices and vesting schedules
- **Sales Tracking**: Log option sales with detailed transaction history
- **Portfolio Evolution**: Visualize portfolio performance over time with interactive charts

### 🔍 Data Analysis
- **Comprehensive Analytics**: Calculate total portfolio value, profit/loss, and returns
- **Performance Metrics**: Track weighted average returns and portfolio statistics
- **Historical Analysis**: View portfolio evolution with detailed snapshots
- **Price History**: Monitor option price movements with historical data

### 🌐 Web Scraping Integration
- **Automated Data Collection**: Scrape option prices from web sources
- **Real-time Updates**: Keep portfolio values current with automated price fetching
- **Chrome Integration**: Built-in browser automation for reliable data extraction

### 💾 Data Management
- **SQLite Database**: Robust local data storage with SQL.js
- **Import/Export**: Backup and restore portfolio data in JSON format
- **Data Validation**: Comprehensive validation for all user inputs
- **Undo/Redo System**: Session-based operation history with rollback capability

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with responsive layouts
- **Interactive Tables**: Sortable, filterable data tables with advanced features
- **Modal Dialogs**: User-friendly forms for data entry and editing
- **Charts & Graphs**: Visual portfolio analytics with Chart.js integration
- **Dark/Light Themes**: Customizable appearance (if implemented)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Windows/macOS/Linux**: Cross-platform desktop support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portfolio-tracker.git
   cd portfolio-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Chrome for web scraping**
   ```bash
   npm run setup-chrome
   ```

4. **Run the application**
   ```bash
   npm start
   ```

### Development Mode

Run with developer tools enabled:
```bash
npm run dev
```

## 🔧 Building for Production

### Windows
```bash
npm run build-win
```

### All Platforms
```bash
npm run build
```

Built applications will be available in the `dist/` directory.

## 📖 User Guide

### Getting Started

1. **Launch the Application**: Start Portfolio Tracker from your desktop or command line
2. **Add Option Grants**: Use the "Add Grants" feature to record your option grants
3. **Update Prices**: Click "Update Prices" to fetch current option values
4. **Record Sales**: Log option sales when you exercise and sell options
5. **View Analytics**: Check the Portfolio, Evolution, and Sales tabs for insights

### Key Workflows

#### Adding Option Grants
1. Navigate to the Portfolio tab
2. Click "Add Grants"
3. Enter grant date, exercise price, quantity, and tax information
4. The system will validate sellable periods and merge duplicate grants if needed

#### Recording Sales
1. Select an option entry from your portfolio
2. Click "Sell Options"
3. Enter sale date, quantity, and sale price
4. The system tracks remaining quantities and calculates profits

#### Viewing Analytics
- **Portfolio Tab**: Current holdings with real-time values
- **Evolution Tab**: Historical portfolio performance
- **Sales Tab**: Complete transaction history
- **Grants Tab**: Grant history and vesting information

### Data Management

#### Backup Your Data
```bash
Settings → Export Database → Choose location → Save
```

#### Restore Data
```bash
Settings → Import Database → Select backup file → Confirm
```

## 🛠️ Technical Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Modern JavaScript (ES2022)
- **Backend**: Node.js with Electron
- **Database**: SQLite with SQL.js
- **Web Scraping**: Puppeteer with Chrome automation
- **Charts**: Chart.js for data visualization
- **Build**: Electron Builder for cross-platform packaging

### Project Structure
```
portfolio-tracker/
├── main.js                 # Electron main process
├── renderer.js             # Main application logic
├── index.html             # Application UI
├── package.json           # Dependencies and scripts
├── assets/                # Icons and static resources
├── styles/                # CSS stylesheets
│   ├── main.css          # Main stylesheet with imports
│   ├── base/             # Base styles and variables
│   ├── components/       # UI component styles
│   ├── features/         # Feature-specific styles
│   └── responsive/       # Responsive design
├── utils/                 # Utility modules
│   ├── config.js         # App configuration
│   ├── formatters.js     # Data formatting utilities
│   ├── ipc-communication.js # IPC handlers
│   ├── modal-manager.js  # Modal dialog management
│   ├── portfolio-calculations.js # Portfolio math
│   ├── ui-state-management.js # UI state handling
│   └── undo-redo-manager.js # Undo/redo system
├── ui/                    # UI components
│   └── html-generators.js # Dynamic HTML generation
└── chrome-portable/       # Chrome browser for scraping
```

### Database Schema

The application uses SQLite with the following main tables:
- `portfolio_entries`: Option grants and holdings
- `sales_transactions`: Sale records and transactions
- `price_history`: Historical option price data
- `portfolio_evolution`: Portfolio snapshots over time
- `app_settings`: User preferences and configuration

## ⚙️ Configuration

### Application Settings

Access settings through the Settings tab:
- **Target Return Percentage**: Set your target portfolio return (default: 65%)
- **Tax Rate**: Configure automatic tax calculations (default: 30%)
- **Currency Symbol**: Set display currency (default: €)
- **Auto-Update Prices**: Enable/disable automatic price updates

### Advanced Configuration

Edit `utils/config.js` for advanced settings:
```javascript
const APP_CONFIG = {
  VERSION: "1.0.2",
  APP_NAME: "Portfolio Tracker",
  STATUS: "Development Version",
  BUILD_DATE: "2025-06-19"
};
```

## 🧪 Development & Testing

### Code Quality Tools

- **ESLint**: Code linting with modern JavaScript standards
- **Prettier**: Code formatting for consistency
- **Electron Rebuild**: Native module compilation

### Available Scripts

```bash
npm run start          # Start the application
npm run dev           # Development mode with DevTools
npm run build         # Build for all platforms
npm run build-win     # Build for Windows only
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
npm run format        # Format code with Prettier
npm run check         # Run both linting and formatting
npm run clean         # Clean install dependencies
npm run test-chrome   # Test Chrome setup
npm run check-db      # Check database status
npm run migrate-db    # Run database migrations
```

### Testing Chrome Integration

Verify web scraping functionality:
```bash
npm run test-chrome
```

## 🔒 Security Considerations

### Current Security Model
- **Local Data**: All portfolio data is stored locally on your machine
- **No Cloud Sync**: Data never leaves your device unless explicitly exported
- **Web Scraping**: Uses isolated Chrome instance for price fetching

### Development Security Notes
The current version uses relaxed Electron security settings for development. For production deployment, consider implementing:
- Context isolation
- Disabled node integration in renderer
- Content Security Policy (CSP)
- Code signing for distribution

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Bug Reports
1. Check existing issues first
2. Create a detailed bug report with steps to reproduce
3. Include system information and screenshots if applicable

### Feature Requests
1. Check if the feature has been requested before
2. Describe the use case and expected behavior
3. Consider contributing the implementation

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper testing
4. Submit a pull request with detailed description

### Code Style
- Follow the existing code patterns
- Use ESLint and Prettier for consistency
- Add comments for complex logic
- Update documentation for new features

## 📋 Roadmap

### Upcoming Features
- [ ] Enhanced security with context isolation
- [ ] Cloud backup integration (optional)
- [ ] Multi-portfolio support
- [ ] Advanced charting and analytics
- [ ] Mobile companion app
- [ ] API integration with brokers
- [ ] Tax reporting features
- [ ] Portfolio sharing and collaboration

### Known Issues
- Version inconsistency warning (fixed in next release)
- Minor UI responsiveness on very small screens
- Chrome setup may require manual intervention on some systems

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron Team** for the excellent desktop framework
- **SQL.js Project** for SQLite in the browser
- **Puppeteer Team** for web automation capabilities
- **Chart.js** for beautiful data visualization
- **Community Contributors** for feedback and improvements

## 📞 Support

### Getting Help
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions
- **Documentation**: Check this README and inline code comments

### Troubleshooting

#### Application Won't Start
1. Verify Node.js version: `node --version` (should be ≥18.0.0)
2. Reinstall dependencies: `npm run clean`
3. Check for error messages in console

#### Chrome Setup Issues
1. Run Chrome test: `npm run test-chrome`
2. Manually download Chrome Portable if needed
3. Check antivirus software isn't blocking Chrome

#### Database Problems
1. Check database status: `npm run check-db`
2. Backup data before troubleshooting
3. Run database migration: `npm run migrate-db`

#### Performance Issues
1. Check available disk space (database can grow large)
2. Consider exporting and reimporting data to optimize
3. Monitor memory usage during web scraping

---

**Made with ❤️ for portfolio management and financial tracking**

*Portfolio Tracker v1.0.2 - Professional desktop application for stock option portfolio management*