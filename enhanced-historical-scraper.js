// Enhanced Historical Price Scraper with Caching
// This scraper caches the options list for performance and provides on-demand historical data

const { BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class EnhancedHistoricalScraper {
  constructor() {
    this.downloadDir = this.getDataDirectory();
    this.cacheDir = path.join(this.downloadDir, 'cache');
    this.ensureDirectories();
    
    this.optionsListCache = null;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    this.humanTiming = {
      typing: { min: 40, max: 100 },
      pageLoad: { min: 2000, max: 4000 },
      postAction: { min: 200, max: 600 },
    };
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

  ensureDirectories() {
    try {
      [this.downloadDir, this.cacheDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`✅ Created directory: ${dir}`);
        }
      });
    } catch (error) {
      console.error("Failed to create directories:", error);
      throw error;
    }
  }

  async humanDelay(baseMs, randomFactor = 0.3) {
    const randomMs = baseMs * (1 + (Math.random() - 0.5) * randomFactor);
    await new Promise(resolve => setTimeout(resolve, Math.max(50, randomMs)));
  }

  // Get cached options list or fetch new one
  async getOptionsList(forceRefresh = false) {
    const cacheFile = path.join(this.cacheDir, 'options-list-cache.json');
    
    // Check cache first
    if (!forceRefresh && fs.existsSync(cacheFile)) {
      try {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        
        if (cacheAge < this.cacheExpiry) {
          console.log('📋 Using cached options list');
          this.optionsListCache = cacheData.options;
          return cacheData.options;
        }
      } catch (error) {
        console.warn('⚠️ Cache read error, will fetch fresh data:', error.message);
      }
    }
    
    // Fetch fresh options list
    console.log('🔄 Fetching fresh options list...');
    const options = await this.fetchOptionsListFromKBC();
    
    // Save to cache
    const cacheData = {
      timestamp: new Date().toISOString(),
      count: options.length,
      options: options
    };
    
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Cached ${options.length} options for future use`);
    
    this.optionsListCache = options;
    return options;
  }

  // Find option in cached list by matching criteria
  // Uses ONLY grant date and exercise price for reliable matching
  findOptionInCache(exercisePrice, grantDate) {
    if (!this.optionsListCache) {
      return null;
    }
    
    console.log(`🔍 Looking for option with price €${exercisePrice} and date ${grantDate} in ${this.optionsListCache.length} cached options`);
    
    // Find by exercise price and grant date only (most reliable identifiers)
    const option = this.optionsListCache.find(opt => {
      const priceMatch = Math.abs(opt.exercisePrice - exercisePrice) < 0.01; // Allow small floating point differences
      const dateMatch = opt.grantDate === grantDate;
      
      if (priceMatch && dateMatch) {
        console.log(`✅ Found matching option: ${opt.fundName}`);
        return true;
      }
      return false;
    });
    
    if (!option) {
      console.log(`❌ No matching option found for €${exercisePrice} on ${grantDate}`);
      console.log(`   Available options:`, this.optionsListCache.slice(0, 5).map(opt => 
        `€${opt.exercisePrice} on ${opt.grantDate} (${opt.fundName})`
      ));
    }
    
    return option;
  }

  // Fetch options list from KBC
  async fetchOptionsListFromKBC() {
    let window = null;
    
    try {
      window = new BrowserWindow({
        show: false,
        width: 1400,
        height: 900,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          allowRunningInsecureContent: true
        }
      });
      
      await window.webContents.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      
      await window.loadURL("https://option.esop.kbc.be/");
      await this.humanDelay(3000);
      
      // Set date to 2010-01-01
      await window.webContents.executeJavaScript(`
        const dateField = document.querySelector('input[type="text"][id="from"][name="from"]');
        if (dateField) {
          dateField.value = '2010-01-01';
          dateField.dispatchEvent(new Event('change', { bubbles: true }));
          dateField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `);
      
      await this.humanDelay(500);
      
      // Click search
      await window.webContents.executeJavaScript(`
        const searchButton = document.querySelector('input[type="submit"][value="Search"]');
        if (searchButton) searchButton.click();
      `);
      
      await this.humanDelay(3000);
      
      // Parse the table
      const options = await window.webContents.executeJavaScript(`
        const options = [];
        const table = document.getElementById('listtable');
        
        if (table) {
          const rows = table.querySelectorAll('tbody tr');
          
          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 9) {
              const detailLink = cells[0].querySelector('a');
              const detailUrl = detailLink ? detailLink.href : null;
              
              const optionData = {
                index: index + 1,
                detailUrl: detailUrl,
                type: cells[1]?.textContent?.trim() || '',
                fundName: cells[2]?.textContent?.trim() || '',
                grantDate: cells[3]?.textContent?.trim() || '',
                exercisePrice: parseFloat(cells[4]?.textContent?.trim() || '0'),
                currency: cells[5]?.textContent?.trim() || '',
                currentPrice: parseFloat(cells[6]?.textContent?.trim().replace(',', '') || '0'),
                lastUpdate: cells[7]?.textContent?.trim() || '',
                underlyingFund: cells[8]?.textContent?.trim() || ''
              };
              
              options.push(optionData);
            }
          });
        }
        
        options;
      `);
      
      return options;
      
    } finally {
      if (window) {
        window.close();
      }
    }
  }

  // Fetch historical prices for a specific option
  async fetchHistoricalPricesForOption(fundName, exercisePrice, grantDate, onProgress = null) {
    try {
      // Get options list (cached or fresh)
      const optionsList = await this.getOptionsList();
      
      // Find the option using only exercise price and grant date
      const option = this.findOptionInCache(exercisePrice, grantDate);
      
      if (!option || !option.detailUrl) {
        throw new Error(`Option not found for €${exercisePrice} on ${grantDate}`);
      }
      
      console.log(`✅ Found option in cache: ${option.fundName} (€${option.exercisePrice})`);
      
      // Fetch historical prices
      return await this.downloadHistoricalData(option, onProgress);
      
    } catch (error) {
      console.error('❌ Error fetching historical prices:', error);
      throw error;
    }
  }

  // Download historical data for an option
  async downloadHistoricalData(option, onProgress = null) {
    let window = null;
    let downloadComplete = false;
    let downloadPath = null;
    
    try {
      if (onProgress) onProgress({ text: `Opening detail page...`, percentage: 10 });
      
      window = new BrowserWindow({
        show: false,
        width: 1200,
        height: 900,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          allowRunningInsecureContent: true
        }
      });
      
      // Setup download handler
      const safeFileName = `historical_${option.fundName.replace(/[^a-z0-9]/gi, '_')}_${option.exercisePrice}_${option.grantDate}.csv`;
      
      window.webContents.session.on('will-download', (event, item, webContents) => {
        const savePath = path.join(this.downloadDir, safeFileName);
        item.setSavePath(savePath);
        
        item.on('updated', (event, state) => {
          if (state === 'progressing' && !item.isPaused()) {
            const percent = Math.round((item.getReceivedBytes() / item.getTotalBytes()) * 100);
            if (onProgress) onProgress({ text: `Downloading... ${percent}%`, percentage: 60 + (percent * 0.2) });
          }
        });
        
        item.once('done', (event, state) => {
          if (state === 'completed') {
            downloadComplete = true;
            downloadPath = savePath;
          }
        });
      });
      
      await window.webContents.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      
      // Navigate to detail page
      await window.loadURL(option.detailUrl);
      await this.humanDelay(3000);
      
      if (onProgress) onProgress({ text: `Finding download link...`, percentage: 30 });
      
      // Click CSV download link
      const csvLinkFound = await window.webContents.executeJavaScript(`
        const csvLink = Array.from(document.querySelectorAll('a')).find(a => 
          a.textContent.includes('All (.csv)') || 
          (a.href && a.href.includes('all.php'))
        );
        
        if (csvLink) {
          csvLink.click();
          true;
        } else {
          false;
        }
      `);
      
      if (!csvLinkFound) {
        throw new Error('CSV download link not found');
      }
      
      // Wait for download
      const maxWaitTime = 30000;
      const startTime = Date.now();
      
      while (!downloadComplete && (Date.now() - startTime) < maxWaitTime) {
        await this.humanDelay(500);
      }
      
      if (!downloadComplete) {
        throw new Error('Download timeout');
      }
      
      if (onProgress) onProgress({ text: `Processing data...`, percentage: 80 });
      
      // Parse CSV
      const csvContent = fs.readFileSync(downloadPath, 'utf-8');
      const priceHistory = this.parseHistoricalCSV(csvContent);
      
      if (onProgress) onProgress({ text: `Completed!`, percentage: 100 });
      
      // Find grant date price
      const grantDatePrice = priceHistory.find(p => p.date === option.grantDate);
      
      return {
        fundName: option.fundName,
        exercisePrice: option.exercisePrice,
        grantDate: option.grantDate,
        currentPrice: option.currentPrice,
        grantDatePrice: grantDatePrice ? grantDatePrice.price : null,
        priceHistory: priceHistory,
        downloadPath: downloadPath
      };
      
    } finally {
      if (window) {
        window.close();
      }
    }
  }

  // Parse historical CSV data
  parseHistoricalCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const priceHistory = [];
    
    // Skip header if present
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('price')) {
      startIndex = 1;
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/[,;]/);
      if (parts.length >= 2) {
        const dateStr = parts[0].trim();
        const priceStr = parts[1].trim().replace(',', '.');
        
        const price = parseFloat(priceStr);
        if (!isNaN(price) && dateStr) {
          const datePart = dateStr.split(' ')[0];
          priceHistory.push({
            date: datePart,
            price: price
          });
        }
      }
    }
    
    return priceHistory;
  }

  // Clear cache
  clearCache() {
    const cacheFile = path.join(this.cacheDir, 'options-list-cache.json');
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
      console.log('🗑️ Options list cache cleared');
    }
    this.optionsListCache = null;
  }
}

module.exports = EnhancedHistoricalScraper;