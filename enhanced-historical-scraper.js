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
    
    console.log(`🔍 getOptionsList called - forceRefresh: ${forceRefresh}, cacheFile exists: ${fs.existsSync(cacheFile)}`);
    
    // Check cache first
    if (!forceRefresh && fs.existsSync(cacheFile)) {
      try {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        
        console.log(`📋 Cache found - age: ${Math.round(cacheAge / 1000 / 60)} minutes, expiry: ${Math.round(this.cacheExpiry / 1000 / 60)} minutes, options: ${cacheData.options?.length || 0}`);
        
        if (cacheAge < this.cacheExpiry) {
          console.log('📋 Using cached options list');
          this.optionsListCache = cacheData.options;
          return cacheData.options;
        } else {
          console.log('📋 Cache expired, will fetch fresh data');
        }
      } catch (error) {
        console.warn('⚠️ Cache read error, will fetch fresh data:', error.message);
      }
    } else {
      console.log(`📋 No valid cache found (forceRefresh: ${forceRefresh}, exists: ${fs.existsSync(cacheFile)})`);
    }
    
    // Fetch fresh options list
    console.log('🔄 Fetching fresh options list from KBC...');
    
    try {
      const options = await this.fetchOptionsListFromKBC();
      console.log(`📋 Successfully fetched ${options?.length || 0} options from KBC`);
      
      if (!options || options.length === 0) {
        console.warn('⚠️ No options returned from KBC - this might indicate a scraping issue');
        throw new Error('No options found on KBC website - please check if the website structure has changed');
      }
      
      // Save to cache
      const cacheData = {
        timestamp: new Date().toISOString(),
        count: options.length,
        options: options
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Successfully cached ${options.length} options for future use`);
      
      this.optionsListCache = options;
      return options;
      
    } catch (error) {
      console.error('❌ Error fetching options list from KBC:', error);
      console.log('🔍 This might be due to:');
      console.log('  - Network connectivity issues');
      console.log('  - Changes in KBC website structure');
      console.log('  - Authentication requirements');
      throw new Error(`Failed to fetch options list: ${error.message}`);
    }
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
              
              const fundName = cells[2]?.textContent?.trim() || '';
              
              // Parse exercise price from 5th column (index 4) with better formatting handling
              const exercisePriceText = cells[4]?.textContent?.trim() || '0';
              let exercisePrice = parseFloat(exercisePriceText.replace(/,/g, '').replace(/\s/g, ''));
              
              console.log(\`🔍 Parsing exercise price: "\${exercisePriceText}" -> \${exercisePrice}\`);
              
              const optionData = {
                index: index + 1,
                detailUrl: detailUrl,
                type: cells[1]?.textContent?.trim() || '',
                fundName: fundName,
                grantDate: cells[3]?.textContent?.trim() || '',
                exercisePrice: exercisePrice,
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
      console.log(`🔍 Starting historical price fetch for ${fundName} - €${exercisePrice} on ${grantDate}`);
      
      // Get options list (cached or fresh) and ensure cache is loaded
      const optionsList = await this.getOptionsList();
      console.log(`📋 Options list loaded: ${optionsList?.length || 0} options available`);
      
      // Double-check that cache is properly set
      if (!this.optionsListCache || this.optionsListCache.length === 0) {
        console.log('⚠️ Options cache not properly loaded, setting from fetched list');
        this.optionsListCache = optionsList;
      }
      
      // Find the option using only exercise price and grant date
      let option = this.findOptionInCache(exercisePrice, grantDate);
      
      if (!option || !option.detailUrl) {
        console.error(`❌ Option not found in ${this.optionsListCache?.length || 0} cached options`);
        console.log('Available options sample:', this.optionsListCache?.slice(0, 3).map(opt => ({
          fundName: opt.fundName,
          exercisePrice: opt.exercisePrice,
          grantDate: opt.grantDate
        })));
        
        // Try force-refreshing the options list from KBC
        console.log('🔄 Option not found, force-refreshing options list from KBC...');
        const freshOptionsList = await this.getOptionsList(true);
        console.log(`📋 Force-refreshed options list: ${freshOptionsList?.length || 0} options`);
        
        // Try to find the option again in the fresh list
        option = this.findOptionInCache(exercisePrice, grantDate);
        
        if (!option || !option.detailUrl) {
          console.error(`❌ Option still not found after fresh fetch. Available dates:`, 
            this.optionsListCache?.slice(0, 10).map(opt => opt.grantDate).filter((date, index, arr) => arr.indexOf(date) === index)
          );
          throw new Error(`Option not found for €${exercisePrice} on ${grantDate} even after refreshing options list. The option may not exist on the KBC website for this specific date and price combination.`);
        } else {
          console.log(`✅ Found option after force refresh: ${option.fundName} (€${option.exercisePrice})`);
        }
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
      
      // Find grant date price with derivation fallback
      const grantDatePriceResult = this.findOrDeriveGrantDatePrice(priceHistory, option.grantDate);
      
      return {
        fundName: option.fundName,
        exercisePrice: option.exercisePrice,
        grantDate: option.grantDate,
        currentPrice: option.currentPrice,
        grantDatePrice: grantDatePriceResult.price,
        grantDatePriceDerived: grantDatePriceResult.derived,
        grantDatePriceSource: grantDatePriceResult.source,
        priceHistory: grantDatePriceResult.updatedHistory,
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

  // Find grant date price or derive it from next available day
  findOrDeriveGrantDatePrice(priceHistory, grantDate) {
    console.log(`🔍 Looking for grant date price: ${grantDate} in ${priceHistory.length} price entries`);
    
    // Try to find exact grant date price first
    const exactMatch = priceHistory.find(p => p.date === grantDate);
    if (exactMatch) {
      console.log(`✅ Found exact grant date price: €${exactMatch.price}`);
      return {
        price: exactMatch.price,
        derived: false,
        source: `Exact price from KBC (${grantDate})`,
        updatedHistory: priceHistory
      };
    }
    
    console.log(`⚠️ No exact price for grant date ${grantDate}, looking for next day's price to derive...`);
    
    // Sort price history by date to find the next available day
    const sortedPrices = priceHistory.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const grantDateTime = new Date(grantDate);
    
    // Find the next available price after the grant date
    const nextDayPrice = sortedPrices.find(p => {
      const priceDate = new Date(p.date);
      return priceDate > grantDateTime;
    });
    
    if (nextDayPrice) {
      // Round to nearest 10 (as per user requirements: 50.41 → 50.00)
      const derivedPrice = Math.round(nextDayPrice.price / 10) * 10;
      
      console.log(`📊 Deriving grant date price: ${nextDayPrice.date} price €${nextDayPrice.price} → rounded to €${derivedPrice}`);
      
      // Create a new price entry for the grant date
      const derivedEntry = {
        date: grantDate,
        price: derivedPrice,
        derived: true,
        sourceDate: nextDayPrice.date,
        sourcePrice: nextDayPrice.price
      };
      
      // Add the derived entry to the price history and sort
      const updatedHistory = [...priceHistory, derivedEntry].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log(`✅ Derived grant date price: €${derivedPrice} (from ${nextDayPrice.date}: €${nextDayPrice.price})`);
      
      return {
        price: derivedPrice,
        derived: true,
        source: `Derived from ${nextDayPrice.date} price €${nextDayPrice.price} (rounded to nearest 10)`,
        updatedHistory: updatedHistory,
        derivationInfo: {
          sourceDate: nextDayPrice.date,
          sourcePrice: nextDayPrice.price,
          roundedPrice: derivedPrice
        }
      };
    }
    
    console.log(`❌ No price available after grant date ${grantDate} for derivation`);
    
    return {
      price: null,
      derived: false,
      source: `No price available for ${grantDate} or following days`,
      updatedHistory: priceHistory
    };
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