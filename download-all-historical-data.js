// Script to download all historical price data and measure performance
// This will help us understand the time impact of fetching all data

const { app, BrowserWindow } = require('electron');
const HistoricalPriceScraper = require('./historical-price-scraper');
const fs = require('fs');
const path = require('path');

class HistoricalDataDownloader {
  constructor() {
    this.scraper = new HistoricalPriceScraper();
    this.results = [];
    this.startTime = null;
    this.humanTiming = {
      pageLoad: { min: 2000, max: 4000 },
      betweenOptions: { min: 1000, max: 2000 }, // Delay between downloading each option
    };
  }

  async humanDelay(baseMs, randomFactor = 0.3) {
    const randomMs = baseMs * (1 + (Math.random() - 0.5) * randomFactor);
    await new Promise(resolve => setTimeout(resolve, Math.max(50, randomMs)));
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  async downloadAllHistoricalData() {
    console.log('🚀 Starting bulk historical data download...\n');
    this.startTime = Date.now();
    
    let window = null;
    
    try {
      // Step 1: Get all options from the main table
      console.log('📋 Step 1: Fetching list of all options...');
      const optionsList = await this.fetchOptionsList();
      console.log(`✅ Found ${optionsList.length} options to download\n`);
      
      // Save the options list for reference
      const optionsListPath = path.join(this.scraper.downloadDir, 'options-list.json');
      fs.writeFileSync(optionsListPath, JSON.stringify(optionsList, null, 2));
      console.log(`💾 Saved options list to: ${optionsListPath}\n`);
      
      // Step 2: Download historical data for each option
      console.log('📊 Step 2: Downloading historical data for each option...\n');
      
      for (let i = 0; i < optionsList.length; i++) {
        const option = optionsList[i];
        const optionStartTime = Date.now();
        
        console.log(`\n[${i + 1}/${optionsList.length}] Processing: ${option.fundName}`);
        console.log(`  Exercise Price: €${option.exercisePrice}`);
        console.log(`  Grant Date: ${option.grantDate}`);
        
        try {
          const result = await this.scraper.fetchHistoricalPrices(
            option.detailUrl,
            option.fundName,
            option.exercisePrice,
            option.grantDate,
            (progress) => {
              process.stdout.write(`\r  Progress: ${progress.percentage}% - ${progress.text}`);
            }
          );
          
          const downloadTime = Date.now() - optionStartTime;
          console.log(`\n  ✅ Success! Downloaded ${result.priceHistory.length} prices in ${this.formatTime(downloadTime)}`);
          
          // Store result
          this.results.push({
            ...option,
            success: true,
            priceCount: result.priceHistory.length,
            downloadTime: downloadTime,
            filePath: result.filePath,
            firstPrice: result.priceHistory[result.priceHistory.length - 1],
            lastPrice: result.priceHistory[0],
            grantDatePrice: result.priceHistory.find(p => p.date === option.grantDate)
          });
          
          // Add delay between options to be respectful to the server
          if (i < optionsList.length - 1) {
            console.log(`  ⏳ Waiting before next download...`);
            await this.humanDelay(this.humanTiming.betweenOptions.min);
          }
          
        } catch (error) {
          const downloadTime = Date.now() - optionStartTime;
          console.log(`\n  ❌ Failed: ${error.message} (after ${this.formatTime(downloadTime)})`);
          
          this.results.push({
            ...option,
            success: false,
            error: error.message,
            downloadTime: downloadTime
          });
        }
      }
      
      // Step 3: Generate summary report
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error);
    } finally {
      const totalTime = Date.now() - this.startTime;
      console.log(`\n⏱️ Total execution time: ${this.formatTime(totalTime)}`);
    }
  }

  async fetchOptionsList() {
    let window = null;
    
    try {
      // Create browser window
      window = new BrowserWindow({
        show: false,  // Hidden
        width: 1400,
        height: 900,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          allowRunningInsecureContent: true
        }
      });
      
      // Set user agent
      await window.webContents.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      
      // Load the main page
      await window.loadURL("https://option.esop.kbc.be/");
      await this.humanDelay(3000);
      
      // Set date to 2010-01-01 to get all options
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
      
      // Wait for results
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

  generateSummaryReport() {
    console.log('\n\n📊 ========== SUMMARY REPORT ==========\n');
    
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log(`✅ Successfully downloaded: ${successful.length} options`);
    console.log(`❌ Failed downloads: ${failed.length} options`);
    
    if (successful.length > 0) {
      const totalPrices = successful.reduce((sum, r) => sum + r.priceCount, 0);
      const avgPricesPerOption = Math.round(totalPrices / successful.length);
      const avgDownloadTime = successful.reduce((sum, r) => sum + r.downloadTime, 0) / successful.length;
      
      console.log(`\n📈 Statistics:`);
      console.log(`  - Total price points downloaded: ${totalPrices.toLocaleString()}`);
      console.log(`  - Average prices per option: ${avgPricesPerOption.toLocaleString()}`);
      console.log(`  - Average download time per option: ${this.formatTime(avgDownloadTime)}`);
      
      // Estimate time for different scenarios
      console.log(`\n⏱️ Time estimates:`);
      console.log(`  - Time to download all data: ${this.formatTime(Date.now() - this.startTime)}`);
      console.log(`  - Estimated time for 10 options: ${this.formatTime(avgDownloadTime * 10)}`);
      console.log(`  - Estimated time for 50 options: ${this.formatTime(avgDownloadTime * 50)}`);
      console.log(`  - Estimated time for 100 options: ${this.formatTime(avgDownloadTime * 100)}`);
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed downloads:`);
      failed.forEach(f => {
        console.log(`  - ${f.fundName}: ${f.error}`);
      });
    }
    
    // Save full report
    const reportPath = path.join(this.scraper.downloadDir, `download-report-${new Date().toISOString().slice(0, 10)}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        totalOptions: this.results.length,
        successful: successful.length,
        failed: failed.length,
        totalTime: Date.now() - this.startTime,
        date: new Date().toISOString()
      },
      results: this.results
    }, null, 2));
    
    console.log(`\n💾 Full report saved to: ${reportPath}`);
  }
}

// Run the downloader
app.whenReady().then(async () => {
  console.log('🔐 Make sure you are logged into KBC before starting!\n');
  
  const downloader = new HistoricalDataDownloader();
  
  try {
    await downloader.downloadAllHistoricalData();
  } catch (error) {
    console.error('\n❌ Downloader failed:', error);
  } finally {
    setTimeout(() => {
      app.quit();
    }, 5000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});