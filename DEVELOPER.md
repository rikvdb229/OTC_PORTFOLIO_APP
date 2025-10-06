# Portfolio Tracker - Developer Documentation

Developer guide for building, modifying, and contributing to Portfolio Tracker.

**Version 0.4.0** | **Build Date**: October 6, 2025

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Operating System**: Windows, macOS, or Linux

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rikvdb229/OTC_PORTFOLIO_APP.git
cd OTC_PORTFOLIO_APP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Version

```bash
npm start
```

## Build for Distribution

### Build Commands

```bash
# Build portable .exe for Windows
npm run build
npm run build:win

# Build DMG for macOS (requires Mac)
npm run build:mac

# Build AppImage for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

### Build Outputs

- **Windows**: `dist/Portfolio Tracker 0.4.0.exe` (~76MB)
- **macOS**: `dist/Portfolio Tracker-0.4.0.dmg`
- **Linux**: `dist/Portfolio Tracker-0.4.0.AppImage`

## Technical Architecture

### Project Structure

```
portfolio-tracker/
├── main.js                          # Electron main process
├── renderer.js                      # Main renderer process
├── portfolio-db.js                  # Database operations
├── scraper.js                       # KBC price scraping
├── enhanced-historical-scraper.js   # Historical price fetching
├── index.html                       # Main application UI
├── package.json                     # Project configuration
├── styles/
│   └── main.css                     # Primary stylesheet
├── utils/
│   ├── data-loader.js               # Evolution calculations
│   ├── stats-manager.js             # Portfolio metrics
│   ├── ui-state-manager.js          # UI state management
│   ├── ipc-communication.js         # IPC handlers
│   └── portfolio-calculations.js    # Business logic
├── ui/
│   ├── modal-manager.js             # Modal dialogs
│   ├── table-generator.js           # Table rendering
│   └── chart-utils.js               # Chart rendering
├── services/
│   └── ingService.js                # ING API integration
├── libs/
│   └── sql-wasm.wasm                # SQLite WebAssembly
└── assets/
    ├── icons/                       # Application icons
    └── logo.svg                     # Logo
```

### Key Technologies

- **Electron 33.4.11**: Desktop application framework
- **SQLite** (via sql.js): Local database storage
- **Chart.js**: Data visualizations
- **electron-builder**: Build and distribution
- **Node.js 18+**: Runtime environment

### Database Schema

SQLite database stored in `portfolio.db`:

**Tables**:
- `portfolio` - Stock option grants
- `price_history` - Historical price data
- `sales` - Sales transactions
- `evolution` - Portfolio timeline snapshots
- `settings` - Application settings

**Key Columns** (portfolio table):
- `id`, `grant_date`, `exercise_price`, `quantity`, `grant_source` (KBC/ING)
- `isin`, `quantity_remaining`, `tax_amount`, `grant_date_price`

## Development Workflow

### Running in Development

```bash
# Standard development mode
npm start

