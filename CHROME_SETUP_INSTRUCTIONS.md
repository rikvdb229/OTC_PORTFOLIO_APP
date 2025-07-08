# Chrome Setup Instructions

## For End Users

If the application shows "Chrome not found" error:

1. **Install Google Chrome** from https://www.google.com/chrome/
2. **Restart the application** - it will automatically detect Chrome

## For Developers

### Option 1: Bundle Chrome (Recommended)

```bash
npm run setup-chrome
npm run build-win
```

### Option 2: Require Chrome Installation

Include in your installer/documentation that users need Chrome.

### Option 3: Alternative Scraping

Consider using a different web scraping approach that doesn't require Chrome.

## Troubleshooting

### "Chrome not found" Error

- Install Google Chrome
- Ensure Chrome is in standard installation location
- Run as administrator (if needed)

### Permission Errors

- Use user directory for database (already implemented)
- Install app per-user (not system-wide)

Generated: 2025-06-20T16:29:16.558Z
