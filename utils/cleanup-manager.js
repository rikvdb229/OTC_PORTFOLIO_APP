// Cleanup Manager - Clean up temporary files when app closes

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class CleanupManager {
  constructor() {
    this.dataDir = this.getDataDirectory();
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

  // Clean up temporary CSV files but keep important data
  async performCleanup() {
    try {
      console.log('🧹 Starting app cleanup...');
      
      await this.cleanupRegularCSVFiles();
      await this.cleanupHistoricalCSVFiles();
      await this.cleanupOldCacheFiles();
      
      console.log('✅ App cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  // Remove regular price update CSV files (keep only the latest one)
  async cleanupRegularCSVFiles() {
    try {
      const csvFiles = fs.readdirSync(this.dataDir)
        .filter(file => file.startsWith('kbc_productList_') && file.endsWith('.csv'))
        .map(file => ({
          name: file,
          path: path.join(this.dataDir, file),
          stat: fs.statSync(path.join(this.dataDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Sort by modification time, newest first

      if (csvFiles.length <= 1) {
        console.log('📄 No old regular CSV files to clean up');
        return;
      }

      // Keep the newest file, delete the rest
      const filesToDelete = csvFiles.slice(1);
      let deletedCount = 0;

      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          deletedCount++;
          console.log(`🗑️ Deleted old CSV: ${file.name}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete ${file.name}:`, error.message);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old regular CSV files`);
    } catch (error) {
      console.error('❌ Error cleaning up regular CSV files:', error);
    }
  }

  // Remove historical price CSV files (they're now in the database)
  async cleanupHistoricalCSVFiles() {
    try {
      const historicalDir = path.join(this.dataDir, 'historical');
      
      if (!fs.existsSync(historicalDir)) {
        console.log('📊 No historical directory to clean up');
        return;
      }

      const csvFiles = fs.readdirSync(historicalDir)
        .filter(file => file.startsWith('historical_') && file.endsWith('.csv'));

      if (csvFiles.length === 0) {
        console.log('📊 No historical CSV files to clean up');
        return;
      }

      let deletedCount = 0;
      for (const file of csvFiles) {
        try {
          const filePath = path.join(historicalDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted historical CSV: ${file}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete ${file}:`, error.message);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} historical CSV files`);
    } catch (error) {
      console.error('❌ Error cleaning up historical CSV files:', error);
    }
  }

  // Clean up old cache files (older than 7 days)
  async cleanupOldCacheFiles() {
    try {
      const cacheDir = path.join(this.dataDir, 'historical', 'cache');
      
      if (!fs.existsSync(cacheDir)) {
        console.log('💾 No cache directory to clean up');
        return;
      }

      const cacheFiles = fs.readdirSync(cacheDir);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of cacheFiles) {
        try {
          const filePath = path.join(cacheDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`🗑️ Deleted old cache file: ${file}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not process cache file ${file}:`, error.message);
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old cache files`);
      } else {
        console.log('💾 No old cache files to clean up');
      }
    } catch (error) {
      console.error('❌ Error cleaning up cache files:', error);
    }
  }

  // Get cleanup summary for user information
  getCleanupSummary() {
    try {
      const summary = {
        regularCSVs: 0,
        historicalCSVs: 0,
        cacheFiles: 0,
        totalSize: 0
      };

      // Count regular CSV files
      try {
        const regularCSVs = fs.readdirSync(this.dataDir)
          .filter(file => file.startsWith('kbc_productList_') && file.endsWith('.csv'));
        summary.regularCSVs = Math.max(0, regularCSVs.length - 1); // Keep one
      } catch (error) {
        // Directory might not exist
      }

      // Count historical CSV files
      try {
        const historicalDir = path.join(this.dataDir, 'historical');
        const historicalCSVs = fs.readdirSync(historicalDir)
          .filter(file => file.startsWith('historical_') && file.endsWith('.csv'));
        summary.historicalCSVs = historicalCSVs.length;
      } catch (error) {
        // Directory might not exist
      }

      // Count old cache files
      try {
        const cacheDir = path.join(this.dataDir, 'historical', 'cache');
        const cacheFiles = fs.readdirSync(cacheDir);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        summary.cacheFiles = cacheFiles.filter(file => {
          try {
            const filePath = path.join(cacheDir, file);
            const stats = fs.statSync(filePath);
            return stats.mtime.getTime() < sevenDaysAgo;
          } catch (error) {
            return false;
          }
        }).length;
      } catch (error) {
        // Directory might not exist
      }

      return summary;
    } catch (error) {
      console.error('❌ Error getting cleanup summary:', error);
      return { regularCSVs: 0, historicalCSVs: 0, cacheFiles: 0, totalSize: 0 };
    }
  }
}

module.exports = CleanupManager;