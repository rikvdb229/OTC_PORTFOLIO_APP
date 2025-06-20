const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const os = require("os");

class PortfolioDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.dbDirectory = null;
    this.initializeDatabasePath();
  }

  // Initialize database path with Windows permission-friendly locations
  initializeDatabasePath() {
    let dbDirectory;
    let dbPath;

    // Check if we're in development mode (app folder is writable)
    const isDevelopment = this.isInDevelopmentMode();

    try {
      if (isDevelopment) {
        // Development mode: use current directory for convenience
        dbDirectory = process.cwd();
        dbPath = path.join(dbDirectory, "portfolio.db");
        console.log(
          `🔧 Development mode: Using current directory: ${dbDirectory}`
        );
      } else {
        // Production mode: prioritize user directories
        if (app && app.getPath) {
          dbDirectory = app.getPath("userData");
          dbPath = path.join(dbDirectory, "portfolio.db");
          console.log(
            `📁 Production mode: Using Electron userData directory: ${dbDirectory}`
          );
        } else {
          throw new Error(
            "Electron app not available, trying user directories"
          );
        }
      }
    } catch (electronError) {
      // Fallback to user directories
      try {
        if (process.platform === "win32") {
          dbDirectory = path.join(
            os.homedir(),
            "AppData",
            "Local",
            "OTCPortfolioApp"
          );
        } else {
          dbDirectory = path.join(os.homedir(), ".otc-portfolio");
        }
        dbPath = path.join(dbDirectory, "portfolio.db");
        console.log(`📁 Fallback: Using user directory: ${dbDirectory}`);
      } catch (homeError) {
        // Final fallback: temp directory
        console.warn("⚠️ Could not access user directories, using temp folder");
        dbDirectory = path.join(os.tmpdir(), "OTCPortfolioApp");
        dbPath = path.join(dbDirectory, "portfolio.db");
        console.log(`📁 Final fallback: Using temp directory: ${dbDirectory}`);
      }
    }

    this.dbDirectory = dbDirectory;
    this.dbPath = dbPath;

    // Ensure directory exists with proper permissions
    this.ensureDatabaseDirectory();
  }

  // Detect if we're running in development mode
  isInDevelopmentMode() {
    try {
      const currentDir = process.cwd();

      // Check if we can write to current directory
      const testFile = path.join(currentDir, "dev-test-" + Date.now() + ".tmp");
      fs.writeFileSync(testFile, "dev-test");
      fs.unlinkSync(testFile);

      // Check if we're in a typical development folder structure
      const isDev =
        currentDir.includes("CodeProjects") ||
        currentDir.includes("dev") ||
        currentDir.includes("development") ||
        currentDir.includes("src") ||
        fs.existsSync(path.join(currentDir, "package.json")) ||
        fs.existsSync(path.join(currentDir, ".git")) ||
        !currentDir.toLowerCase().includes("program files");

      console.log(`🔍 Development mode detection: ${isDev ? "YES" : "NO"}`);
      console.log(`   Current directory: ${currentDir}`);
      console.log(`   Can write to current dir: YES`);

      return isDev;
    } catch (error) {
      console.log(
        `🔍 Development mode detection: NO (cannot write to current directory)`
      );
      return false;
    }
  }

  // Ensure database directory exists with proper Windows permissions
  ensureDatabaseDirectory() {
    try {
      if (!fs.existsSync(this.dbDirectory)) {
        fs.mkdirSync(this.dbDirectory, { recursive: true, mode: 0o755 });
        console.log(`✅ Created database directory: ${this.dbDirectory}`);
      }

      // Test write permissions
      const testFile = path.join(this.dbDirectory, "test-write.tmp");
      try {
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        console.log(`✅ Write permissions verified for: ${this.dbDirectory}`);
      } catch (writeError) {
        throw new Error(
          `No write permissions for directory: ${this.dbDirectory}`
        );
      }
    } catch (error) {
      console.error(`❌ Database directory error: ${error.message}`);

      // Final fallback: use temp directory
      if (!this.dbDirectory.includes("temp")) {
        console.log("🔄 Falling back to temp directory...");
        this.dbDirectory = path.join(os.tmpdir(), "OTCPortfolioApp");
        this.dbPath = path.join(this.dbDirectory, "portfolio.db");

        try {
          fs.mkdirSync(this.dbDirectory, { recursive: true });
          console.log(`✅ Using temp directory: ${this.dbDirectory}`);
        } catch (tempError) {
          throw new Error(
            `Cannot create any writable directory: ${tempError.message}`
          );
        }
      } else {
        throw error;
      }
    }
  }

  // Get database info for troubleshooting
  getDatabaseInfo() {
    return {
      dbPath: this.dbPath,
      dbDirectory: this.dbDirectory,
      exists: fs.existsSync(this.dbPath),
      directoryExists: fs.existsSync(this.dbDirectory),
      platform: process.platform,
      permissions: this.checkPermissions(),
    };
  }

  // Check file/directory permissions
  checkPermissions() {
    const permissions = {
      directoryRead: false,
      directoryWrite: false,
      fileRead: false,
      fileWrite: false,
    };

    try {
      // Check directory permissions
      fs.accessSync(this.dbDirectory, fs.constants.R_OK);
      permissions.directoryRead = true;
    } catch (e) {
      /* ignore */
    }

    try {
      fs.accessSync(this.dbDirectory, fs.constants.W_OK);
      permissions.directoryWrite = true;
    } catch (e) {
      /* ignore */
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        fs.accessSync(this.dbPath, fs.constants.R_OK);
        permissions.fileRead = true;
      } catch (e) {
        /* ignore */
      }

      try {
        fs.accessSync(this.dbPath, fs.constants.W_OK);
        permissions.fileWrite = true;
      } catch (e) {
        /* ignore */
      }
    }

    return permissions;
  }

  // Initialize database connection with error handling
  async initialize() {
    try {
      console.log("🔄 Initializing database...");
      console.log(`📍 Database location: ${this.dbPath}`);

      const SQL = await initSqlJs();

      // Try to load existing database file
      let fileBuffer = null;
      if (fs.existsSync(this.dbPath)) {
        try {
          console.log("📖 Loading existing database file...");
          fileBuffer = fs.readFileSync(this.dbPath);
          console.log(`✅ Database file loaded (${fileBuffer.length} bytes)`);
        } catch (readError) {
          console.error(`❌ Cannot read database file: ${readError.message}`);

          // Try to backup and recreate
          const backupPath = `${this.dbPath}.backup.${Date.now()}`;
          try {
            fs.copyFileSync(this.dbPath, backupPath);
            console.log(`📦 Backed up corrupted database to: ${backupPath}`);
          } catch (backupError) {
            console.warn(
              `⚠️ Could not backup database: ${backupError.message}`
            );
          }

          // Continue with empty database
          fileBuffer = null;
        }
      } else {
        console.log("🆕 Creating new database...");
      }

      this.db = new SQL.Database(fileBuffer);
      console.log("✅ Database connection established");

      await this.createTables();

      // Test database operations
      await this.testDatabaseOperations();

      return Promise.resolve();
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      return Promise.reject(error);
    }
  }

  // Test basic database operations
  async testDatabaseOperations() {
    try {
      // Test read operation
      const stmt = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      const tables = [];
      while (stmt.step()) {
        tables.push(stmt.getAsObject().name);
      }
      stmt.free();
      console.log(`📋 Database tables: ${tables.join(", ")}`);

      // Test write operation (save database)
      this.saveDatabase();
      console.log("✅ Database read/write operations successful");
    } catch (error) {
      console.error(`❌ Database operation test failed: ${error.message}`);
      throw error;
    }
  }

  // Save database to file with error handling
  saveDatabase() {
    if (!this.db) {
      console.warn("⚠️ No database connection to save");
      return false;
    }

    try {
      const data = this.db.export();

      // Create backup of existing file
      if (fs.existsSync(this.dbPath)) {
        const backupPath = `${this.dbPath}.bak`;
        try {
          fs.copyFileSync(this.dbPath, backupPath);
        } catch (backupError) {
          console.warn(`⚠️ Could not create backup: ${backupError.message}`);
        }
      }

      // Write new database file
      fs.writeFileSync(this.dbPath, data);
      console.log(`💾 Database saved to: ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to save database: ${error.message}`);

      // Try alternative save location
      try {
        const altPath = path.join(
          os.tmpdir(),
          `portfolio_backup_${Date.now()}.db`
        );
        const data = this.db.export();
        fs.writeFileSync(altPath, data);
        console.log(`💾 Database saved to alternative location: ${altPath}`);
        return altPath;
      } catch (altError) {
        console.error(`❌ Alternative save also failed: ${altError.message}`);
        throw error;
      }
    }
  }

  // Create all necessary tables
  async createTables() {
    const schema = `
    -- Enhanced portfolio entries table
    CREATE TABLE IF NOT EXISTS portfolio_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grant_date DATE NOT NULL,
      fund_name TEXT,
      exercise_price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      amount_granted DECIMAL(10,2),
      current_value DECIMAL(10,2),
      tax_amount DECIMAL(10,2) DEFAULT NULL,
      tax_auto_calculated DECIMAL(10,2),
      total_sold_quantity INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Price history table
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_date DATE NOT NULL,
      exercise_price DECIMAL(10,2) NOT NULL,
      current_value DECIMAL(10,2) NOT NULL,
      high_value DECIMAL(10,2),
      low_value DECIMAL(10,2),
      grant_date DATE,
      fund_name TEXT,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(price_date, exercise_price)
    );

    -- Sales transactions table
    CREATE TABLE IF NOT EXISTS sales_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_entry_id INTEGER NOT NULL,
      sale_date DATE NOT NULL,
      quantity_sold INTEGER NOT NULL,
      sale_price DECIMAL(10,2) NOT NULL,
      total_sale_value DECIMAL(10,2) NOT NULL,
      tax_deducted DECIMAL(10,2) NOT NULL,
      realized_gain_loss DECIMAL(10,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_entry_id) REFERENCES portfolio_entries(id)
    );

    -- Portfolio evolution snapshots
    CREATE TABLE IF NOT EXISTS portfolio_evolution (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date DATE NOT NULL UNIQUE,
      total_portfolio_value DECIMAL(12,2) NOT NULL,
      total_unrealized_gain DECIMAL(12,2) NOT NULL,
      total_realized_gain DECIMAL(12,2) NOT NULL,
      total_options_count INTEGER NOT NULL,
      active_options_count INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Application settings
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key VARCHAR(50) UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Option price history
    CREATE TABLE IF NOT EXISTS option_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_price DECIMAL(10,2) NOT NULL,
      grant_date DATE NOT NULL,
      price_date DATE NOT NULL,
      current_value DECIMAL(10,2) NOT NULL,
      high_value DECIMAL(10,2),
      low_value DECIMAL(10,2),
      fund_name TEXT,
      volume INTEGER DEFAULT 0,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(exercise_price, grant_date, price_date)
    );

    -- Database metadata
    CREATE TABLE IF NOT EXISTS database_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schema_version INTEGER NOT NULL DEFAULT 2,
      last_migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      backup_count INTEGER DEFAULT 0
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_portfolio_grant_date ON portfolio_entries(grant_date);
    CREATE INDEX IF NOT EXISTS idx_portfolio_exercise_price ON portfolio_entries(exercise_price);
    CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(price_date);
    CREATE INDEX IF NOT EXISTS idx_sales_portfolio_entry ON sales_transactions(portfolio_entry_id);
    CREATE INDEX IF NOT EXISTS idx_evolution_date ON portfolio_evolution(snapshot_date);
  `;

    try {
      this.db.exec(schema);

      // Insert default settings
      const defaultSettings = [
        ["target_percentage", "65"],
        ["tax_auto_rate", "30"],
        ["currency_symbol", "€"],
        ["auto_update_prices", "false"],
        ["date_format", "DD/MM/YYYY"],
        ["start_maximized", "true"],
        ["last_backup_date", ""],
        ["backup_enabled", "true"],
      ];

      defaultSettings.forEach(([key, value]) => {
        const stmt = this.db.prepare(
          "INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)"
        );
        stmt.run([key, value]);
        stmt.free();
      });

      // Initialize database metadata
      const metaStmt = this.db.prepare(
        "INSERT OR IGNORE INTO database_metadata (schema_version) VALUES (?)"
      );
      metaStmt.run([2]);
      metaStmt.free();

      this.saveDatabase();
      console.log("✅ Database schema created successfully");
      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Schema creation failed: ${error.message}`);
      return Promise.reject(error);
    }
  }

  // Add diagnostic method for troubleshooting
  async runDiagnostics() {
    console.log("\n🔍 DATABASE DIAGNOSTICS");
    console.log("========================");

    const info = this.getDatabaseInfo();
    console.log("📍 Database Path:", info.dbPath);
    console.log("📁 Directory:", info.dbDirectory);
    console.log("📄 Database Exists:", info.exists);
    console.log("📁 Directory Exists:", info.directoryExists);
    console.log("🖥️ Platform:", info.platform);
    console.log("🔐 Permissions:", JSON.stringify(info.permissions, null, 2));

    if (info.exists) {
      try {
        const stats = fs.statSync(info.dbPath);
        console.log("📊 File Size:", Math.round(stats.size / 1024), "KB");
        console.log("📅 Last Modified:", stats.mtime.toISOString());
      } catch (statError) {
        console.log("❌ Could not get file stats:", statError.message);
      }
    }

    if (this.db) {
      try {
        const stmt = this.db.prepare(
          "SELECT COUNT(*) as count FROM portfolio_entries"
        );
        stmt.step();
        const result = stmt.getAsObject();
        stmt.free();
        console.log("📈 Portfolio Entries:", result.count);
      } catch (queryError) {
        console.log("❌ Could not query database:", queryError.message);
      }
    }

    console.log("========================\n");
  }
  // 📍 ADD THE MIGRATION METHOD HERE - Right after createTables()
  /**
   * Add updated_at column to sales_transactions table
   * Call this method during database initialization
   */
  async migrateSalesTransactionsTable() {
    try {
      console.log("🔄 Checking if sales_transactions table needs migration...");

      // Check if updated_at column already exists
      const stmt = this.db.prepare("PRAGMA table_info(sales_transactions)");
      const columns = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        columns.push(row.name);
      }
      stmt.free();

      console.log("📋 Current columns in sales_transactions:", columns);

      // Check if updated_at column exists
      if (columns.includes("updated_at")) {
        console.log("✅ updated_at column already exists, no migration needed");
        return;
      }

      console.log("🔧 Adding updated_at column to sales_transactions table...");

      // FIXED: Add column with NULL default first
      const alterStmt = this.db.prepare(`
      ALTER TABLE sales_transactions 
      ADD COLUMN updated_at TIMESTAMP
    `);
      alterStmt.step();
      alterStmt.free();

      // FIXED: Then update all records to set updated_at = created_at
      const updateStmt = this.db.prepare(`
      UPDATE sales_transactions 
      SET updated_at = created_at
    `);
      updateStmt.step();
      updateStmt.free();

      // Save the changes
      this.saveDatabase();

      console.log(
        "✅ Successfully added updated_at column to sales_transactions"
      );
    } catch (error) {
      console.error("❌ Error migrating sales_transactions table:", error);
      throw error;
    }
  }
  /**
   * Get sale details by ID for editing
   * @param {number} saleId - Sale transaction ID
   * @returns {Object} Sale details including grant information
   */
  /**
   * FIXED: Get sale details by ID for editing (sql.js compatible)
   * Replace the existing getSaleDetails method in portfolio-db.js with this version
   * @param {number} saleId - Sale transaction ID
   * @returns {Object} Sale details including grant information
   */
  async getSaleDetails(saleId) {
    try {
      console.log("🔍 Getting sale details for ID:", saleId);

      const stmt = this.db.prepare(`
      SELECT 
        st.id,
        st.sale_date,
        st.quantity_sold,
        st.sale_price,
        st.total_sale_value,
        st.tax_deducted,
        st.realized_gain_loss,
        st.notes,
        pe.grant_date,
        pe.exercise_price,
        pe.fund_name
      FROM sales_transactions st
      JOIN portfolio_entries pe ON st.portfolio_entry_id = pe.id
      WHERE st.id = ?
    `);

      // FIXED: Use sql.js binding pattern instead of .get()
      stmt.bind([saleId]);

      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();

      console.log("📦 Raw query result:", result);

      if (!result) {
        console.error("❌ No sale found with ID:", saleId);
        throw new Error(`Sale with ID ${saleId} not found`);
      }

      console.log("✅ Sale details retrieved successfully:", {
        id: result.id,
        sale_date: result.sale_date,
        quantity_sold: result.quantity_sold,
        sale_price: result.sale_price,
        grant_date: result.grant_date,
        exercise_price: result.exercise_price,
        fund_name: result.fund_name,
      });

      return result;
    } catch (error) {
      console.error("❌ Error getting sale details:", error);
      throw error;
    }
  }

  /**
   * FIXED: Update sale details with correct P&L calculation
   * Replace the existing updateSale method in portfolio-db.js
   * @param {Object} updatedSale - Updated sale data
   * @param {number} updatedSale.id - Sale ID
   * @param {string} updatedSale.sale_date - New sale date
   * @param {number} updatedSale.sale_price - New sale price
   * @param {string} updatedSale.notes - New notes
   * @returns {Object} Update result
   */
  async updateSale(updatedSale) {
    try {
      console.log("🔄 Updating sale with data:", updatedSale);

      // First get the current sale data to recalculate values
      const currentSale = await this.getSaleDetails(updatedSale.id);
      console.log("📦 Current sale data:", currentSale);

      // Calculate new values based on updated price
      const newTotalSaleValue =
        updatedSale.sale_price * currentSale.quantity_sold;

      // FIXED: Use correct cost basis formula (€10 per option, NOT exercise price)
      const costBasis = currentSale.quantity_sold * 10; // €10 per option cost basis
      const newRealizedPL = newTotalSaleValue - costBasis;

      console.log("🧮 Recalculated values:", {
        oldSalePrice: currentSale.sale_price,
        newSalePrice: updatedSale.sale_price,
        quantity: currentSale.quantity_sold,
        newTotalSaleValue,
        costBasis,
        newRealizedPL,
        exercisePrice: currentSale.exercise_price, // For reference (NOT used in calculation)
        oldRealizedPL: currentSale.realized_gain_loss, // For comparison
      });

      // FIXED: Update the sale record with sql.js pattern
      const stmt = this.db.prepare(`
      UPDATE sales_transactions 
      SET 
        sale_date = ?,
        sale_price = ?,
        total_sale_value = ?,
        realized_gain_loss = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      // FIXED: Use sql.js binding pattern
      stmt.bind([
        updatedSale.sale_date,
        updatedSale.sale_price,
        newTotalSaleValue,
        newRealizedPL,
        updatedSale.notes || null,
        updatedSale.id,
      ]);

      const result = stmt.step();
      stmt.free();

      console.log("📝 Update result:", result);

      // Save database changes
      this.saveDatabase();

      console.log(`✅ Updated sale ID ${updatedSale.id} successfully`);
      console.log(
        `📊 P&L changed from €${currentSale.realized_gain_loss?.toFixed(
          2
        )} to €${newRealizedPL.toFixed(2)}`
      );

      return {
        success: true,
        id: updatedSale.id,
        changes: 1, // sql.js doesn't return changes count like this
        newTotalSaleValue,
        newRealizedPL,
        costBasis,
        oldRealizedPL: currentSale.realized_gain_loss,
      };
    } catch (error) {
      console.error("❌ Error updating sale:", error);
      throw error;
    }
  }
  // FIXED: Check for existing grants to handle merging
  // UPDATE this method in portfolio-db.js

  // ENHANCED: Check for existing grants - returns ALL matching grants
  async checkExistingGrant(grantDate, exercisePrice) {
    try {
      const stmt = this.db.prepare(`
      SELECT 
        id, 
        quantity, 
        fund_name, 
        tax_amount, 
        tax_auto_calculated,
        created_at,
        (quantity - total_sold_quantity) as quantity_remaining
      FROM portfolio_entries 
      WHERE DATE(grant_date) = DATE(?) AND exercise_price = ?
      AND (quantity - total_sold_quantity) > 0
      ORDER BY created_at DESC, id DESC
    `);

      const results = [];
      stmt.bind([grantDate, exercisePrice]);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      // Return null if no grants found, single grant if one found, array if multiple
      if (results.length === 0) {
        return Promise.resolve(null);
      } else if (results.length === 1) {
        return Promise.resolve(results[0]);
      } else {
        return Promise.resolve(results); // Multiple grants - return array
      }
    } catch (error) {
      console.error("Error checking existing grant:", error);
      return Promise.reject(error);
    }
  }

  // FIXED: Add method to merge grants
  async mergeGrant(
    existingEntryId,
    additionalQuantity,
    additionalTaxAmount = null
  ) {
    try {
      console.log("=== MERGE GRANT DEBUG (sql.js) ===");
      console.log("1. Input params:", {
        existingEntryId,
        additionalQuantity,
        additionalTaxAmount,
      });

      // FIXED: Get existing entry using sql.js pattern
      const existingStmt = this.db.prepare(
        "SELECT * FROM portfolio_entries WHERE id = ?"
      );

      let existing = null;
      existingStmt.bind([existingEntryId]);
      if (existingStmt.step()) {
        existing = existingStmt.getAsObject();
      }
      existingStmt.free();

      if (!existing) {
        throw new Error("Existing grant not found with ID: " + existingEntryId);
      }

      console.log("2. Existing entry from DB:", existing);

      // Ensure all values are properly validated and not null
      const currentQuantity = existing.quantity || 0;
      const additionalQty = additionalQuantity || 0;
      const newQuantity = currentQuantity + additionalQty;
      const newAmountGranted = newQuantity * 10;

      console.log("3. Quantity calculations:", {
        currentQuantity,
        additionalQty,
        newQuantity,
        newAmountGranted,
      });

      // Validate critical values
      if (newQuantity <= 0) {
        throw new Error("Invalid merged quantity: " + newQuantity);
      }
      if (newAmountGranted <= 0) {
        throw new Error("Invalid amount granted: " + newAmountGranted);
      }

      // Calculate new tax (proportional merge)
      let finalTaxAmount = null;
      let finalAutoTax = null;

      if (additionalTaxAmount !== null && additionalTaxAmount > 0) {
        // User provided manual tax for additional quantity
        const existingTax =
          existing.tax_amount || existing.tax_auto_calculated || 0;
        finalTaxAmount = existingTax + additionalTaxAmount;
        finalAutoTax = null; // Clear auto tax since we have manual
        console.log("4. Manual tax calculation:", {
          existingTax,
          additionalTaxAmount,
          finalTaxAmount,
        });
      } else {
        // Calculate auto tax for additional quantity
        const taxRateSetting = await this.getSetting("tax_auto_rate");
        const taxRate = parseFloat(taxRateSetting || "30");
        const additionalAutoTax = additionalQty * 10 * (taxRate / 100);

        if (existing.tax_amount && existing.tax_amount > 0) {
          // Existing has manual tax, add auto tax for new portion
          finalTaxAmount = existing.tax_amount + additionalAutoTax;
          finalAutoTax = null; // Keep as manual tax
          console.log("5. Mixed tax calculation:", {
            existingManualTax: existing.tax_amount,
            additionalAutoTax,
            finalTaxAmount,
          });
        } else {
          // Both auto tax
          const existingAutoTax = existing.tax_auto_calculated || 0;
          finalTaxAmount = null; // Keep as auto tax
          finalAutoTax = existingAutoTax + additionalAutoTax;
          console.log("6. Auto tax calculation:", {
            existingAutoTax,
            additionalAutoTax,
            finalAutoTax,
          });
        }
      }

      console.log("7. Final tax values:", { finalTaxAmount, finalAutoTax });

      // FIXED: Update using sql.js compatible pattern
      const updateStmt = this.db.prepare(`
      UPDATE portfolio_entries 
      SET quantity = ?, 
          amount_granted = ?,
          tax_amount = ?,
          tax_auto_calculated = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      // Prepare the values array with proper NULL handling
      const updateValues = [
        newQuantity, // quantity - never null
        newAmountGranted, // amount_granted - never null
        finalTaxAmount, // tax_amount - can be null
        finalAutoTax || existing.tax_auto_calculated || 0, // tax_auto_calculated - fallback to 0
        existingEntryId, // id - never null
      ];

      console.log("8. Update values:", updateValues);

      // FIXED: Use sql.js bind/step pattern instead of run()
      updateStmt.bind(updateValues);
      const updateResult = updateStmt.step();
      updateStmt.free();

      console.log("9. Update executed:", updateResult);

      // FIXED: Check if update actually happened by querying the row
      const verifyStmt = this.db.prepare(
        "SELECT quantity, amount_granted, tax_amount, tax_auto_calculated FROM portfolio_entries WHERE id = ?"
      );

      let updatedRow = null;
      verifyStmt.bind([existingEntryId]);
      if (verifyStmt.step()) {
        updatedRow = verifyStmt.getAsObject();
      }
      verifyStmt.free();

      console.log("10. Verification - updated row:", updatedRow);

      if (!updatedRow || updatedRow.quantity !== newQuantity) {
        throw new Error(
          "Update verification failed - row not updated correctly"
        );
      }

      this.saveDatabase();

      console.log(
        `✅ Merge completed successfully: ${additionalQty} options added to existing grant (total: ${newQuantity})`
      );
      console.log("=== END MERGE GRANT DEBUG ===");

      return Promise.resolve({
        id: existingEntryId,
        merged: true,
        totalQuantity: newQuantity,
        updatedRow: updatedRow,
      });
    } catch (error) {
      console.error("❌ Error in mergeGrant:", error);
      console.error("❌ Error stack:", error.stack);
      return Promise.reject(error);
    }
  }

  async addPortfolioEntry(
    grantDate,
    exercisePrice,
    quantity,
    taxAmount = null
  ) {
    try {
      console.log("Adding portfolio entry:", {
        grantDate,
        exercisePrice,
        quantity,
        taxAmount,
      });

      // Validate required parameters
      if (!grantDate || !exercisePrice || !quantity) {
        throw new Error(
          "Missing required parameters: grantDate, exercisePrice, or quantity"
        );
      }

      // Get the fund name and current value from price history
      const priceStmt = this.db.prepare(`
      SELECT fund_name, current_value 
      FROM price_history 
      WHERE exercise_price = ? AND grant_date = ?
      ORDER BY price_date DESC 
      LIMIT 1
    `);

      let priceData = null;
      priceStmt.bind([exercisePrice, grantDate]);
      if (priceStmt.step()) {
        priceData = priceStmt.getAsObject();
      }
      priceStmt.free();

      // Fallback: if no exact match, try to find by exercise price only
      let fundName = null;
      let currentValue = 0;

      if (priceData) {
        fundName = priceData.fund_name || null;
        currentValue = priceData.current_value || 0;
      } else {
        console.log(
          "No exact price data found, trying fallback lookup by exercise price only"
        );
        const fallbackStmt = this.db.prepare(`
        SELECT fund_name, current_value 
        FROM price_history 
        WHERE exercise_price = ?
        ORDER BY price_date DESC 
        LIMIT 1
      `);

        let fallbackData = null;
        fallbackStmt.bind([exercisePrice]);
        if (fallbackStmt.step()) {
          fallbackData = fallbackStmt.getAsObject();
        }
        fallbackStmt.free();

        if (fallbackData) {
          fundName = fallbackData.fund_name || null;
          currentValue = fallbackData.current_value || 0;
          console.log("Found fallback price data:", { fundName, currentValue });
        } else {
          console.warn(
            "No price data found for exercise price:",
            exercisePrice
          );
        }
      }

      const amountGranted = quantity * 10; // €10 per option

      // Calculate auto tax - ensure we have a valid tax rate
      let taxRateSetting;
      try {
        taxRateSetting = await this.getSetting("tax_auto_rate");
      } catch (error) {
        console.warn("Could not get tax rate setting, using default:", error);
        taxRateSetting = "30";
      }

      const taxRate = parseFloat(taxRateSetting || "30");
      const autoTax = amountGranted * (taxRate / 100);

      console.log("Calculated values:", {
        fundName,
        currentValue,
        amountGranted,
        taxRate,
        autoTax,
        taxAmount,
      });

      // Insert the portfolio entry with proper null handling
      const stmt = this.db.prepare(`
      INSERT INTO portfolio_entries 
      (grant_date, fund_name, exercise_price, quantity, amount_granted, current_value, tax_amount, tax_auto_calculated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

      stmt.run([
        grantDate || null,
        fundName || null,
        exercisePrice || 0,
        quantity || 0,
        amountGranted || 0,
        currentValue || 0,
        taxAmount || null,
        autoTax || 0,
      ]);

      // FIXED: For sql.js, get the last insert rowid using proper method
      const lastIdStmt = this.db.prepare("SELECT last_insert_rowid() as id");
      let insertId = null;

      lastIdStmt.bind([]);
      if (lastIdStmt.step()) {
        const lastIdResult = lastIdStmt.getAsObject();
        insertId = lastIdResult ? lastIdResult.id : null;
      }

      stmt.free();
      lastIdStmt.free();
      this.saveDatabase();

      console.log("✅ Portfolio entry added with ID:", insertId);

      // FIXED: Create evolution entry for grants
      if (insertId) {
        console.log("📊 About to create evolution entry for grant...");
        await this.createEvolutionEntryForGrant(grantDate, quantity, fundName);
        console.log("📊 Evolution entry creation completed");
      } else {
        console.error(
          "❌ No insert ID returned, cannot create evolution entry"
        );
      }

      return Promise.resolve({ id: insertId });
    } catch (error) {
      console.error("Error adding portfolio entry:", error);
      return Promise.reject(error);
    }
  }

  // FIXED: Create evolution entry specifically for grants
  async createEvolutionEntryForGrant(grantDate, quantity, fundName) {
    try {
      console.log("🔄 Creating evolution entry for grant:", {
        grantDate,
        quantity,
        fundName,
      });

      // FIXED: Use today's date for evolution since we're adding the grant today
      const todayDate = new Date().toISOString().split("T")[0];

      // Get current total portfolio value
      const portfolioOverview = await this.getPortfolioOverview();
      const currentTotalValue = portfolioOverview.reduce(
        (sum, entry) => sum + (entry.current_total_value || 0),
        0
      );

      // Use the fund name that was already looked up in addPortfolioEntry
      const displayFundName = fundName || "Unknown Fund";

      const evolutionNote = `Grant added: ${quantity} options (${displayFundName}) - Grant Date: ${new Date(
        grantDate
      ).toLocaleDateString()}`;

      // FIXED: Check if entry already exists for TODAY'S date (not grant date)
      const existingStmt = this.db.prepare(`
      SELECT notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);

      let existingEntry = null;
      existingStmt.bind([todayDate]);
      if (existingStmt.step()) {
        existingEntry = existingStmt.getAsObject();
      }
      existingStmt.free();

      let finalNotes = evolutionNote;

      if (existingEntry && existingEntry.notes) {
        // Entry exists - append new note with bullet point
        const existingNotes = existingEntry.notes;
        // Only append if the new note is different
        if (!existingNotes.includes(evolutionNote)) {
          finalNotes = `${existingNotes}\n• ${evolutionNote}`;
        } else {
          finalNotes = existingNotes; // Don't duplicate
        }
      } else {
        // New entry - add bullet point for consistency
        finalNotes = `• ${evolutionNote}`;
      }

      console.log(
        `📝 Grant evolution note for TODAY (${todayDate}): ${finalNotes}`
      );

      // FIXED: Use TODAY'S date for evolution entry, not grant date
      const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO portfolio_evolution 
      (snapshot_date, total_portfolio_value, total_unrealized_gain, total_realized_gain, total_options_count, active_options_count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

      stmt.run([
        todayDate, // Use today's date, not grant date
        currentTotalValue || 0,
        0, // unrealized gain
        0, // realized gain
        quantity || 0,
        quantity || 0,
        finalNotes,
      ]);

      stmt.free();
      this.saveDatabase();

      console.log(
        `✅ Created/updated evolution entry for TODAY: ${finalNotes}`
      );
    } catch (error) {
      console.error("❌ Error creating evolution entry for grant:", error);
    }
  }

  // Record a sale transaction - FIXED with simplified tax update
  async recordSaleTransaction(
    portfolioEntryId,
    saleDate,
    quantitySold,
    salePrice,
    notes = null
  ) {
    try {
      // Get the portfolio entry to calculate proportional tax
      const entryStmt = this.db.prepare(
        "SELECT * FROM portfolio_entries WHERE id = ?"
      );
      entryStmt.bind([portfolioEntryId]);

      let entry = null;
      if (entryStmt.step()) {
        entry = entryStmt.getAsObject();
      }
      entryStmt.free();

      console.log("Raw entry from database:", entry);

      if (!entry) {
        return Promise.reject(new Error("Portfolio entry not found"));
      }

      // Handle undefined/null values with defaults
      const quantity = entry.quantity || 0;
      const totalSoldQuantity = entry.total_sold_quantity || 0;
      const taxAmount = entry.tax_amount || 0;
      const taxAutoCalculated = entry.tax_auto_calculated || 0;

      console.log("Processed entry values:", {
        id: entry.id,
        quantity,
        totalSoldQuantity,
        taxAmount,
        taxAutoCalculated,
      });

      const remainingQuantity = quantity - totalSoldQuantity;

      if (quantitySold > remainingQuantity) {
        return Promise.reject(
          new Error(
            `Cannot sell more options than available. Available: ${remainingQuantity}, Trying to sell: ${quantitySold}`
          )
        );
      }

      // FIXED TAX CALCULATION:
      // Tax should be reduced proportionally from the REMAINING quantity
      const totalTax = taxAmount || taxAutoCalculated || 0;

      // Calculate current tax per option based on REMAINING quantity
      const currentTaxPerOption =
        remainingQuantity > 0 ? totalTax / remainingQuantity : 0;

      // Tax allocated to sold options = tax per option × quantity sold
      const taxAllocatedToSold = currentTaxPerOption * quantitySold;

      // New total tax = old tax - tax allocated to sold options
      const newTaxAmount = Math.max(0, totalTax - taxAllocatedToSold);

      console.log("FIXED Tax calculation:", {
        originalQuantity: quantity,
        totalSoldBefore: totalSoldQuantity,
        remainingQuantityBefore: remainingQuantity,
        quantitySold,
        remainingQuantityAfter: remainingQuantity - quantitySold,
        totalTaxBefore: totalTax,
        currentTaxPerOption,
        taxAllocatedToSold,
        newTaxAmount,
      });

      // Calculate sale values (no tax deduction from proceeds - tax was already paid)
      const totalSaleValue = quantitySold * salePrice;
      const costBasis = quantitySold * 10; // €10 per option cost basis
      const realizedGainLoss = totalSaleValue - costBasis;

      // Insert sale transaction (tax_deducted is just for record keeping)
      const saleStmt = this.db.prepare(`
      INSERT INTO sales_transactions 
      (portfolio_entry_id, sale_date, quantity_sold, sale_price, total_sale_value, tax_deducted, realized_gain_loss, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const saleResult = saleStmt.run([
        portfolioEntryId,
        saleDate,
        quantitySold || 0,
        salePrice || 0,
        totalSaleValue || 0,
        taxAllocatedToSold || 0, // Just for record keeping
        realizedGainLoss || 0,
        notes || null,
      ]);
      saleStmt.free();

      // SIMPLIFIED: Update portfolio entry with correct tax reduction
      console.log("Tax update debug:", {
        entryTaxAmount: taxAmount,
        entryTaxAuto: taxAutoCalculated,
        newTaxAmount: newTaxAmount,
        hasManualTax: taxAmount > 0,
      });

      if (taxAmount > 0) {
        // Manual tax exists - update it
        console.log("Updating manual tax from", taxAmount, "to", newTaxAmount);
        const updateStmt = this.db.prepare(`
        UPDATE portfolio_entries 
        SET total_sold_quantity = total_sold_quantity + ?, 
            tax_amount = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

        updateStmt.run([quantitySold, newTaxAmount, portfolioEntryId]);
        updateStmt.free();
      } else {
        // Auto tax - update the auto calculated field
        console.log(
          "Updating auto tax from",
          taxAutoCalculated,
          "to",
          newTaxAmount
        );
        const updateStmt = this.db.prepare(`
        UPDATE portfolio_entries 
        SET total_sold_quantity = total_sold_quantity + ?, 
            tax_auto_calculated = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

        updateStmt.run([quantitySold, newTaxAmount, portfolioEntryId]);
        updateStmt.free();
      }

      this.saveDatabase();

      // FIXED: Create evolution snapshot for sales - use UPSERT to avoid duplicates
      await this.createPortfolioSnapshot(
        saleDate,
        "sale",
        `Sale: ${quantitySold} options at €${salePrice}`
      );

      console.log(
        `✅ FIXED: Sale recorded. Tax reduced from €${totalTax.toFixed(
          2
        )} to €${newTaxAmount.toFixed(
          2
        )} (reduced by €${taxAllocatedToSold.toFixed(2)})`
      );

      return Promise.resolve({
        id: saleResult.insertId,
        taxAllocatedToSold: taxAllocatedToSold || 0,
        realizedGainLoss: realizedGainLoss || 0,
        totalSaleValue: totalSaleValue || 0,
        remainingTax: newTaxAmount || 0,
      });
    } catch (error) {
      console.error("Error in recordSaleTransaction:", error);
      return Promise.reject(error);
    }
  }

  // Get enhanced portfolio overview with selling restrictions
  async getPortfolioOverview() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          pe.id,
          pe.grant_date,
          pe.fund_name,
          pe.exercise_price,
          pe.quantity,
          pe.amount_granted,
          pe.current_value,
          pe.total_sold_quantity,
          (pe.quantity - pe.total_sold_quantity) as quantity_remaining,
          pe.tax_amount,
          pe.tax_auto_calculated,
          ph.current_value as latest_current_value,
          ph.price_date as last_price_update,
          ph.fund_name as latest_fund_name,
          
          -- Basic calculations - use latest price if available, otherwise stored value
          ((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) as current_total_value,
          
          -- FIXED: P&L = (Current Value - Tax) - (Amount Granted × Target %)
          CASE 
            WHEN COALESCE(ph.current_value, pe.current_value, 0) > 0 THEN
              -- (Current total value minus tax) minus (target value)
              (((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) - 
               (COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0) * (pe.quantity - pe.total_sold_quantity) / pe.quantity)) -
              ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
            ELSE 
              (0 - (COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0) * (pe.quantity - pe.total_sold_quantity) / pe.quantity)) -
              ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
          END as profit_loss_vs_target,
          
          -- Target value for reference
          ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100) as target_total_value,
          
          -- FIXED: Return % = (Current Value - Tax) / Amount Granted × 100
          CASE 
            WHEN COALESCE(ph.current_value, pe.current_value, 0) > 0 AND (pe.quantity - pe.total_sold_quantity) > 0 THEN
              -- (Current total value minus tax) / amount granted × 100
              ((((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) - 
                (COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0) * (pe.quantity - pe.total_sold_quantity) / pe.quantity)) /
               ((pe.quantity - pe.total_sold_quantity) * 10)) * 100
            ELSE 
              CASE 
                WHEN (pe.quantity - pe.total_sold_quantity) > 0 THEN
                  -- (0 minus tax) / amount granted × 100
                  (((0 - (COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0) * (pe.quantity - pe.total_sold_quantity) / pe.quantity)) /
                    ((pe.quantity - pe.total_sold_quantity) * 10)) * 100)
                ELSE 0
              END
          END as current_return_percentage,
          
          -- Selling restrictions (unchanged)
          CASE 
            WHEN date(pe.grant_date, '+1 year') > date('now') THEN 'WAITING_PERIOD'
            WHEN date(pe.grant_date, '+10 years') < date('now') THEN 'EXPIRED'
            WHEN date(pe.grant_date, '+9 years') < date('now') THEN 'EXPIRING_SOON'
            ELSE 'SELLABLE'
          END as selling_status,
          date(pe.grant_date, '+1 year') as can_sell_after,
          date(pe.grant_date, '+10 years') as expires_on
          
        FROM portfolio_entries pe
        LEFT JOIN (
          SELECT 
            exercise_price,
            current_value,
            price_date,
            fund_name,
            ROW_NUMBER() OVER (PARTITION BY exercise_price ORDER BY price_date DESC) as rn
          FROM price_history
        ) ph ON pe.exercise_price = ph.exercise_price AND ph.rn = 1
        WHERE (pe.quantity - pe.total_sold_quantity) > 0
        ORDER BY pe.grant_date DESC
      `);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        // Use latest values from price_history if available
        row.current_value = row.latest_current_value || row.current_value || 0;
        row.fund_name = row.latest_fund_name || row.fund_name || "Unknown Fund";
        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Get sales history
  async getSalesHistory() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          st.*,
          pe.grant_date,
          pe.exercise_price,
          pe.quantity as original_quantity,
          pe.fund_name
        FROM sales_transactions st
        JOIN portfolio_entries pe ON st.portfolio_entry_id = pe.id
        ORDER BY st.sale_date DESC
      `);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Get grant history (all portfolio entries including fully sold ones)
  async getGrantHistory() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          pe.*,
          (pe.quantity - pe.total_sold_quantity) as quantity_remaining,
          CASE 
            WHEN pe.total_sold_quantity = 0 THEN 'ACTIVE'
            WHEN pe.total_sold_quantity = pe.quantity THEN 'FULLY_SOLD'
            ELSE 'PARTIALLY_SOLD'
          END as status,
          COALESCE(ph.current_value, pe.current_value, 0) as current_value,
          COALESCE(ph.fund_name, pe.fund_name, 'Unknown Fund') as fund_name
        FROM portfolio_entries pe
        LEFT JOIN (
          SELECT 
            exercise_price,
            current_value,
            fund_name,
            ROW_NUMBER() OVER (PARTITION BY exercise_price ORDER BY price_date DESC) as rn
          FROM price_history
          WHERE fund_name IS NOT NULL AND fund_name != ''
        ) ph ON pe.exercise_price = ph.exercise_price AND ph.rn = 1
        ORDER BY pe.grant_date DESC
      `);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();

      console.log("Grant history query results:", rows); // Debug log
      return Promise.resolve(rows);
    } catch (error) {
      console.error("Grant history query error:", error);
      return Promise.reject(error);
    }
  }

  // Get portfolio evolution with change from previous
  async getPortfolioEvolution(days = null) {
    try {
      let query = `
      SELECT 
        snapshot_date,
        total_portfolio_value,
        total_unrealized_gain,
        total_realized_gain,
        total_options_count,
        active_options_count,
        notes,
        LAG(total_portfolio_value) OVER (ORDER BY snapshot_date) as previous_value,
        LAG(snapshot_date) OVER (ORDER BY snapshot_date) as previous_date
      FROM portfolio_evolution
    `;

      // FIXED: Removed the filter that excluded grant notes
      // Old line was: WHERE notes NOT LIKE '%Grant added%'

      if (days) {
        query += ` WHERE snapshot_date >= date('now', '-${days} days')`;
      }

      query += ` ORDER BY snapshot_date DESC`;

      const stmt = this.db.prepare(query);
      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();

        // Calculate change from previous and days between
        if (row.previous_value !== null) {
          row.change_from_previous =
            row.total_portfolio_value - row.previous_value;
          row.change_percent =
            (row.change_from_previous / row.previous_value) * 100;

          // Calculate days between updates
          const currentDate = new Date(row.snapshot_date);
          const previousDate = new Date(row.previous_date);
          row.days_between = Math.round(
            (currentDate - previousDate) / (1000 * 60 * 60 * 24)
          );
        } else {
          row.change_from_previous = 0;
          row.change_percent = 0;
          row.days_between = 0;
        }

        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Get option price history for charts with events
  async getOptionPriceHistory(exercisePrice, grantDate) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          price_date,
          current_value,
          high_value,
          low_value
        FROM option_price_history
        WHERE exercise_price = ? AND grant_date = ?
        ORDER BY price_date ASC
      `);

      const rows = [];
      stmt.bind([exercisePrice, grantDate]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // FIXED: Get portfolio events for chart annotations
  async getPortfolioEvents() {
    try {
      const events = [];

      // Get grant events
      const grantStmt = this.db.prepare(`
        SELECT 
          grant_date as event_date,
          'grant' as event_type,
          quantity,
          fund_name,
          exercise_price
        FROM portfolio_entries
        ORDER BY grant_date ASC
      `);

      while (grantStmt.step()) {
        const row = grantStmt.getAsObject();
        events.push({
          date: row.event_date,
          type: "grant",
          label: `Grant: ${row.quantity} options`,
          description: `Added ${row.quantity} options (${
            row.fund_name || "Unknown Fund"
          }) at €${row.exercise_price}`,
          color: "#28a745",
        });
      }
      grantStmt.free();

      // Get sale events
      const saleStmt = this.db.prepare(`
        SELECT 
          st.sale_date as event_date,
          'sale' as event_type,
          st.quantity_sold,
          st.sale_price,
          pe.fund_name,
          pe.exercise_price
        FROM sales_transactions st
        JOIN portfolio_entries pe ON st.portfolio_entry_id = pe.id
        ORDER BY st.sale_date ASC
      `);

      while (saleStmt.step()) {
        const row = saleStmt.getAsObject();
        events.push({
          date: row.event_date,
          type: "sale",
          label: `Sale: ${row.quantity_sold} options`,
          description: `Sold ${row.quantity_sold} options (${
            row.fund_name || "Unknown Fund"
          }) at €${row.sale_price}`,
          color: "#dc3545",
        });
      }
      saleStmt.free();

      // Sort events by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      return Promise.resolve(events);
    } catch (error) {
      console.error("Error getting portfolio events:", error);
      return Promise.reject(error);
    }
  }

  // Enhanced price update with option history tracking
  async updatePricesFromCSV(csvData, priceDate) {
    try {
      const today = priceDate || new Date().toISOString().split("T")[0];
      let updatedCount = 0;

      csvData.forEach((row) => {
        if (row.exercise_price && row.current_value) {
          // Update main price history
          const priceStmt = this.db.prepare(`
            INSERT OR REPLACE INTO price_history (price_date, exercise_price, current_value, grant_date, fund_name)
            VALUES (?, ?, ?, ?, ?)
          `);
          priceStmt.run([
            today,
            row.exercise_price,
            row.current_value,
            row.grant_date,
            row.fund_name,
          ]);
          priceStmt.free();

          // Update detailed option price history
          const optionStmt = this.db.prepare(`
            INSERT OR REPLACE INTO option_price_history 
            (exercise_price, grant_date, price_date, current_value, high_value, low_value, fund_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          optionStmt.run([
            row.exercise_price,
            row.grant_date,
            today,
            row.current_value,
            row.current_value, // For now, high = current
            row.current_value, // For now, low = current
            row.fund_name,
          ]);
          optionStmt.free();

          updatedCount++;
        }
      });

      this.saveDatabase();

      // ✅ CREATE evolution snapshot for price updates (this affects portfolio value)
      await this.createPortfolioSnapshot(today, "price_update", "Price update");

      return Promise.resolve({ updatedCount });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // FIXED: Enhanced portfolio snapshot creation with duplicate handling
  async createPortfolioSnapshot(date = null, type = "update", note = null) {
    try {
      const snapshotDate = date || new Date().toISOString().split("T")[0];

      // Skip grant snapshots - handled separately by createEvolutionEntryForGrant
      if (type === "grant") {
        return;
      }

      // Get current portfolio overview
      const portfolioOverview = await this.getPortfolioOverview();
      const currentTotalValue = portfolioOverview.reduce(
        (sum, entry) => sum + (entry.current_total_value || 0),
        0
      );

      // FIXED: Check if entry already exists for this date
      const existingStmt = this.db.prepare(`
      SELECT notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);

      let existingEntry = null;
      existingStmt.bind([snapshotDate]);
      if (existingStmt.step()) {
        existingEntry = existingStmt.getAsObject();
      }
      existingStmt.free();

      let finalNotes = note || `Portfolio ${type}`;

      if (existingEntry && existingEntry.notes) {
        // Entry exists - append new note with bullet point
        const existingNotes = existingEntry.notes;
        // Only append if the new note is different from existing
        if (!existingNotes.includes(finalNotes)) {
          finalNotes = `${existingNotes}\n• ${finalNotes}`;
        } else {
          finalNotes = existingNotes; // Don't duplicate identical notes
        }
      } else {
        // New entry - add bullet point for consistency
        finalNotes = `• ${finalNotes}`;
      }

      console.log(`📝 Evolution note for ${snapshotDate}: ${finalNotes}`);

      // FIXED: Use INSERT OR REPLACE but preserve and concatenate notes
      const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO portfolio_evolution 
      (snapshot_date, total_portfolio_value, total_unrealized_gain, total_realized_gain, total_options_count, active_options_count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

      stmt.run([
        snapshotDate,
        currentTotalValue || 0,
        0, // unrealized gain - calculate later if needed
        0, // realized gain - calculate later if needed
        0, // total options count - calculate later if needed
        0, // active options count - calculate later if needed
        finalNotes,
      ]);

      stmt.free();
      this.saveDatabase();

      console.log(
        `✅ Created/updated portfolio evolution snapshot for ${snapshotDate}: ${finalNotes}`
      );
    } catch (error) {
      console.error("Error creating portfolio snapshot:", error);
      // Don't throw - this is not critical
    }
  }

  // Database export functionality
  async exportDatabase() {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          schemaVersion: 2,
          appVersion: "0.1",
        },
        portfolioEntries: await this.getAllTableData("portfolio_entries"),
        priceHistory: await this.getAllTableData("price_history"),
        salesTransactions: await this.getAllTableData("sales_transactions"),
        portfolioEvolution: await this.getAllTableData("portfolio_evolution"),
        optionPriceHistory: await this.getAllTableData("option_price_history"),
        settings: await this.getAllTableData("settings"),
      };

      return Promise.resolve(exportData);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Database import functionality (with validation)
  async importDatabase(importData, mergeMode = false) {
    try {
      // Validate import data structure
      if (!importData.metadata || !importData.portfolioEntries) {
        throw new Error("Invalid import data format");
      }

      // Create backup before import
      const backup = await this.exportDatabase();

      if (!mergeMode) {
        // Clear existing data
        const tables = [
          "sales_transactions",
          "portfolio_evolution",
          "option_price_history",
          "portfolio_entries",
          "price_history",
        ];
        tables.forEach((table) => {
          const stmt = this.db.prepare(`DELETE FROM ${table}`);
          stmt.run();
          stmt.free();
        });
      }

      // Import each table's data
      await this.importTableData(
        "portfolio_entries",
        importData.portfolioEntries
      );
      await this.importTableData("price_history", importData.priceHistory);
      await this.importTableData(
        "sales_transactions",
        importData.salesTransactions
      );
      await this.importTableData(
        "portfolio_evolution",
        importData.portfolioEvolution
      );
      await this.importTableData(
        "option_price_history",
        importData.optionPriceHistory
      );

      // Import settings (selective merge)
      if (importData.settings) {
        importData.settings.forEach((setting) => {
          if (setting.setting_key !== "last_backup_date") {
            // Don't overwrite backup date
            const stmt = this.db.prepare(`
              INSERT OR REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)
            `);
            stmt.run([setting.setting_key, setting.setting_value]);
            stmt.free();
          }
        });
      }

      this.saveDatabase();
      return Promise.resolve({
        success: true,
        importedEntries: importData.portfolioEntries.length,
        backup: backup,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Helper method to get all data from a table
  async getAllTableData(tableName) {
    const stmt = this.db.prepare(`SELECT * FROM ${tableName}`);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // Helper method to import data into a table
  async importTableData(tableName, data) {
    if (!data || data.length === 0) return;

    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);
    const placeholders = columns.map(() => "?").join(",");

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${tableName} (${columns.join(
      ","
    )}) VALUES (${placeholders})
    `);

    data.forEach((row) => {
      const values = columns.map((col) => row[col]);
      stmt.run(values);
    });
    stmt.free();
  }

  // Existing methods (unchanged for backward compatibility)
  async updateTaxAmount(entryId, taxAmount) {
    try {
      console.log("=== UPDATE TAX AMOUNT (sql.js) ===");
      console.log("Params:", { entryId, taxAmount });

      // FIXED: Use sql.js pattern
      const stmt = this.db.prepare(`
      UPDATE portfolio_entries 
      SET tax_amount = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

      stmt.bind([taxAmount, entryId]);
      const result = stmt.step();
      stmt.free();

      console.log("Update result:", result);

      this.saveDatabase();
      return Promise.resolve({ changes: 1 });
    } catch (error) {
      console.error("Error updating tax amount:", error);
      return Promise.reject(error);
    }
  }

  async deletePortfolioEntry(entryId) {
    try {
      console.log("=== DELETE PORTFOLIO ENTRY (sql.js) ===");

      // Get entry details before deleting
      const entryStmt = this.db.prepare(
        "SELECT * FROM portfolio_entries WHERE id = ?"
      );

      let entryToDelete = null;
      entryStmt.bind([entryId]);
      if (entryStmt.step()) {
        entryToDelete = entryStmt.getAsObject();
      }
      entryStmt.free();

      if (!entryToDelete) {
        return Promise.reject(new Error("Portfolio entry not found"));
      }

      console.log("Deleting entry:", entryToDelete);

      // FIXED: Delete sales transactions using sql.js pattern
      const deleteSalesStmt = this.db.prepare(
        "DELETE FROM sales_transactions WHERE portfolio_entry_id = ?"
      );
      deleteSalesStmt.bind([entryId]);
      deleteSalesStmt.step();
      deleteSalesStmt.free();

      // FIXED: Delete portfolio entry using sql.js pattern
      const deleteStmt = this.db.prepare(
        "DELETE FROM portfolio_entries WHERE id = ?"
      );
      deleteStmt.bind([entryId]);
      const deleteResult = deleteStmt.step();
      deleteStmt.free();

      console.log("Delete result:", deleteResult);

      this.saveDatabase();

      // Create evolution entry for deletion
      const todayDate = new Date().toISOString().split("T")[0];
      const remainingQuantity =
        entryToDelete.quantity - (entryToDelete.total_sold_quantity || 0);
      const fundName = entryToDelete.fund_name || "Unknown Fund";

      await this.createPortfolioSnapshot(
        todayDate,
        "delete",
        `Grant deleted: ${remainingQuantity} options (${fundName}) - Original Grant Date: ${new Date(
          entryToDelete.grant_date
        ).toLocaleDateString()}`
      );

      console.log("✅ Portfolio entry deleted successfully");
      return Promise.resolve({
        success: true,
        deletedEntry: entryToDelete,
      });
    } catch (error) {
      console.error("Error deleting portfolio entry:", error);
      return Promise.reject(error);
    }
  }

  async getOptionsByGrantDate(grantDate) {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT 
          exercise_price, 
          current_value, 
          fund_name,
          price_date as last_update_date
        FROM price_history
        WHERE grant_date = ? 
        AND price_date = (
          SELECT MAX(price_date) FROM price_history ph2 
          WHERE ph2.exercise_price = price_history.exercise_price
        )
        ORDER BY exercise_price ASC
      `);

      const rows = [];
      stmt.bind([grantDate]);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getAvailableExercisePrices() {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT 
          exercise_price, 
          current_value, 
          grant_date,
          fund_name,
          price_date as last_update_date
        FROM price_history
        WHERE price_date = (
          SELECT MAX(price_date) FROM price_history ph2 
          WHERE ph2.exercise_price = price_history.exercise_price
        )
        ORDER BY grant_date DESC, exercise_price ASC
      `);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        rows.push(row);
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getSetting(key) {
    try {
      const stmt = this.db.prepare(
        "SELECT setting_value FROM settings WHERE setting_key = ?"
      );
      stmt.bind([key]);

      let result = null;
      if (stmt.step()) {
        const row = stmt.getAsObject();
        result = row.setting_value;
      }
      stmt.free();

      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async getLatestPriceDate() {
    try {
      const stmt = this.db.prepare(`
      SELECT MAX(price_date) as latest_price_date 
      FROM price_history 
      WHERE price_date IS NOT NULL
    `);

      let result = null;
      if (stmt.step()) {
        const row = stmt.getAsObject();
        result = row.latest_price_date;
      }
      stmt.free();

      console.log("Latest price date from database:", result);
      return Promise.resolve(result);
    } catch (error) {
      console.error("Error getting latest price date:", error);
      return Promise.reject(error);
    }
  }

  async updateSetting(key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([key, value]);
      stmt.free();

      this.saveDatabase();
      return Promise.resolve({ changes: 1 });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      console.log("Database connection closed");
    }
  }
}

module.exports = PortfolioDatabase;
