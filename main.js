const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const KBCScraper = require("./services/kbcScraperService");
const PortfolioDatabase = require("./portfolio-db");
const ingService = require("./services/ingService");

// ADD HERE: Version checker at the top after imports
const packageInfo = require("./package.json");
// ADD HERE: App configuration that matches renderer.js
const pkg = require("./package.json");
const APP_CONFIG = {
  VERSION: pkg.version || "0.3.0",
  APP_NAME: (pkg.build && pkg.build.productName) || "Portfolio Tracker",
  STATUS: pkg.status || "Beta Version",
  BUILD_DATE: pkg.buildDate || "2025-08-10",

  getFullVersion() {
    return `${this.APP_NAME} v${this.VERSION}`;
  },
};

let mainWindow;
let portfolioDb;

// Error handling (existing code)
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  dialog.showErrorBox("Main Process Error", error.message);
});

process.on("unhandledRejection", (reason, _promise) => {
  console.error("Unhandled Rejection:", reason);
});

function createWindow() {
  console.log("Creating main window...");

  // Better icon path handling for different environments
  let iconPath;
  if (app.isPackaged) {
    // In production, use path relative to resources
    iconPath = path.join(
      process.resourcesPath,
      "assets",
      "icons",
      "png",
      "256x256.png"
    );
  } else {
    // In development, use path relative to __dirname
    iconPath = path.join(__dirname, "assets", "icons", "png", "256x256.png");
  }

  // Verify icon exists
  if (!fs.existsSync(iconPath)) {
    console.warn(`Icon not found at ${iconPath}, using default`);
    iconPath = undefined; // Let Electron use default
  } else {
    console.log(`Using icon: ${iconPath}`);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: true,
    titleBarStyle: "default",
    webSecurity: false,
    icon: iconPath, // Use the determined icon path
    show: false,
    title: APP_CONFIG.getFullVersion(),
    autoHideMenuBar: true,
  });

  // Start maximized as requested
  mainWindow.maximize();

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    console.log("Window ready to show");
    mainWindow.show();
    mainWindow.focus();
  });

  // Load the main application
  mainWindow
    .loadFile("index.html")
    .then(() => {
      console.log("KBC ESOP Portfolio Tracker loaded successfully");
    })
    .catch((error) => {
      console.error("Failed to load app:", error);
      // Fallback to simple error page
      mainWindow.loadURL(
        "data:text/html," +
        encodeURIComponent(`
      <h1>App Load Error</h1>
      <p>Error: ${error.message}</p>
      <p>Check that index.html exists in the project directory.</p>
    `)
      );
      mainWindow.show();
    });

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize database when app is ready
async function initializeApp() {
  console.log("Initializing database...");

  try {
    portfolioDb = new PortfolioDatabase();
    await portfolioDb.initialize();
    console.log("✅ Portfolio database initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize portfolio database:", error);
    dialog.showErrorBox(
      "Database Error",
      "Failed to initialize portfolio database: " + error.message
    );
  }
}

// App event handlers
app.whenReady().then(async () => {
  console.log("App ready, initializing...");

  // ADD HERE: Version consistency check
  console.log(`🚀 ${APP_CONFIG.getFullVersion()} - ${APP_CONFIG.STATUS}`);

  await initializeApp();
  createWindow();
});

app.on("window-all-closed", () => {
  if (portfolioDb) {
    portfolioDb.close();
  }
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
// File selection handler
ipcMain.handle("select-import-file", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Select Portfolio Database Backup",
      filters: [{ name: "KBC ESOP Portfolio Backup", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];

      // Get file info
      const stats = fs.statSync(filePath);

      return {
        success: true,
        filePath: filePath,
        fileInfo: {
          size: stats.size,
          modified: stats.mtime,
        },
      };
    }

    return { success: false, message: "File selection cancelled" };
  } catch (error) {
    console.error("Error selecting import file:", error);
    return { success: false, error: error.message };
  }
});

