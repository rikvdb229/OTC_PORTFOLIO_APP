# ===== CONTRIBUTING.md =====
# Contributing to Portfolio Tracker

Thank you for your interest in contributing to Portfolio Tracker! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/portfolio-tracker.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm run dev`
7. Commit and push: `git commit -m "Add feature" && git push`
8. Create a pull request

## 📋 Development Guidelines

### Code Style
- Use ESLint and Prettier (run `npm run check`)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused

### Commit Messages
Use conventional commit format:
- `feat: add new portfolio analytics feature`
- `fix: resolve price update bug`
- `docs: update installation instructions`
- `style: fix code formatting`
- `refactor: improve database queries`
- `test: add unit tests for calculations`

### Testing
- Test your changes thoroughly in development mode
- Verify builds work: `npm run build-win`
- Test on different screen sizes
- Ensure database operations work correctly

### Pull Request Process
1. Update documentation if needed
2. Add or update tests if applicable
3. Ensure all checks pass
4. Provide clear description of changes
5. Reference related issues

## 🐛 Bug Reports

When reporting bugs, include:
- Operating system and version
- Node.js and npm versions
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Error messages or console output

## 💡 Feature Requests

For new features:
- Check existing issues first
- Describe the use case clearly
- Explain the expected behavior
- Consider implementation complexity
- Discuss with maintainers before large changes

## 🏗️ Architecture Overview

- **Main Process**: `main.js` - Electron main process
- **Renderer Process**: `renderer.js` - UI logic
- **Database**: SQLite with SQL.js
- **Utilities**: Modular utilities in `utils/`
- **Styling**: CSS with modular imports

## 📞 Getting Help

- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Check existing documentation first

Thank you for contributing! 🎉
