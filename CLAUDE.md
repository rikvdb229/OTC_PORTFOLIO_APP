# Portfolio Tracker - Claude Code Instructions

## Project Overview
Electron-based desktop application for tracking employee stock options portfolios. Supports multi-bank data scraping (KBC, ING) with local SQLite storage and historical price tracking.

## Key Principles
- **Prefer editing** existing files over creating new ones
- **Minimal file creation** - only create files when absolutely necessary
- **No proactive documentation** - don't create README files unless explicitly requested
- **Local-first** - all portfolio data stays on user's machine
- **Privacy-focused** - no cloud sync, standalone executable

## Architecture

### File Structure
```
portfolio-tracker/
├── main.js                          # Electron main process
├── renderer.js                      # Main renderer process
├── portfolio-db.js                  # SQLite database operations
├── scraper.js                       # Multi-bank data scraper
├── enhanced-historical-scraper.js   # Historical price data scraper
├── index.html                       # Main UI
├── services/
│   ├── kbcService.js               # KBC bank scraping logic
│   ├── ingService.js               # ING bank scraping logic
│   └── priceService.js             # Stock price fetching
├── utils/                           # Utility modules (formatters, managers)
├── ui/                              # UI generators
├── styles/                          # CSS stylesheets
└── assets/                          # Icons and images
```

### Key Dependencies
- **Electron 33.4.11** - Desktop app framework
- **sql.js** - Local SQLite storage
- **Chart.js** - Data visualizations
- **PapaParse** - CSV parsing
- **electron-builder** - Build and distribution

### Database
- SQLite database (`portfolio.db`) stored locally
- Tables: grants, prices, evolution snapshots, settings, price_history
- All data stored offline - no cloud sync

## Build & Development

### Build Commands
```bash
npm run build        # Windows portable .exe (primary target)
npm run build:win    # Windows portable .exe
npm run build:mac    # macOS DMG (requires Mac)
npm run build:linux  # Linux AppImage (untested)
```

### Development Commands
```bash
npm start                              # Run in development
npm run dev                            # Run with dev flag
npm run test:parse-table              # Test options table parser
npm run test:historical               # Test historical scraper
npm run download:all-historical       # Download all historical data
npm run analyze:portfolio-historical  # Analyze portfolio historical data
```

## Bank Scraper Integration

### Supported Banks
- **KBC** - `services/kbcService.js`
- **ING** - `services/ingService.js`

### Scraper Architecture
- Main scraper: `scraper.js`
- Bank-specific services in `services/` directory
- Historical data: `enhanced-historical-scraper.js`
- Price updates: `services/priceService.js`

### Testing
- Manual testing required after implementations
- Do not run app, ask user to test
- Focus on scraper functionality and data accuracy
- Verify offline capabilities with existing data

## Code Style
- Follow existing patterns and conventions
- Use existing libraries and frameworks
- Never add comments unless specifically requested
- Maintain consistency with existing structure

## Current Version
**v0.4.1** - Belgian time-based price updates (Build: 07-10-2025, Beta)