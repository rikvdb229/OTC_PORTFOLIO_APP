const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const KBCScraper = require("./scraper");
const PortfolioDatabase = require("./portfolio-db");

// ADD HERE: Version checker at the top after imports
const packageInfo = require("./package.json");

// Version consistency check
function checkVersionConsistency() {
  const packageVersion = packageInfo.version;
  const appVersion = "0.1"; // This should match APP_CONFIG.VERSION from renderer.js

  if (packageVersion !== appVersion) {
    console.warn(
      `⚠️ Version mismatch: package.json (${packageVersion}) vs app config (${appVersion})`
    );
    console.warn(
      "   Please update package.json or APP_CONFIG.VERSION to match"
    );
  } else {
    console.log(`✅ Version consistency check passed: v${packageVersion}`);
  }

  return {
    packageVersion,
    appVersion,
    isConsistent: packageVersion === appVersion,
  };
}

// ADD HERE: App configuration that matches renderer.js
const APP_CONFIG = {
  VERSION: "0.1",
  APP_NAME: "KBC ESOP Portfolio Tracker",
  STATUS: "Development Version",
  BUILD_DATE: "2024-12-15",

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

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

function createWindow() {
  console.log("Creating main window...");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // CHANGED: Use native window controls
    frame: true, // Enable native frame
    titleBarStyle: "default", // Use default OS title bar
    // REMOVED: titleBarStyle: "hidden"
    webSecurity: false,
    icon: path.join(__dirname, "assets/icon.png"),
    show: false,
    title: APP_CONFIG.getFullVersion(), // Set window title with version
    // OPTIONAL: Remove menu bar (Windows/Linux only)
    autoHideMenuBar: true, // Hide menu bar, can be toggled with Alt
    // OR completely remove menu:
    // menu: null,                  // Completely remove menu bar
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
  const versionCheck = checkVersionConsistency();
  console.log(`🚀 ${APP_CONFIG.getFullVersion()} - ${APP_CONFIG.STATUS}`);

  await initializeApp();
  createWindow();
});

app.on("window-all-closed", () => {
  if (portfolioDb) {
    portfolioDb.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("get-app-version", () => {
  return {
    version: APP_CONFIG.VERSION,
    fullVersion: APP_CONFIG.getFullVersion(),
    packageVersion: packageInfo.version,
    buildDate: APP_CONFIG.BUILD_DATE,
    status: APP_CONFIG.STATUS,
  };
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
  const scraper = new KBCScraper();

  return new Promise((resolve) => {
    scraper
      .scrapeData((progress) => {
        // Send simplified progress updates to renderer
        let simplifiedProgress = "Connecting...";
        if (progress.includes("Loading") || progress.includes("page")) {
          simplifiedProgress = "Loading data...";
        } else if (progress.includes("Setting") || progress.includes("date")) {
          simplifiedProgress = "Processing...";
        } else if (
          progress.includes("Download") ||
          progress.includes("Export")
        ) {
          simplifiedProgress = "Downloading...";
        } else if (
          progress.includes("complete") ||
          progress.includes("success")
        ) {
          simplifiedProgress = "Complete!";
        }

        event.sender.send("scrape-progress", simplifiedProgress);
      })
      .then(async (result) => {
        // If scraping was successful, update database with new prices
        if (result.success && portfolioDb) {
          try {
            // Parse the CSV and update prices in database
            const Papa = require("papaparse");

            if (fs.existsSync(result.filePath)) {
              const csvContent = fs.readFileSync(result.filePath, "utf-8");
              const parsedData = Papa.parse(csvContent, {
                header: false,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimiter: ",",
              });

              console.log("CSV parsed, total rows:", parsedData.data.length);

              // Transform the data to match expected format
              const transformedData = parsedData.data
                .map((row, index) => {
                  try {
                    if (row.length >= 8) {
                      // Ensure we have all columns including fund name
                      const exercisePrice = parseFloat(row[3]);
                      const currentValue = parseFloat(row[5]);
                      const grantDate = row[2];
                      const priceDate = row[6]; // FIXED: Column 6 is the price date
                      const fundName = row[7]; // Fund name is in column 7

                      if (
                        !isNaN(exercisePrice) &&
                        !isNaN(currentValue) &&
                        exercisePrice > 0 &&
                        currentValue > 0 &&
                        fundName &&
                        fundName.trim() !== ""
                      ) {
                        return {
                          exercise_price: exercisePrice,
                          current_value: currentValue,
                          grant_date: grantDate,
                          price_date: priceDate, // FIXED: Use actual price date from CSV
                          fund_name: fundName.trim(),
                        };
                      }
                    }
                    return null;
                  } catch (error) {
                    console.warn(`Error parsing row ${index}:`, error, row);
                    return null;
                  }
                })
                .filter((row) => row !== null);

              console.log(
                "Transformed data for database:",
                transformedData.slice(0, 3)
              );

              if (transformedData.length > 0) {
                // FIXED: Pass the actual price date from CSV, not today's date
                const actualPriceDate =
                  transformedData[0].price_date ||
                  new Date().toISOString().split("T")[0];
                await portfolioDb.updatePricesFromCSV(
                  transformedData,
                  actualPriceDate
                );
                console.log(
                  `✅ Portfolio prices updated: ${transformedData.length} entries with price date: ${actualPriceDate}`
                );
              } else {
                console.warn("❌ No valid price data found in CSV");
              }
            }
          } catch (dbError) {
            console.error("❌ Error updating portfolio prices:", dbError);
          }
        }
        resolve(result);
      });
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
ipcMain.handle(
  "add-portfolio-entry",
  async (event, grantDate, exercisePrice, quantity, taxAmount) => {
    try {
      console.log("IPC: Adding portfolio entry with params:", {
        grantDate,
        exercisePrice,
        quantity,
        taxAmount,
      });

      const result = await portfolioDb.addPortfolioEntry(
        grantDate,
        exercisePrice,
        quantity,
        taxAmount
      );
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

// Update sale details
ipcMain.handle("update-sale", async (event, updatedSale) => {
  try {
    return await portfolioDb.updateSale(updatedSale);
  } catch (error) {
    console.error("Error updating sale:", error);
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
      defaultPath: `kbc-esop-backup-${
        new Date().toISOString().split("T")[0]
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
    return await portfolioDb.updateSetting(key, value);
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

console.log("🚀 KBC ESOP Portfolio Tracker v0.1 - Main process initialized");
