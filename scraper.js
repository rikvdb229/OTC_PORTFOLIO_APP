// PRODUCTION KBC SCRAPER - Clean & Headless
const { BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class KBCScraper {
  constructor() {
    this.downloadDir = this.getDataDirectory();
    this.today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    this.fileName = `kbc_productList_${this.today}.csv`;
    this.filePath = path.join(this.downloadDir, this.fileName);

    this.ensureDataDirectory();

    this.humanTiming = {
      typing: { min: 40, max: 100 },
      mouseMove: { min: 150, max: 400 },
      pageLoad: { min: 2000, max: 4000 },
      thinking: { min: 500, max: 1200 },
      reading: { min: 1000, max: 2500 },
      postAction: { min: 200, max: 600 },
    };

    this.downloadComplete = false;
    this.downloadPath = null;
  }

  getDataDirectory() {
    let dataDir;
    try {
      if (app && app.getPath) {
        dataDir = path.join(app.getPath("userData"), "DATA");
      } else {
        const os = require("os");
        dataDir = path.join(os.homedir(), "Documents", "OTC_Portfolio_Data");
      }
    } catch (_error) {
      console.warn("Could not determine user data directory, using current directory");
      dataDir = path.join(process.cwd(), "DATA");
    }
    return dataDir;
  }

  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true });
        console.log(`✅ Created download directory: ${this.downloadDir}`);
      }
    } catch (error) {
      console.error("Failed to create download directory:", error);
      throw new Error(`Cannot create download directory: ${error.message}`);
    }
  }

  async humanDelay(baseMs, randomFactor = 0.3) {
    const randomMs = baseMs * (1 + (Math.random() - 0.5) * randomFactor);
    await new Promise(resolve => setTimeout(resolve, Math.max(50, randomMs)));
  }

  // CLEAN PRODUCTION SCRAPER WITH PROGRESS CONTROL
  async scrapeData(onProgress = null) {
    let window = null;

    try {
      if (onProgress) onProgress({ text: "Connecting to KBC...", percentage: 25 });

      // Headless browser window
      window = new BrowserWindow({
        show: false,  // Hidden
        width: 1200,
        height: 900,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          allowRunningInsecureContent: true
        }
      });

      // Setup download handling
      this.setupDownloadHandler(window);

      // Set user agent
      await window.webContents.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Load KBC page
      await window.loadURL("https://option.esop.kbc.be/");
      await this.humanDelay(3000, 0.3);

      if (onProgress) onProgress({ text: "Preparing search query...", percentage: 50 });

      // STEP 1: Fill date field with "2010-01-01"
      const dateFieldFound = await window.webContents.executeJavaScript(`
        const dateField = document.querySelector('input[type="text"][id="from"][name="from"]');
        if (dateField) {
          dateField.value = '';
          dateField.value = '2010-01-01';
          dateField.dispatchEvent(new Event('change', { bubbles: true }));
          dateField.dispatchEvent(new Event('input', { bubbles: true }));
          true;
        } else {
          false;
        }
      `);

      if (!dateFieldFound) {
        throw new Error("Date field not found. Check if you're logged in or if page structure changed.");
      }

      await this.humanDelay(this.humanTiming.postAction.min, 0.4);

      // STEP 2: Click Search button
      const searchClicked = await window.webContents.executeJavaScript(`
        const searchButton = document.querySelector('input.input[type="submit"][value="Search"]') ||
                            document.querySelector('input[type="submit"][value="Search"]') || 
                            document.querySelector('button[type="submit"]') ||
                            document.querySelector('input[value="Search"]');
        
        if (searchButton) {
          searchButton.click();
          true;
        } else {
          false;
        }
      `);

      if (!searchClicked) {
        throw new Error("Search button not found.");
      }

      // Wait for search results
      await this.humanDelay(2000, 0.3);

      if (onProgress) onProgress({ text: "Processing search results...", percentage: 75 });

      // Additional wait for results to load
      await this.humanDelay(2000, 0.3);

      if (onProgress) onProgress({ text: "Downloading portfolio data...", percentage: 90 });

      // STEP 3: Click Export div
      const exportClicked = await window.webContents.executeJavaScript(`
        const exportDiv = document.querySelector('div.exportText[onclick*="productList.php"]') ||
                         document.querySelector('div.exportText') ||
                         document.querySelector('[onclick*="productList.php"]') ||
                         document.querySelector('[onclick*="export"]') ||
                         document.querySelector('div[onclick*="window.location"]');
        
        if (exportDiv) {
          exportDiv.click();
          true;
        } else {
          false;
        }
      `);

      if (!exportClicked) {
        throw new Error("Export button not found. Check if search results loaded properly.");
      }

      // Wait for download
      await this.humanDelay(1000, 0.2);
      await this.waitForDownload(onProgress);

      if (onProgress) onProgress({ text: "Portfolio data downloaded successfully!", percentage: 100 });

      return {
        success: true,
        fileName: this.fileName,
        filePath: this.downloadPath || this.filePath,
        message: "KBC data scraped successfully",
        downloadDir: this.downloadDir,
      };

    } catch (error) {
      console.error("KBC scraping error:", error);
      return {
        success: false,
        error: error.message,
        message: "KBC scraping failed",
        downloadDir: this.downloadDir,
      };
    } finally {
      if (window) {
        await this.humanDelay(300, 0.2);
        try {
          window.close();
        } catch (closeError) {
          console.error("Error closing window:", closeError);
        }
      }
    }
  }

  setupDownloadHandler(window) {
    const ses = window.webContents.session;
    
    ses.on('will-download', (event, item, webContents) => {
      const originalFilename = item.getFilename();
      const downloadPath = path.join(this.downloadDir, originalFilename);
      
      item.setSavePath(downloadPath);
      this.downloadPath = downloadPath;
      this.fileName = originalFilename;
      
      item.once('done', (event, state) => {
        if (state === 'completed') {
          this.downloadComplete = true;
        }
      });
    });
  }

  async waitForDownload(onProgress) {
    let attempts = 0;
    const maxAttempts = 15;

    while (!this.downloadComplete && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      // Check for new CSV files
      try {
        const files = fs.readdirSync(this.downloadDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        
        if (csvFiles.length > 0) {
          const newestFile = csvFiles
            .map(f => ({ name: f, stats: fs.statSync(path.join(this.downloadDir, f)) }))
            .sort((a, b) => b.stats.mtime - a.stats.mtime)[0];
          
          const fileAge = Date.now() - newestFile.stats.mtime.getTime();
          if (fileAge < 60000) {
            this.downloadPath = path.join(this.downloadDir, newestFile.name);
            this.fileName = newestFile.name;
            break;
          }
        }
      } catch (readError) {
        // Continue waiting
      }
    }

    const finalPath = this.downloadPath || this.filePath;
    if (!fs.existsSync(finalPath)) {
      throw new Error(
        `CSV file was not downloaded after ${maxAttempts} seconds. Check download directory: ${this.downloadDir}`
      );
    }
  }

  async testConnection() {
    let window = null;
    try {
      window = new BrowserWindow({
        show: false,
        width: 1200,
        height: 800,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await window.loadURL("https://option.esop.kbc.be/");
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pageInfo = await window.webContents.executeJavaScript(`
        ({
          title: document.title,
          url: window.location.href,
          hasDateField: !!document.querySelector('input[id="from"]'),
          hasSearchButton: !!document.querySelector('input[value="Search"]'),
          status: 200
        })
      `);

      return {
        success: true,
        status: pageInfo.status,
        title: pageInfo.title,
        message: "KBC connection successful",
        chromeFound: true,
        chromePath: "Built-in Electron Chromium",
        pageAnalysis: pageInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "KBC connection failed",
        chromeFound: true,
      };
    } finally {
      if (window) {
        try {
          window.close();
        } catch (closeError) {
          console.error("Error closing test window:", closeError);
        }
      }
    }
  }

  getLatestCSVFile() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        return null;
      }

      const files = fs
        .readdirSync(this.downloadDir)
        .filter(file => file.endsWith(".csv"))
        .map((file) => ({
          name: file,
          path: path.join(this.downloadDir, file),
          stats: fs.statSync(path.join(this.downloadDir, file)),
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error("Error finding latest CSV:", error);
      return null;
    }
  }
}

module.exports = KBCScraper;