// Import from specific file handler
ipcMain.handle(
  "import-database-from-file",
  async (event, filePath, mergeMode = false) => {
    try {
      // Read and parse the selected file
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const importData = JSON.parse(fileContent);

      // Use existing import logic
      const importResult = await portfolioDb.importDatabase(
        importData,
        mergeMode
      );
      return { success: true, importedEntries: importResult.importedEntries };
    } catch (error) {
      console.error("Error importing database from file:", error);
      return { success: false, error: error.message };
    }
  }
);
ipcMain.handle("get-app-version", () => {
  console.log("🔍 get-app-version IPC called");
  console.log("📦 pkg.version:", pkg.version);
  console.log("📦 Full pkg object:", JSON.stringify(pkg, null, 2));

  const versionInfo = {
    version: pkg.version,
    appName: pkg.build?.productName || pkg.name,
    description: pkg.description,
    author: pkg.author,
    buildDate: pkg.buildDate,
    status: pkg.status,
  };

  console.log("📤 Returning version info:", versionInfo);
  return versionInfo;
});
ipcMain.handle("delete-database", async () => {
  try {
    console.log("🗑️ Received delete database request");

    // Call the database deletion method
    const result = await portfolioDb.deleteDatabase();

    if (result.success) {
      console.log("✅ Database deleted successfully");
      return {
        success: true,
        message: "Database deleted successfully",
      };
    } else {
      throw new Error(result.error || "Failed to delete database");
    }
  } catch (error) {
    console.error("❌ Error deleting database:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred while deleting database",
    };
  }
});

console.log("🚀 KBC ESOP Portfolio Tracker v0.1 - Main process initialized");
// Window control handlers for frameless window
ipcMain.handle("window-minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
    // Send state update to renderer
    mainWindow.webContents.send("window-state-changed", {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
    });
  }
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    const wasMaximized = mainWindow.isMaximized();

    if (wasMaximized) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }

    // Return the new state immediately
    const newState = {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
    };

    // Also send state change event
    setTimeout(() => {
      mainWindow.webContents.send("window-state-changed", newState);
    }, 50); // Small delay to ensure state is updated

    return newState;
  }
  return { isMaximized: false, isMinimized: false };
});

