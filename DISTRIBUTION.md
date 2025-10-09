# Portfolio Tracker - Distribution Guide

## 📦 Standalone Portable Distribution

Portfolio Tracker v0.4.2 is distributed as a **completely standalone portable executable** that requires no installation and works with optional internet connectivity.

### 🎯 Distribution Details

- **File**: `Portfolio Tracker 0.4.2.exe`
- **Size**: ~80MB (includes all dependencies)
- **Platform**: Windows (x64/64-bit), macOS (x64/64-bit DMG)
- **Requirements**: Windows 10+ or macOS 10.13+
- **Dependencies**: None (fully self-contained)

### ✨ Key Features

#### 🗂️ Completely Portable
- **Single File**: Everything bundled in one .exe
- **No Installation**: Double-click to run
- **No Admin Rights**: Runs with standard user permissions
- **Run Anywhere**: Desktop, USB stick, network drive, cloud sync folder

#### 🔒 Privacy & Security
- **Optional Internet**: Only for fetching current stock prices
- **Local Data Only**: Database stored next to .exe file
- **No Data Transmission**: Your portfolio data never leaves your computer
- **No Registry Changes**: No system modifications
- **No Temp Files**: Clean execution environment

#### 💾 Data Management
- **Database File**: `portfolio.db` (SQLite format)
- **Location**: Same folder as the .exe
- **Size**: Typically under 1MB
- **Backup**: Simply copy both .exe and .db files

### 📁 Usage Scenarios

#### 🏢 Corporate Environment
- Run from network drives
- No installation approval needed
- Compliant with strict IT policies
- Isolated from system configuration

#### 💼 Mobile Usage
- USB stick deployment
- Laptop synchronization
- Travel-friendly
- Work from anywhere

#### 🔄 Backup & Sharing
- **Backup**: Copy `.exe` + `.db` files
- **Migration**: Move both files to new location
- **Versioning**: Keep multiple versions side-by-side
- **Team Use**: Each user has their own .db file

### 🚀 Getting Started

1. **Download**: Get `Portfolio Tracker 0.4.2.exe` from GitHub releases
2. **Place**: Put it in your preferred location (Desktop, Documents, USB stick)
3. **Run**: Double-click the .exe file
4. **First Launch**: App creates `portfolio.db` in the same folder
5. **Start Using**: Add your first stock grant (KBC or ING) and begin tracking

### 🛡️ Security Considerations

#### ✅ Safe Practices
- **Virus Scanning**: Scan the .exe with your antivirus
- **Source Verification**: Download only from official GitHub releases
- **Data Privacy**: Keep .db file secure (contains financial data)
- **Access Control**: Store in secure location if using sensitive data

#### ⚠️ Important Notes
- **Database Security**: The .db file contains all your portfolio data
- **No Encryption**: Database is not encrypted by default
- **File Permissions**: Ensure adequate folder write permissions
- **Antivirus**: Some antivirus may flag unsigned .exe files

### 🔧 Technical Information

#### Bundled Components
- **Electron Runtime**: v33.4.11
- **Chromium Engine**: Latest stable
- **Node.js Modules**: All dependencies included
- **SQLite Database**: Native support
- **Chart.js**: Visualization library

#### System Requirements
- **OS**: Windows 10 (version 1903) or later
- **Architecture**: x64 (64-bit)
- **RAM**: Minimum 512MB available
- **Disk Space**: 150MB free space recommended
- **Permissions**: Standard user (no admin required)

### 🎉 Distribution Benefits

#### For End Users
- **Zero Setup**: No installation process
- **Instant Start**: Run immediately after download
- **Privacy First**: Complete data control
- **Flexible Deployment**: Use anywhere
- **Easy Backup**: Simple file copy

#### For IT Departments
- **No System Changes**: Doesn't modify registry or system files
- **Controlled Deployment**: Easy to distribute via file shares
- **License Compliance**: Open source (MIT license)
- **Security Audit**: Single file to verify
- **Easy Removal**: Just delete the files

### 📋 Distribution Checklist

When distributing Portfolio Tracker:

- [ ] Download official .exe from GitHub releases
- [ ] Verify file integrity and size (~76MB)
- [ ] Test on target environment
- [ ] Ensure adequate disk space (150MB+)
- [ ] Check folder write permissions
- [ ] Inform users about .db file importance
- [ ] Provide backup instructions
- [ ] Document usage guidelines

### 🆘 Support & Issues

For distribution-related issues:
1. Check Windows version compatibility
2. Verify antivirus isn't blocking execution
3. Ensure folder write permissions
4. Try running from different location
5. Report issues on GitHub with system details

---

**Portfolio Tracker v0.4.2** - Complete portfolio management in a single, portable file.

**Build Date**: October 10, 2025