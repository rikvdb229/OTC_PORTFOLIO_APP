# Portfolio Tracker - Claude Code Instructions

## Project Overview
Portfolio Tracker is an Electron-based desktop application for managing stock options portfolios. Built for tracking employee stock option plans with offline data storage and optional price updates.

## Key Project Principles
- **Prefer editing** existing files over creating new ones
- **Minimal file creation** - only create files when absolutely necessary
- **No proactive documentation** - don't create README files unless explicitly requested
- **Local-first approach** - all portfolio data stays on user's machine

## Development Guidelines

### Code Style
- Follow existing patterns and conventions in the codebase
- Use the same libraries and frameworks already present
- Never add comments unless specifically requested
- Maintain consistency with existing file structure

### File Organization
```
portfolio-tracker/
├── main.js              # Electron main process
├── renderer.js          # Main renderer process  
├── portfolio-db.js      # Database operations
├── index.html           # Main UI
├── styles/main.css      # Primary stylesheet
├── utils/               # Utility modules
├── ui/                  # UI generators
└── assets/              # Icons and images
```

### Key Dependencies
- **Electron 33.4.11** - Desktop app framework
- **SQLite** (via sql.js) - Local database storage
- **Chart.js** - Data visualizations
- **electron-builder** - Build and distribution

### Database Schema
- SQLite database stored in `portfolio.db`
- Contains grants, prices, evolution snapshots, settings
- All data stored locally - no cloud sync

### Build Configuration
- **Windows**: Portable .exe (primary target)
- **macOS**: DMG format (requires Mac to build)
- **Linux**: AppImage format (untested)

## Common Tasks

### Building
```bash
npm run build        # Windows portable .exe
npm run build:win    # Windows portable .exe  
npm run build:mac    # macOS DMG (requires Mac)
npm run build:linux  # Linux AppImage
```

### Development
```bash
npm start           # Run in development
npm run dev         # Run with dev flag
```

### Testing
- Manual testing preferred
- Focus on Evolution tab functionality
- Test price update features
- Verify offline capabilities

## UI Components

### Evolution Tab
- Period statistics with profit/loss calculations
- Filter buttons (30 days, 90 days, 1 year, all time)
- Hide stats when no data available
- Uses CSS Grid for layout alignment

### Key Modules
- **DataLoader** (`utils/data-loader.js`) - Evolution calculations
- **StatsManager** (`utils/stats-manager.js`) - Portfolio metrics
- **ChartUtils** - Chart rendering and data processing

## Privacy & Distribution
- **Standalone executable** - no installation required
- **Local data only** - portfolio data never transmitted
- **Price updates** - requires internet for stock price fetching
- **Portable** - runs from any location (USB, network drive)

## Version History
- **v0.1.0** - Initial release
- **v0.2.0** - Added evolution period statistics, fixed UI bugs

## Development Notes
- Internet required only for price updates
- App works offline with existing data
- Database automatically created on first run
- All user data stored in portfolio.db file

## Implementation Guidelines
- Do not run app, ask user to test implementations