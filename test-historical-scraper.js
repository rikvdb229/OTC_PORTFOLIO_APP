// Test script for the historical price scraper
// This can be run independently to test the scraper functionality

const { app, BrowserWindow } = require('electron');
const HistoricalPriceScraper = require('./historical-price-scraper');

// Wait for Electron to be ready
app.whenReady().then(async () => {
  console.log('🚀 Starting historical price scraper test...');
  
  const scraper = new HistoricalPriceScraper();
  
  // Test with a sample detail URL
  // You'll need to replace this with an actual URL from the KBC site
  const testCases = [
    {
      // Example from the user's data
      detailUrl: "https://option.esop.kbc.be/detail.php?enc=+04BUj+OMbyCFwecjeZOya+elw+eBa5Y7FTDY2JwmEhrGPj8+KuMF68LII7OhTw0G/xaB0AV4YSptx9zhx64Yv2qB0npoXpdk8F/joxdBjbg6KfEuheuDXhSxtiWaNaqs8GS7GHnRCXKiHgePpfrw5TJoPkpBgA5ebt7zlp6N2A=",
      fundName: "KBCESOP Eco Fund 2015-09-24 777.17",
      exercisePrice: 777.17,
      grantDate: "2015-09-24"
    },
    // Add more test cases as needed
  ];
  
  try {
    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.fundName}`);
      console.log(`   Exercise Price: €${testCase.exercisePrice}`);
      console.log(`   Grant Date: ${testCase.grantDate}`);
      console.log(`   URL: ${testCase.detailUrl.substring(0, 50)}...`);
      
      const result = await scraper.fetchHistoricalPrices(
        testCase.detailUrl,
        testCase.fundName,
        testCase.exercisePrice,
        testCase.grantDate,
        (progress) => {
          console.log(`   ${progress.percentage}% - ${progress.text}`);
        }
      );
      
      console.log(`\n✅ Success! Downloaded ${result.priceHistory.length} price points`);
      console.log('📊 Sample data (first 5 entries):');
      result.priceHistory.slice(0, 5).forEach(entry => {
        console.log(`   ${entry.date}: €${entry.price}`);
      });
      
      console.log('📊 Sample data (last 5 entries):');
      result.priceHistory.slice(-5).forEach(entry => {
        console.log(`   ${entry.date}: €${entry.price}`);
      });
      
      // Find price on grant date
      const grantDatePrice = result.priceHistory.find(p => {
        // Handle different date formats (YYYY-MM-DD vs YYYY-MM-DD HH:MM)
        const priceDate = p.date.split(' ')[0]; // Get just the date part
        return priceDate === testCase.grantDate;
      });
      if (grantDatePrice) {
        console.log(`\n💰 Price on grant date (${testCase.grantDate}): €${grantDatePrice.price}`);
      } else {
        console.log(`\n⚠️ No price found for grant date ${testCase.grantDate}`);
        // Show closest dates for debugging
        const closestDates = result.priceHistory.slice(-10).map(p => p.date);
        console.log(`   Closest dates available: ${closestDates.join(', ')}`);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Close the app after tests
    setTimeout(() => {
      app.quit();
    }, 2000);
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('App activated but no test to run');
  }
});

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Don't quit on macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});