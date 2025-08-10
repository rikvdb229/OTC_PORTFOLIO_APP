// Historical Price Scraper for KBC Options
// This scraper fetches historical price data for individual options

const { BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class HistoricalPriceScraper {
  constructor() {
    this.downloadDir = this.getDataDirectory();
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
        dataDir = path.join(app.getPath("userData"), "DATA", "historical");
      } else {
        const os = require("os");
        dataDir = path.join(os.homedir(), "Documents", "OTC_Portfolio_Data", "historical");
      }
    } catch (_error) {
      console.warn("Could not determine user data directory, using current directory");
      dataDir = path.join(process.cwd(), "DATA", "historical");
    }
    return dataDir;
  }

  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true });
        console.log(`✅ Created historical data directory: ${this.downloadDir}`);
      }
    } catch (error) {
      console.error("Failed to create historical data directory:", error);
      throw new Error(`Cannot create historical data directory: ${error.message}`);
    }
  }

  async humanDelay(baseMs, randomFactor = 0.3) {
    const randomMs = baseMs * (1 + (Math.random() - 0.5) * randomFactor);
    await new Promise(resolve => setTimeout(resolve, Math.max(50, randomMs)));
  }

  setupDownloadHandler(window, expectedFileName) {
    window.webContents.session.on('will-download', (event, item, webContents) => {
      console.log(`📥 Download starting: ${item.getFilename()}`);
      
      // Set download path
      const savePath = path.join(this.downloadDir, expectedFileName || item.getFilename());
      item.setSavePath(savePath);
      
      // Monitor download
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          console.log('❌ Download interrupted');
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            console.log('⏸️ Download paused');
          } else {
            const percent = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);
            console.log(`📊 Download progress: ${percent}%`);
          }
        }
      });
      
      item.once('done', (event, state) => {
        if (state === 'completed') {
          console.log(`✅ Download completed: ${savePath}`);
          this.downloadComplete = true;
          this.downloadPath = savePath;
        } else {
          console.log(`❌ Download failed: ${state}`);
          this.downloadComplete = false;
        }
      });
    });
  }

  // Fetch historical prices for a specific option
  async fetchHistoricalPrices(detailUrl, fundName, exercisePrice, grantDate, onProgress = null) {
    let window = null;
    
    try {
      console.log(`🔍 Fetching historical prices for: ${fundName} (€${exercisePrice})`);
      
      if (onProgress) onProgress({ text: `Opening detail page for ${fundName}...`, percentage: 10 });
      
      // Create hidden browser window
      window = new BrowserWindow({
        show: false,  // Hidden for production
        width: 1200,
        height: 900,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          allowRunningInsecureContent: true
        }
      });
      
      // Generate filename for this option's historical data
      const safeFileName = `historical_${fundName.replace(/[^a-z0-9]/gi, '_')}_${exercisePrice}_${grantDate}.csv`;
      this.setupDownloadHandler(window, safeFileName);
      
      // Set user agent
      await window.webContents.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      
      // Navigate to the detail page
      await window.loadURL(detailUrl);
      await this.humanDelay(3000, 0.3);
      
      if (onProgress) onProgress({ text: `Finding download link for ${fundName}...`, percentage: 30 });
      
      // Find and click the CSV download link
      const csvLinkFound = await window.webContents.executeJavaScript(`
        // Look for the "All (.csv)" link
        const csvLink = Array.from(document.querySelectorAll('a')).find(a => 
          a.textContent.includes('All (.csv)') || 
          (a.href && a.href.includes('all.php'))
        );
        
        if (csvLink) {
          console.log('Found CSV link:', csvLink.href);
          csvLink.click();
          true;
        } else {
          // Debug: log all links found
          const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent,
            href: a.href
          }));
          console.log('All links found:', allLinks);
          false;
        }
      `);
      
      if (!csvLinkFound) {
        throw new Error(`CSV download link not found for ${fundName}`);
      }
      
      if (onProgress) onProgress({ text: `Downloading historical data for ${fundName}...`, percentage: 60 });
      
      // Wait for download to complete
      const maxWaitTime = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (!this.downloadComplete && (Date.now() - startTime) < maxWaitTime) {
        await this.humanDelay(500);
      }
      
      if (!this.downloadComplete) {
        throw new Error(`Download timeout for ${fundName}`);
      }
      
      if (onProgress) onProgress({ text: `Processing data for ${fundName}...`, percentage: 80 });
      
      // Parse the downloaded CSV
      const csvData = await this.parseHistoricalCSV(this.downloadPath);
      
      if (onProgress) onProgress({ text: `Completed ${fundName}!`, percentage: 100 });
      
      return {
        fundName,
        exercisePrice,
        grantDate,
        filePath: this.downloadPath,
        priceHistory: csvData
      };
      
    } catch (error) {
      console.error(`❌ Error fetching historical prices for ${fundName}:`, error);
      throw error;
    } finally {
      if (window) {
        window.close();
      }
      // Reset download state
      this.downloadComplete = false;
      this.downloadPath = null;
    }
  }

  // Parse the historical price CSV
  async parseHistoricalCSV(filePath) {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header if present
      let dataStartIndex = 0;
      if (lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('price')) {
        dataStartIndex = 1;
      }
      
      const priceHistory = [];
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle potential comma in numbers)
        const parts = line.split(/[,;]/);
        
        if (parts.length >= 2) {
          // Assuming format: date, price (and maybe other columns)
          const dateStr = parts[0].trim();
          const priceStr = parts[1].trim().replace(',', '.'); // Handle European decimal
          
          const price = parseFloat(priceStr);
          if (!isNaN(price) && dateStr) {
            // Extract just the date part (YYYY-MM-DD) from "YYYY-MM-DD HH:MM"
            const datePart = dateStr.split(' ')[0];
            priceHistory.push({
              date: datePart,
              price: price,
              fullDateTime: dateStr // Keep original for reference
            });
          }
        }
      }
      
      console.log(`📊 Parsed ${priceHistory.length} historical prices from ${filePath}`);
      return priceHistory;
      
    } catch (error) {
      console.error('❌ Error parsing historical CSV:', error);
      throw error;
    }
  }

  // Test function to fetch prices for a single option
  async testFetchSingleOption() {
    try {
      // Example URL - you'll need to provide a real one from the KBC site
      const testUrl = "https://option.esop.kbc.be/detail.php?enc=YOUR_ENCODED_PARAMS";
      const result = await this.fetchHistoricalPrices(
        testUrl,
        "KBCESOP Eco Fund 2015-09-24 777.17",
        777.17,
        "2015-09-24",
        (progress) => console.log(`Progress: ${progress.text} (${progress.percentage}%)`)
      );
      
      console.log("✅ Test completed successfully!");
      console.log(`Downloaded ${result.priceHistory.length} price points`);
      console.log("First few prices:", result.priceHistory.slice(0, 5));
      
      return result;
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = HistoricalPriceScraper;

// Test code (run this file directly to test)
if (require.main === module) {
  const scraper = new HistoricalPriceScraper();
  console.log("🧪 Running historical price scraper test...");
  console.log("⚠️ Note: You need to provide a valid detail URL from KBC for testing");
  
  // Uncomment and update with a real URL to test:
  // scraper.testFetchSingleOption().then(() => {
  //   console.log("Test completed!");
  //   process.exit(0);
  // }).catch(error => {
  //   console.error("Test failed:", error);
  //   process.exit(1);
  // });
}