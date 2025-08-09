// Test script to parse the options table and extract detail URLs
// This helps us understand the structure before implementing the full scraper

const { app, BrowserWindow } = require('electron');

class OptionsTableParser {
  constructor() {
    this.humanTiming = {
      pageLoad: { min: 2000, max: 4000 },
      postAction: { min: 200, max: 600 },
    };
  }

  async humanDelay(baseMs, randomFactor = 0.3) {
    const randomMs = baseMs * (1 + (Math.random() - 0.5) * randomFactor);
    await new Promise(resolve => setTimeout(resolve, Math.max(50, randomMs)));
  }

  async parseOptionsTable(onProgress = null) {
    let window = null;
    
    try {
      if (onProgress) onProgress("Creating browser window...");
      
      // Create browser window (visible for testing)
      window = new BrowserWindow({
        show: true,  // Visible for testing
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
      
      if (onProgress) onProgress("Loading KBC options page...");
      
      // Load the main page
      await window.loadURL("https://option.esop.kbc.be/");
      await this.humanDelay(3000);
      
      if (onProgress) onProgress("Setting date filter...");
      
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
      
      if (onProgress) onProgress("Clicking search button...");
      
      // Click search
      await window.webContents.executeJavaScript(`
        const searchButton = document.querySelector('input[type="submit"][value="Search"]');
        if (searchButton) searchButton.click();
      `);
      
      // Wait for results
      await this.humanDelay(3000);
      
      if (onProgress) onProgress("Parsing options table...");
      
      // Parse the table
      const options = await window.webContents.executeJavaScript(`
        const options = [];
        const table = document.getElementById('listtable');
        
        if (table) {
          const rows = table.querySelectorAll('tbody tr');
          
          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 9) {
              // Extract the detail link
              const detailLink = cells[0].querySelector('a');
              const detailUrl = detailLink ? detailLink.href : null;
              
              // Extract option data
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
      
      console.log(`\n📊 Found ${options.length} options in the table\n`);
      
      // Display the parsed options
      options.forEach(option => {
        console.log(`Option ${option.index}:`);
        console.log(`  Fund: ${option.fundName}`);
        console.log(`  Grant Date: ${option.grantDate}`);
        console.log(`  Exercise Price: €${option.exercisePrice}`);
        console.log(`  Current Price: €${option.currentPrice}`);
        console.log(`  Detail URL: ${option.detailUrl ? option.detailUrl.substring(0, 80) + '...' : 'N/A'}`);
        console.log('');
      });
      
      // Save to file for reference
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'parsed-options.json');
      fs.writeFileSync(outputPath, JSON.stringify(options, null, 2));
      console.log(`\n💾 Saved parsed options to: ${outputPath}`);
      
      return options;
      
    } catch (error) {
      console.error('❌ Error parsing options table:', error);
      throw error;
    } finally {
      // Keep window open for inspection in test mode
      if (window) {
        console.log('\n⏸️ Keeping window open for inspection. Close it manually or press Ctrl+C to exit.');
      }
    }
  }
}

// Run the test
app.whenReady().then(async () => {
  console.log('🚀 Starting options table parser test...');
  console.log('⚠️ Note: You need to be logged into KBC for this to work!\n');
  
  const parser = new OptionsTableParser();
  
  try {
    const options = await parser.parseOptionsTable((status) => {
      console.log(`📍 ${status}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    console.log(`Total options found: ${options.length}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});