# Development mode with dev flag
npm run dev
```

### Testing

Manual testing is preferred:
- Test Evolution tab functionality
- Verify price update features
- Test offline capabilities
- Verify grant addition (KBC and ING)
- Test sales recording

### Debugging

Enable DevTools in development:
- Main process: `main.js` logs to terminal
- Renderer process: DevTools in Electron window
- Database queries: Check `portfolio-db.js` logs

## Key Modules

### DataLoader (`utils/data-loader.js`)
- Evolution calculations
- Portfolio state management
- Time-based filtering
- Period statistics

### StatsManager (`utils/stats-manager.js`)
- Portfolio metrics
- Performance calculations
- Return percentages
- Target tracking

### PortfolioCalculations (`utils/portfolio-calculations.js`)
- Business logic
- Tax calculations
- Profit/loss calculations
- Grant value computations

### IPCCommunication (`utils/ipc-communication.js`)
- Main ↔ Renderer communication
- Database operations
- Price scraping triggers
- Settings management

## Code Style Guidelines

- Follow existing patterns and conventions
- Use the same libraries already present
- Never add comments unless specifically requested
- Maintain consistency with existing file structure
- Prefer editing existing files over creating new ones

## Database Operations

### Adding Migrations

Add migrations in `portfolio-db.js`:

```javascript
async migrateYourFeature() {
    console.log('Running migration: Your Feature');
    // Migration code here
}
```

Call from `runMigrations()` method.

### Querying the Database

Use prepared statements:

```javascript
const stmt = db.prepare('SELECT * FROM portfolio WHERE id = ?');
stmt.bind([id]);
```

## Price Scraping

### KBC Prices (`scraper.js`)
- Scrapes from KBC website
- Handles bank holidays
- Updates price_history table

### ING Prices (`services/ingService.js`)
- Fetches from ING API using ISIN
- Filters zero/invalid prices
- Returns quote data

### Historical Prices (`enhanced-historical-scraper.js`)
- Fetches historical data for grant dates
- Derives prices from next available date
- Handles missing data

## Contributing

### Contribution Guidelines

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/OTC_PORTFOLIO_APP.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Test thoroughly
   - Update documentation if needed

4. **Commit Changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Describe changes clearly
   - Reference any related issues
   - Include testing notes

### Code Review Process

- All PRs require review
- Test builds locally before submitting
- Ensure no console errors
- Verify database migrations work

## Build Configuration

### electron-builder Config (package.json)

```json
{
  "build": {
    "appId": "com.portfoliotracker.app",
    "productName": "Portfolio Tracker",
    "win": {
      "target": "portable",
      "sign": false
    },
    "mac": {
      "target": "dmg",
      "sign": false
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### Platform-Specific Notes

**Windows**:
- Portable .exe (no installation)
- Unsigned binary (antivirus may flag)
- Works from any location

**macOS**:
- DMG format
- Requires `xattr -c` for unsigned apps
- Gatekeeper warnings expected

**Linux**:
- AppImage format
- Untested in production
- Should work on most distributions

## AI Development Assistant

For AI-assisted development using Claude Code, see [CLAUDE.md](CLAUDE.md) for:
- Project-specific instructions
- Code style preferences
- Implementation guidelines
- Testing approach

## Troubleshooting Development Issues

### Build Failures

**npm install fails**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Electron won't start**:
```bash
npm install electron@33.4.11
```

**Build errors**:
```bash
npm run clean
npm install
npm run build
```

### Database Issues

**Database locked**:
- Close all running instances
- Delete `portfolio.db-journal` if exists

**Migration errors**:
- Backup database first
- Check SQL syntax
- Verify column types

### Common Errors

**Module not found**:
- Check `files` array in package.json
- Ensure all dependencies installed
- Verify file paths

**IPC errors**:
- Check handler registration in main.js
- Verify channel names match
- Check return values

## Performance Considerations

### Database Optimization
- Use prepared statements
- Minimize queries in loops
- Index frequently queried columns
- Use transactions for bulk operations

### UI Performance
- Debounce frequent updates
- Use progress indicators for long operations
- Lazy load chart data
- Minimize DOM manipulations

## Release Process

1. **Update Version**
   - `package.json`: version and buildDate
   - `README.md`: version and date
   - `CHANGELOG.md`: add release notes

2. **Test Build**
   ```bash
   npm run build
   ```

3. **Create Git Tag**
   ```bash
   git tag v0.4.0
   git push origin v0.4.0
   ```

4. **GitHub Release**
   - Upload built executables
   - Copy changelog content
   - Mark as pre-release if beta

## Support & Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: README.md for users, DEVELOPER.md for developers
- **Changelog**: CHANGELOG.md for version history
- **Distribution Guide**: DISTRIBUTION.md for deployment info

---

**Portfolio Tracker v0.4.0** - Developer documentation for building and contributing to the project.