ipcMain.handle("window-close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// IPC handlers for scraping functionality
ipcMain.handle("scrape-data", async (event) => {
  const { getPrice } = require('./services/priceService');
  const { getBelgianTime } = require('./services/timeService');

  return new Promise(async (resolve) => {
    try {
      const hasUpdated = await portfolioDb.hasUpdatedToday();
      if (hasUpdated) {
        mainWindow.webContents.send("scrape-progress", "✅ Already updated today");
        return resolve({
          success: true,
          message: "Already updated today. Next update available tomorrow after 09:00.",
          priceEntriesUpdated: 0
        });
      }

      let time;
      try {
        time = await getBelgianTime();
      } catch (error) {
        console.warn('⚠️ Cannot verify time, allowing update attempt');
        time = { isAfter9AM: true };
      }

      if (!time.isAfter9AM) {
        const timeStr = `${time.hour}:${String(time.minute).padStart(2, '0')}`;
        mainWindow.webContents.send("scrape-progress",
          `⏰ Prices available after 09:00 (current: ${timeStr})`);
        return resolve({
          success: false,
          message: `Prices available after 09:00 Belgian time (current: ${timeStr})`,
          priceEntriesUpdated: 0
        });
      }

      // Get all grants that need price updates
      const grants = await portfolioDb.getAllGrantsNeedingUpdate();

      if (grants.length === 0) {
        mainWindow.webContents.send(
          "scrape-progress",
          "✅ All grants already have today's prices"
        );
        return resolve({
          success: true,
          message: "All grants already have today's prices",
          priceEntriesUpdated: 0
        });
      }

      let completedCount = 0;
      const errors = [];

      // Process grants in parallel with progress updates
      const priceUpdates = grants.map(async (grant) => {
        try {
          const priceResult = await getPrice(grant, false);

          if (Array.isArray(priceResult)) {
            const priceHistory = priceResult.map(p => ({
              date: new Date(p.timestamp).toISOString().split('T')[0],
              price: p.price
            }));
            await portfolioDb.storeHistoricalPrices(
              grant.fund_name,
              grant.exercise_price,
              grant.grant_date,
              priceHistory
            );
          } else {
            await portfolioDb.storePriceUpdate(
              grant.id,
              priceResult.price,
              priceResult.timestamp
            );
          }

          // Send progress update
          completedCount++;
          mainWindow.webContents.send("scrape-progress", {
            text: `Updated ${completedCount}/${grants.length} grants`,
            percentage: Math.round((completedCount / grants.length) * 100)
          });

          return { success: true, grantId: grant.id };
        } catch (error) {
          errors.push({
            grantId: grant.id,
            error: error.message
          });
          return { success: false, grantId: grant.id, error: error.message };
        }
      });

      // Wait for all updates to complete
      const results = await Promise.all(priceUpdates);

      // Calculate final stats
      const successfulUpdates = results.filter(r => r.success).length;
      const failedUpdates = results.filter(r => !r.success).length;

      if (failedUpdates > 0) {
        console.error("❌ Some price updates failed:", errors);
        mainWindow.webContents.send(
          "scrape-progress",
          `❌ ${failedUpdates} price updates failed`
        );
      }

      // Rebuild evolution timeline to sync with new prices
      if (successfulUpdates > 0) {
        mainWindow.webContents.send(
          "scrape-progress",
          "🔄 Updating evolution timeline..."
        );
        const today = new Date().toISOString().split('T')[0];
        await portfolioDb.rebuildCompleteEvolutionTimeline(null, today);
      }

      resolve({
        success: failedUpdates === 0,
        priceEntriesUpdated: successfulUpdates,
        errors,
        message: `Updated ${successfulUpdates} grants, ${failedUpdates} failed`
      });

    } catch (error) {
      console.error("❌ Price update failed:", error);
      mainWindow.webContents.send(
        "scrape-progress",
        `❌ Price update failed: ${error.message}`
      );
      resolve({
        success: false,
        error: error.message,
        message: "Price update failed due to unexpected error"
      });
    }
  });
});

ipcMain.handle("test-connection", async () => {
  const scraper = new KBCScraper();
  return await scraper.testConnection();
});

ipcMain.handle("get-latest-csv", async () => {
  const scraper = new KBCScraper();
  return scraper.getLatestCSVFile();
});

// Enhanced Portfolio IPC handlers
ipcMain.handle("get-portfolio-overview", async () => {
  try {
    return await portfolioDb.getPortfolioOverview();
  } catch (error) {
    console.error("Error getting portfolio overview:", error);
    return { error: error.message };
  }
});
ipcMain.handle("get-latest-price-date", async () => {
  try {
    if (!portfolioDb) {
      return null;
    }
    return await portfolioDb.getLatestPriceDate();
  } catch (error) {
    console.error("Error getting latest price date:", error);
    return null;
  }
});

ipcMain.handle("has-updated-today", async () => {
  try {
    if (!portfolioDb) return false;
    return await portfolioDb.hasUpdatedToday();
  } catch (error) {
    console.error("❌ Error checking if updated today:", error);
    return false;
  }
});

ipcMain.handle("get-belgian-time", async () => {
  try {
    const { getBelgianTime } = require('./services/timeService');
    return await getBelgianTime();
  } catch (error) {
    console.error("❌ Error getting Belgian time:", error);
    return { isAfter9AM: true, hour: 9, minute: 0 };
  }
});

// FIXED: Check for existing grants before adding
ipcMain.handle(
  "check-existing-grant",
  async (event, grantDate, exercisePrice) => {
    try {
      console.log("=== MAIN: CHECK EXISTING GRANT DEBUG ===");
      console.log("1. Received params:", { grantDate, exercisePrice });

      const existingGrant = await portfolioDb.checkExistingGrant(
        grantDate,
        exercisePrice
      );

      console.log("2. Database query result:", existingGrant);
      console.log("3. Is null?", existingGrant === null);
      console.log("4. Is undefined?", existingGrant === undefined);
      console.log("5. Has data?", !!existingGrant);

      if (existingGrant) {
        console.log("6. ✅ EXISTING GRANT FOUND IN DB!");
        console.log("7. Grant details:", {
          id: existingGrant.id,
          quantity: existingGrant.quantity,
          fund_name: existingGrant.fund_name,
          tax_amount: existingGrant.tax_amount,
          tax_auto_calculated: existingGrant.tax_auto_calculated,
        });
      } else {
        console.log("6. ℹ️ No existing grant found in database");
      }

      console.log("=== END MAIN DEBUG ===");
      return existingGrant;
    } catch (error) {
      console.error("❌ Error in check-existing-grant:", error);
      return { error: error.message };
    }
  }
);

// FIXED: Handle grant merging
ipcMain.handle(
  "merge-grant",
  async (event, existingEntryId, additionalQuantity, additionalTaxAmount) => {
    try {
      const result = await portfolioDb.mergeGrant(
        existingEntryId,
        additionalQuantity,
        additionalTaxAmount
      );
      return result;
    } catch (error) {
      console.error("Error merging grant:", error);
      return { error: error.message };
    }
  }
);

// FIXED: Updated to match the new database method signature
ipcMain.handle("add-portfolio-entry", async (event, grantData) => {
  try {
    console.log("IPC: Adding portfolio entry with params:", grantData);

    // Validate ING requirements
    if (grantData.source === 'ING' && !grantData.isin) {
      throw new Error('ISIN is required for ING grants');
    }

    const result = await portfolioDb.addPortfolioEntry(grantData);
    return result;
  } catch (error) {
    console.error("Error adding portfolio entry:", error);
    return { error: error.message };
  }
}
);
// Get sale details for editing
ipcMain.handle("get-sale-details", async (event, saleId) => {
  try {
    return await portfolioDb.getSaleDetails(saleId);
  } catch (error) {
    console.error("Error getting sale details:", error);
    return { error: error.message };
  }
});
ipcMain.handle("get-sale-with-portfolio-data", async (event, saleId) => {
  try {
    return await portfolioDb.getSaleWithPortfolioData(saleId);
  } catch (error) {
    console.error("Error getting sale with portfolio data:", error);
    return { error: error.message };
  }
});
ipcMain.handle(
  "get-price-for-date",
  async (event, targetDate, exercisePrice, grantDate) => {
    try {
      console.log(`📡 IPC: get-price-for-date called for ${targetDate}`);
      const result = await portfolioDb.getPriceForDate(
        targetDate,
        exercisePrice,
        grantDate
      );
      console.log(`📡 IPC: get-price-for-date result:`, result);
      return result;
    } catch (error) {
      console.error("❌ IPC: Error getting price for date:", error);
      return { error: error.message };
    }
  }
);
ipcMain.handle("recalculate-evolution-timeline", async () => {
  try {
    await portfolioDb.recalculateEntireEvolutionTimeline();
    return { success: true };
  } catch (error) {
    console.error("Error recalculating evolution timeline:", error);
    return { error: error.message };
  }
});
// Update sale details
ipcMain.handle("update-sale", async (event, updatedSale) => {
  try {
    console.log("📝 IPC: update-sale called with:", updatedSale);
    const result = await portfolioDb.updateSale(updatedSale);
    console.log("📝 IPC: update-sale result:", result);
    return result;
  } catch (error) {
    console.error("❌ IPC: update-sale error:", error);
    return { error: error.message };
  }
});
ipcMain.handle("update-tax-amount", async (event, entryId, taxAmount) => {
  try {
    return await portfolioDb.updateTaxAmount(entryId, taxAmount);
  } catch (error) {
    console.error("Error updating tax amount:", error);
    return { error: error.message };
  }
});

ipcMain.handle("delete-portfolio-entry", async (event, entryId) => {
  try {
    return await portfolioDb.deletePortfolioEntry(entryId);
  } catch (error) {
    console.error("Error deleting portfolio entry:", error);
    return { error: error.message };
  }
});

ipcMain.handle("check-needs-initialization", async () => {
  try {
    return await portfolioDb.checkNeedsInitialization();
  } catch (error) {
    console.error("Error checking initialization status:", error);
    return false;
  }
});

ipcMain.handle("initialize-kbc-database", async (event) => {
  try {
    const onProgress = (progressData) => {
      event.sender.send('kbc-initialization-progress', progressData);
    };
    return await portfolioDb.initializeKbcData(onProgress);
  } catch (error) {
    console.error("Error initializing KBC database:", error);
    return { error: error.message };
  }
});

ipcMain.handle("get-options-by-grant-date", async (event, grantDate) => {
  try {
    return await portfolioDb.getOptionsByGrantDate(grantDate);
  } catch (error) {
    console.error("Error getting options by grant date:", error);
    return { error: error.message };
  }
});

ipcMain.handle("get-available-exercise-prices", async () => {
  try {
    return await portfolioDb.getAvailableExercisePrices();
  } catch (error) {
    console.error("Error getting available exercise prices:", error);
    return { error: error.message };
  }
});

// NEW: Sales transaction handlers
ipcMain.handle(
  "record-sale-transaction",
  async (event, portfolioEntryId, saleDate, quantitySold, salePrice, notes) => {
    try {
      return await portfolioDb.recordSaleTransaction(
        portfolioEntryId,
        saleDate,
        quantitySold,
        salePrice,
        notes
      );
    } catch (error) {
      console.error("Error recording sale transaction:", error);
      return { error: error.message };
    }
  }
);

ipcMain.handle("get-sales-history", async () => {
  try {
    return await portfolioDb.getSalesHistory();
  } catch (error) {
    console.error("Error getting sales history:", error);
    return { error: error.message };
  }
});

// NEW: Grant history handler
ipcMain.handle("get-grant-history", async () => {
  try {
    return await portfolioDb.getGrantHistory();
  } catch (error) {
    console.error("Error getting grant history:", error);
    return { error: error.message };
  }
});

// NEW: Portfolio evolution handlers
ipcMain.handle("get-portfolio-evolution", async (event, days = null) => {
  try {
    return await portfolioDb.getPortfolioEvolution(days);
  } catch (error) {
    console.error("Error getting portfolio evolution:", error);
    return { error: error.message };
  }
});

// NEW: Option price history for charts
ipcMain.handle(
  "get-option-price-history",
  async (event, exercisePrice, grantDate) => {
    try {
      return await portfolioDb.getOptionPriceHistory(exercisePrice, grantDate);
    } catch (error) {
      console.error("Error getting option price history:", error);
      return { error: error.message };
    }
  }
);

// NEW: Portfolio events for chart annotations
ipcMain.handle("get-portfolio-events", async () => {
  try {
    return await portfolioDb.getPortfolioEvents();
  } catch (error) {
    console.error("Error getting portfolio events:", error);
    return { error: error.message };
  }
});

// NEW: Database import/export handlers
ipcMain.handle("export-database", async () => {
  try {
    const exportData = await portfolioDb.exportDatabase();

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export Portfolio Database",
      defaultPath: `kbc-esop-backup-${new Date().toISOString().split("T")[0]
        }.json`,
      filters: [{ name: "KBC ESOP Portfolio Backup", extensions: ["json"] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
      return { success: true, filePath: result.filePath };
    }

    return { success: false, message: "Export cancelled" };
  } catch (error) {
    console.error("Error exporting database:", error);
    return { error: error.message };
  }
});

ipcMain.handle("import-database", async (event, mergeMode = false) => {
  try {
    // Show open dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import Portfolio Database",
      filters: [{ name: "KBC ESOP Portfolio Backup", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const importData = JSON.parse(fileContent);

      const importResult = await portfolioDb.importDatabase(
        importData,
        mergeMode
      );
      return { success: true, ...importResult };
    }

    return { success: false, message: "Import cancelled" };
  } catch (error) {
    console.error("Error importing database:", error);
    return { error: error.message };
  }
});

// Settings handlers (unchanged)
ipcMain.handle("get-setting", async (event, key) => {
  try {
    return await portfolioDb.getSetting(key);
  } catch (error) {
    console.error("Error getting setting:", error);
    return { error: error.message };
  }
});

ipcMain.handle("update-setting", async (event, key, value) => {
  try {
    console.log(`🔍 DEBUG MAIN: update-setting called with ${key} = ${value}`);
    const result = await portfolioDb.updateSetting(key, value);
    console.log(`🔍 DEBUG MAIN: updateSetting result for ${key}:`, result);
    return result;
  } catch (error) {
    console.error("Error updating setting:", error);
    return { error: error.message };
  }
});

ipcMain.handle("debug-database-state", async () => {
  try {
    if (!portfolioDb) return { error: "Database not initialized" };

    // Check portfolio entries
    const entriesStmt = portfolioDb.db.prepare(
      "SELECT * FROM portfolio_entries"
    );
    const entries = [];
    while (entriesStmt.step()) {
      entries.push(entriesStmt.getAsObject());
    }
    entriesStmt.free();

    // Check price history
    const pricesStmt = portfolioDb.db.prepare(
      "SELECT * FROM price_history ORDER BY price_date DESC LIMIT 10"
    );
    const prices = [];
    while (pricesStmt.step()) {
      prices.push(pricesStmt.getAsObject());
    }
    pricesStmt.free();

    // Check evolution data
    const evolutionStmt = portfolioDb.db.prepare(
      "SELECT * FROM portfolio_evolution ORDER BY snapshot_date DESC"
    );
    const evolution = [];
    while (evolutionStmt.step()) {
      evolution.push(evolutionStmt.getAsObject());
    }
    evolutionStmt.free();

    return {
      portfolioEntries: entries,
      priceHistory: prices,
      evolutionData: evolution,
      entriesCount: entries.length,
      pricesCount: prices.length,
      evolutionCount: evolution.length,
    };
  } catch (error) {
    return { error: error.message };
  }
});
// Export database data (for undo/redo snapshots) - returns data object instead of saving file
ipcMain.handle("export-database-data", async () => {
  try {
    console.log("📤 Exporting database data for snapshot...");
    const exportData = await portfolioDb.exportDatabase();

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("❌ Error exporting database data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Import database from data object (for undo/redo restore)
ipcMain.handle(
  "import-database-data",
  async (event, importData, mergeMode = false) => {
    try {
      console.log("📥 Importing database from data object...");

      // Validate import data
      if (!importData || !importData.metadata || !importData.portfolioEntries) {
        throw new Error("Invalid import data format");
      }

      // Use existing import functionality
      const importResult = await portfolioDb.importDatabase(
        importData,
        mergeMode
      );

      return {
        success: true,
        importedEntries: importResult.importedEntries || 0,
      };
    } catch (error) {
      console.error("❌ Error importing database data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Historical Price Fetching IPC Handler
ipcMain.handle("fetch-historical-prices", async (event, fundName, exercisePrice, grantDate, onProgress, source, isin) => {
  try {
    console.log(`📊 Fetching historical prices for: ${fundName} (€${exercisePrice}, ${grantDate})`);

    const HistoricalService = require('./services/historicalService');
    const scraper = new HistoricalService();

    // Progress callback to update frontend
    const progressCallback = (progress) => {
      event.sender.send('historical-fetch-progress', progress);
    };

    const result = await scraper.fetchHistoricalPricesForOption(
      fundName,
      exercisePrice,
      grantDate,
      progressCallback,
      source,
      isin
    );

    console.log(`✅ Successfully fetched ${result.priceHistory.length} historical prices`);

    // Log derived price information if applicable
    if (result.grantDatePriceDerived) {
      console.log(`📊 Grant date price was derived: €${result.grantDatePrice} (${result.grantDatePriceSource})`);
    }

    // Store in price_history table
    if (result.priceHistory.length > 0) {
      await portfolioDb.storeHistoricalPrices(
        fundName,
        exercisePrice,
        grantDate,
        result.priceHistory
      );
    }

    return {
      success: true,
      fundName: result.fundName,
      exercisePrice: result.exercisePrice,
      grantDate: result.grantDate,
      grantDatePrice: result.grantDatePrice,
      grantDatePriceDerived: result.grantDatePriceDerived,
      grantDatePriceSource: result.grantDatePriceSource,
      currentPrice: result.currentPrice,
      priceCount: result.priceHistory.length,
      dateRange: {
        from: result.priceHistory[result.priceHistory.length - 1]?.date,
        to: result.priceHistory[0]?.date
      }
    };

  } catch (error) {
    console.error("❌ Error fetching historical prices:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Update Historical Prices for Existing Portfolio IPC Handler
ipcMain.handle("update-portfolio-historical-prices", async (event) => {
  try {
    console.log("🔄 Updating historical prices for existing portfolio...");

    // Get unique options from portfolio
    const portfolioOverview = await portfolioDb.getPortfolioOverview();
    const uniqueOptions = new Map();

    portfolioOverview.forEach(entry => {
      const key = `${entry.fund_name}-${entry.exercise_price}-${entry.grant_date}`;
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, {
          fund_name: entry.fund_name,
          exercise_price: entry.exercise_price,
          grant_date: entry.grant_date,
          source: entry.source,
          isin: entry.isin
        });
      }
    });

    const optionsToUpdate = Array.from(uniqueOptions.values());
    console.log(`📊 Found ${optionsToUpdate.length} unique options to update`);

    const HistoricalService = require('./services/historicalService');
    const scraper = new HistoricalService();

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < optionsToUpdate.length; i++) {
      const option = optionsToUpdate[i];

      try {
        console.log(`📊 Processing option ${i + 1}/${optionsToUpdate.length}: ${option.fund_name} (€${option.exercise_price}, ${option.grant_date})`);

        // Progress callback
        const progressCallback = (progress) => {
          event.sender.send('historical-batch-progress', {
            optionIndex: i,
            totalOptions: optionsToUpdate.length,
            optionName: option.fund_name,
            progress: progress
          });
        };

        const result = await scraper.fetchHistoricalPricesForOption(
          option.fund_name,
          option.exercise_price,
          option.grant_date,
          progressCallback,
          option.source,
          option.isin
        );

        // Log derived price information if applicable
        if (result.grantDatePriceDerived) {
          console.log(`📊 [${option.fund_name}] Grant date price was derived: €${result.grantDatePrice} (${result.grantDatePriceSource})`);
        }

        // Store prices
        if (result.priceHistory.length > 0) {
          await portfolioDb.storeHistoricalPrices(
            option.fund_name,
            option.exercise_price,
            option.grant_date,
            result.priceHistory
          );
          successCount++;
        }

        // Add delay between options
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error updating ${option.fund_name} (€${option.exercise_price}, ${option.grant_date}):`, error.message);
        console.error(`   Full error:`, error);
        errorCount++;
      }
    }

    // Send progress update for rebuild phase - use special format to avoid 18/17 display
    event.sender.send('historical-batch-progress', {
      optionIndex: 'rebuild',
      totalOptions: 'phase',
      optionName: 'Rebuilding Evolution Timeline',
      progress: { text: 'Starting timeline rebuild...', percentage: 0 }
    });

    // After all historical prices are processed, completely rebuild the evolution timeline
    console.log("🔥 Rebuilding complete evolution timeline with historical data...");

    // Create progress callback to send updates during rebuild
    const rebuildProgressCallback = (progress) => {
      event.sender.send('historical-batch-progress', {
        optionIndex: 'rebuild',
        totalOptions: 'phase',
        optionName: 'Rebuilding Evolution Timeline',
        progress: progress
      });
    };

    await portfolioDb.rebuildCompleteEvolutionTimeline(rebuildProgressCallback);

    // Send final completion progress
    event.sender.send('historical-batch-progress', {
      optionIndex: 'rebuild',
      totalOptions: 'phase',
      optionName: 'Rebuilding Evolution Timeline',
      progress: { text: 'Evolution timeline rebuilt successfully!', percentage: 100 }
    });

    console.log("✅ Complete evolution timeline rebuilt with historical data");

    return {
      success: true,
      updated: successCount,
      errors: errorCount,
      total: optionsToUpdate.length
    };

  } catch (error) {
    console.error("❌ Error updating portfolio historical prices:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get historical prices for a specific option IPC Handler
ipcMain.handle("get-historical-prices-for-option", async (event, grantDate, exercisePrice) => {
  try {
    console.log(`🔍 Getting historical prices for option: grant date ${grantDate}, exercise price €${exercisePrice}`);

    const prices = await portfolioDb.getHistoricalPricesForOption(grantDate, exercisePrice);

    console.log(`✅ Found ${prices ? prices.length : 0} historical price entries`);
    return prices || [];

  } catch (error) {
    console.error("❌ Error getting historical prices for option:", error);
    return [];
  }
});

// IPC handler for opening external URLs
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('❌ Error opening external URL:', error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle("find-fop-product-info", async (event, isin) => {
  try {
    return await ingService.findFopProductInfo(isin);
  } catch (error) {
    console.error("Error finding FOP product info:", error);
    return { error: error.message };
  }
});


console.log("🚀 KBC ESOP Portfolio Tracker v0.2 - Main process initialized");
