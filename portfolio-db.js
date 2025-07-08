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
    } catch (_electronError) {      // Fallback to user directories
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
      } catch (_homeError) {        // Final fallback: temp directory
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
    } catch (_error) {      console.log(
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
    } catch (_error) {      console.error(`❌ Database directory error: ${error.message}`);

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
    } catch (_error) {      console.error("❌ Database initialization failed:", error);
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
    } catch (_error) {      console.error(`❌ Database operation test failed: ${error.message}`);
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
    } catch (_error) {      console.error(`❌ Failed to save database: ${error.message}`);

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
  setting_key VARCHAR(50) PRIMARY KEY,
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
        // ✅ ADD DEBUG BEFORE INSERT

        const stmt = this.db.prepare(
          "INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)"
        );
        const result = stmt.run([key, value]);

        // ✅ ADD DEBUG AFTER INSERT

        if (result.changes > 0) {
          console.log(
            `🚨 WARNING: OVERWROTE existing setting ${key} with default ${value}!`
          );
        } else {
          console.log(`✅ GOOD: Skipped ${key} because it already exists`);
        }

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
    } catch (_error) {      console.error(`❌ Schema creation failed: ${error.message}`);
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
    } catch (_error) {      console.error("❌ Error migrating sales_transactions table:", error);
      throw error;
    }
  }
  /**
   * Get sale details with original portfolio entry data for validation
   * @param {number} saleId - Sale ID
   * @returns {Object} Sale data with portfolio entry validation info
   */
  async getSaleWithPortfolioData(saleId) {
    try {
      const stmt = this.db.prepare(`
      SELECT 
        st.*,
        pe.grant_date,
        pe.exercise_price,
        pe.fund_name,
        -- Calculate sellable period
        date(pe.grant_date, '+1 year') as can_sell_after,
        date(pe.grant_date, '+10 years') as expires_on,
        -- Current selling status
        CASE 
          WHEN date(pe.grant_date, '+1 year') > date('now') THEN 'WAITING_PERIOD'
          WHEN date(pe.grant_date, '+10 years') < date('now') THEN 'EXPIRED'
          WHEN date(pe.grant_date, '+9 years') < date('now') THEN 'EXPIRING_SOON'
          ELSE 'SELLABLE'
        END as selling_status
      FROM sales_transactions st
      JOIN portfolio_entries pe ON st.portfolio_entry_id = pe.id
      WHERE st.id = ?
    `);

      stmt.bind([saleId]);

      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();

      if (!result) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }

      console.log("✅ Sale with portfolio data retrieved:", {
        saleId: result.id,
        saleDate: result.sale_date,
        grantDate: result.grant_date,
        canSellAfter: result.can_sell_after,
        expiresOn: result.expires_on,
        sellingStatus: result.selling_status,
      });

      return result;
    } catch (_error) {      console.error("❌ Error getting sale with portfolio data:", error);
      throw error;
    }
  }
  async getClosestPriceForDate(targetDate, exercisePrice, grantDate) {
    try {
      console.log(`📊 DEBUG: Looking for price data:`);
      console.log(`   Target date: ${targetDate}`);
      console.log(`   Exercise price: €${exercisePrice}`);
      console.log(`   Grant date: ${grantDate}`);

      // First, check what price data we have for this option
      const debugStmt = this.db.prepare(`
      SELECT price_date, current_value, exercise_price, grant_date
      FROM price_history 
      WHERE exercise_price = ? AND grant_date = ?
      ORDER BY price_date DESC
      LIMIT 10
    `);

      console.log(
        `🔍 DEBUG: Available price history for €${exercisePrice} (${grantDate}):`
      );
      debugStmt.bind([exercisePrice, grantDate]);
      let count = 0;
      while (debugStmt.step()) {
        const row = debugStmt.getAsObject();
        console.log(`   ${row.price_date}: €${row.current_value}`);
        count++;
      }
      debugStmt.free();

      if (count === 0) {
        console.log(
          `   ❌ NO PRICE HISTORY FOUND for €${exercisePrice} (${grantDate})`
        );

        // Check if we have ANY price data at all
        const allDataStmt = this.db.prepare(`
        SELECT DISTINCT exercise_price, grant_date, COUNT(*) as price_count
        FROM price_history 
        GROUP BY exercise_price, grant_date
        ORDER BY exercise_price, grant_date
      `);

        console.log(`🔍 DEBUG: All available price data in database:`);
        let totalCount = 0;
        while (allDataStmt.step()) {
          const row = allDataStmt.getAsObject();
          console.log(
            `   €${row.exercise_price} (${row.grant_date}): ${row.price_count} price points`
          );
          totalCount++;
        }
        allDataStmt.free();

        if (totalCount === 0) {
          console.log(
            `   ❌ NO PRICE HISTORY DATA AT ALL - run price update first!`
          );
        }

        return null;
      }

      console.log(
        `✅ Found ${count} price history records, looking for closest to ${targetDate}...`
      );

      // First, try to get exact price for this date
      const exactStmt = this.db.prepare(`
      SELECT current_value, price_date, 'exact' as match_type
      FROM price_history 
      WHERE price_date = ? AND exercise_price = ? AND grant_date = ?
      LIMIT 1
    `);

      exactStmt.bind([targetDate, exercisePrice, grantDate]);
      if (exactStmt.step()) {
        const result = exactStmt.getAsObject();
        exactStmt.free();
        console.log(
          `📍 Found exact price for ${targetDate}: €${result.current_value}`
        );
        return result;
      }
      exactStmt.free();

      // No exact match - find closest price (before or after)
      const closestStmt = this.db.prepare(`
      SELECT 
        current_value,
        price_date,
        ABS(julianday(?) - julianday(price_date)) as day_difference,
        CASE 
          WHEN price_date <= ? THEN 'before'
          ELSE 'after'
        END as match_type
      FROM price_history 
      WHERE exercise_price = ? AND grant_date = ?
      ORDER BY day_difference ASC
      LIMIT 1
    `);

      closestStmt.bind([targetDate, targetDate, exercisePrice, grantDate]);
      if (closestStmt.step()) {
        const result = closestStmt.getAsObject();
        closestStmt.free();

        console.log(
          `📍 Found ${result.match_type} price for ${targetDate}: €${result.current_value} (${result.day_difference.toFixed(1)} days ${result.match_type})`
        );
        return result;
      }
      closestStmt.free();

      // Still no match
      console.warn(
        `⚠️ No price history found for €${exercisePrice} (${grantDate})`
      );
      return null;
    } catch (_error) {      console.error(`❌ Error getting closest price for ${targetDate}:`, error);
      return null;
    }
  }
  /**
   * Get price for specific date - wrapper for existing method
   * @param {string} targetDate - Date to find price for (YYYY-MM-DD)
   * @param {number} exercisePrice - Exercise price of the option
   * @param {string} grantDate - Grant date of the option
   * @returns {Object} Price data with metadata
   */
  async getPriceForDate(targetDate, exercisePrice, grantDate) {
    console.log(
      `📈 Getting price for ${targetDate}, exercise: €${exercisePrice}, grant: ${grantDate}`
    );

    // Use the existing getClosestPriceForDate method
    const result = await this.getClosestPriceForDate(
      targetDate,
      exercisePrice,
      grantDate
    );

    if (result) {
      console.log(
        `✅ Found price: €${result.current_value} (${result.match_type})`
      );
    } else {
      console.log(`⚠️ No price data found for ${targetDate}`);
    }

    return result;
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
      pe.fund_name,
      
      -- ADDED: Calculate current profit_loss_vs_target
      ((st.total_sale_value - st.tax_deducted) - (st.quantity_sold * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)) as profit_loss_vs_target
      
    FROM sales_transactions st
    JOIN portfolio_entries pe ON st.portfolio_entry_id = pe.id
    WHERE st.id = ?
    `);

      stmt.bind([saleId]);

      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();

      if (!result) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }

      console.log(
        "✅ Sale details retrieved with profit_loss_vs_target:",
        result
      );
      return result;
    } catch (_error) {      console.error("❌ Error getting sale details:", error);
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

      // First get the current sale data
      const currentSale = await this.getSaleDetails(updatedSale.id);
      console.log("📦 Current sale data:", currentSale);

      // Check if the sale date is changing
      const oldSaleDate = currentSale.sale_date;
      const newSaleDate = updatedSale.sale_date;
      const isDateChanging = oldSaleDate !== newSaleDate;

      console.log("📅 Date change analysis:", {
        oldSaleDate,
        newSaleDate,
        isDateChanging,
      });

      // Calculate new values based on updated price
      const newTotalSaleValue =
        updatedSale.sale_price * currentSale.quantity_sold;

      // Calculate new profit/loss vs target (using stored tax_deducted)
      const taxDeducted = currentSale.tax_deducted || 0;
      const targetPercentageQuery = await this.getSetting("target_percentage");
      const targetPercentage = parseFloat(targetPercentageQuery || "65");
      const targetValue =
        currentSale.quantity_sold * 10 * (targetPercentage / 100);
      const newProfitLossVsTarget =
        newTotalSaleValue - taxDeducted - targetValue;

      // Update the sale record
      const stmt = this.db.prepare(`
      UPDATE sales_transactions 
      SET 
        sale_date = ?,
        sale_price = ?,
        total_sale_value = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      stmt.run([
        updatedSale.sale_date,
        updatedSale.sale_price,
        newTotalSaleValue,
        updatedSale.notes || null,
        updatedSale.id,
      ]);
      stmt.free();

      // ===== HANDLE EVOLUTION ENTRIES AND TIMELINE RECALCULATION =====
      if (isDateChanging) {
        console.log("📅 Sale date changed, updating evolution timeline...");

        // Create the sale note text
        const saleNote = `Sale: ${currentSale.quantity_sold} options at €${updatedSale.sale_price}`;

        // 1. Remove the sale note from the OLD date
        await this.removeSaleNoteFromEvolution(
          oldSaleDate,
          currentSale.quantity_sold,
          currentSale.sale_price
        );

        // 2. Add the sale note to the NEW date
        await this.addSaleNoteToEvolution(newSaleDate, saleNote);

        // 3. *** NEW: Recalculate evolution timeline from the earliest affected date ***
        const earliestDate =
          oldSaleDate < newSaleDate ? oldSaleDate : newSaleDate;
        await this.recalculateEvolutionFromDate(earliestDate);

        console.log(
          `✅ Evolution timeline recalculated from ${earliestDate} forward`
        );
      } else if (updatedSale.sale_price !== currentSale.sale_price) {
        // Price changed but not date - update the note and recalculate from this date
        console.log("💰 Sale price changed, updating evolution...");

        const oldSaleNote = `Sale: ${currentSale.quantity_sold} options at €${currentSale.sale_price}`;
        const newSaleNote = `Sale: ${currentSale.quantity_sold} options at €${updatedSale.sale_price}`;

        await this.updateSaleNoteInEvolution(
          newSaleDate,
          oldSaleNote,
          newSaleNote
        );

        // Recalculate from this date forward (price change affects realized gains)
        await this.recalculateEvolutionFromDate(newSaleDate);
      }

      this.saveDatabase();

      return {
        success: true,
        id: updatedSale.id,
        newTotalSaleValue,
        newProfitLossVsTarget,
        oldProfitLoss: currentSale.profit_loss_vs_target,
        dateChanged: isDateChanging,
        oldDate: oldSaleDate,
        newDate: newSaleDate,
        timelineRecalculated: true,
      };
    } catch (_error) {      console.error("❌ Error updating sale:", error);
      throw error;
    }
  }

  // ===== NEW HELPER METHODS FOR EVOLUTION MANAGEMENT =====

  /**
   * Remove a sale note from an evolution entry
   */
  async removeSaleNoteFromEvolution(date, quantity, price) {
    try {
      const saleNote = `Sale: ${quantity} options at €${price}`;

      // Get current evolution entry for this date
      const stmt = this.db.prepare(`
      SELECT notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);

      stmt.bind([date]);
      let evolutionEntry = null;
      if (stmt.step()) {
        evolutionEntry = stmt.getAsObject();
      }
      stmt.free();

      if (!evolutionEntry || !evolutionEntry.notes) {
        console.log(`No evolution entry found for ${date}`);
        return;
      }

      // Remove the specific sale note
      const notes = evolutionEntry.notes;

      // Remove lines containing the sale note
      const lines = notes
        .split("\n")
        .filter(
          (line) => !line.includes(`Sale: ${quantity} options at €${price}`)
        );

      const updatedNotes = lines.join("\n").trim();

      if (updatedNotes === "" || updatedNotes === "•") {
        // If no notes left, delete the evolution entry
        const deleteStmt = this.db.prepare(`
        DELETE FROM portfolio_evolution WHERE snapshot_date = ?
      `);
        deleteStmt.run([date]);
        deleteStmt.free();
        console.log(`✅ Removed empty evolution entry for ${date}`);
      } else {
        // Update with remaining notes
        const updateStmt = this.db.prepare(`
        UPDATE portfolio_evolution 
        SET notes = ? 
        WHERE snapshot_date = ?
      `);
        updateStmt.run([updatedNotes, date]);
        updateStmt.free();
        console.log(`✅ Updated evolution entry for ${date}`);
      }
    } catch (_error) {      console.error("❌ Error removing sale note from evolution:", error);
    }
  }

  /**
   * Add a sale note to an evolution entry (creates entry if needed)
   */
  async addSaleNoteToEvolution(date, saleNote) {
    try {
      // Check if evolution entry exists for this date
      const checkStmt = this.db.prepare(`
      SELECT notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);

      checkStmt.bind([date]);
      let existingEntry = null;
      if (checkStmt.step()) {
        existingEntry = checkStmt.getAsObject();
      }
      checkStmt.free();

      let finalNotes = `• ${saleNote}`;

      if (existingEntry && existingEntry.notes) {
        // Entry exists - append new note
        const existingNotes = existingEntry.notes;
        if (!existingNotes.includes(saleNote)) {
          finalNotes = `${existingNotes}\n• ${saleNote}`;
        } else {
          finalNotes = existingNotes; // Don't duplicate
        }
      }

      // Get current portfolio value for this date (approximate)
      const portfolioOverview = await this.getPortfolioOverview();
      const currentTotalValue = portfolioOverview.reduce(
        (sum, entry) => sum + (entry.current_total_value || 0),
        0
      );

      // Create or update the evolution entry
      const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO portfolio_evolution 
      (snapshot_date, total_portfolio_value, total_unrealized_gain, total_realized_gain, total_options_count, active_options_count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

      stmt.run([
        date,
        currentTotalValue || 0,
        0, // unrealized gain
        0, // realized gain
        0, // total options count
        0, // active options count
        finalNotes,
      ]);
      stmt.free();

      console.log(`✅ Added sale note to evolution entry for ${date}`);
    } catch (_error) {      console.error("❌ Error adding sale note to evolution:", error);
    }
  }

  /**
   * Update a sale note in an evolution entry (when price changes but not date)
   */
  async updateSaleNoteInEvolution(date, oldNote, newNote) {
    try {
      const stmt = this.db.prepare(`
      SELECT notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);

      stmt.bind([date]);
      let evolutionEntry = null;
      if (stmt.step()) {
        evolutionEntry = stmt.getAsObject();
      }
      stmt.free();

      if (!evolutionEntry || !evolutionEntry.notes) {
        return;
      }

      // Replace the old note with the new note
      const updatedNotes = evolutionEntry.notes.replace(oldNote, newNote);

      const updateStmt = this.db.prepare(`
      UPDATE portfolio_evolution 
      SET notes = ? 
      WHERE snapshot_date = ?
    `);
      updateStmt.run([updatedNotes, date]);
      updateStmt.free();

      console.log(`✅ Updated sale note in evolution entry for ${date}`);
    } catch (_error) {      console.error("❌ Error updating sale note in evolution:", error);
    }
  }
  // Add this method to portfolio-db.js to recalculate evolution timeline

  /**
   * Recalculate all evolution snapshots from a given date forward
   * This ensures portfolio values and gains are correct after sale date changes
   * @param {string} fromDate - Date to start recalculation from (YYYY-MM-DD)
   */
  async recalculateEvolutionFromDate(fromDate) {
    try {
      console.log(
        `🔄 Recalculating evolution timeline from ${fromDate} forward...`
      );

      // Get all evolution entries from the date forward, ordered by date
      const evolutionStmt = this.db.prepare(`
      SELECT * FROM portfolio_evolution 
      WHERE snapshot_date >= ? 
      ORDER BY snapshot_date ASC
    `);

      const evolutionEntries = [];
      evolutionStmt.bind([fromDate]);
      while (evolutionStmt.step()) {
        evolutionEntries.push(evolutionStmt.getAsObject());
      }
      evolutionStmt.free();

      console.log(
        `📊 Found ${evolutionEntries.length} evolution entries to recalculate`
      );

      // Recalculate each entry
      for (const entry of evolutionEntries) {
        await this.recalculateEvolutionEntry(entry.snapshot_date, entry.notes);
      }

      console.log(`✅ Evolution timeline recalculated from ${fromDate}`);
    } catch (_error) {      console.error("❌ Error recalculating evolution timeline:", error);
      throw error;
    }
  }

  /**
   * Recalculate a specific evolution entry with correct portfolio values
   * @param {string} date - Date of the evolution entry (YYYY-MM-DD)
   * @param {string} existingNotes - Preserve existing notes
   */
  async recalculateEvolutionEntry(date, existingNotes) {
    try {
      console.log(`🧮 Recalculating evolution entry for ${date}`);

      // Get portfolio state as of this date
      const portfolioState = await this.getPortfolioStateAsOfDate(date);

      // Calculate total values
      const totalPortfolioValue = portfolioState.totalCurrentValue;
      const totalRealizedGain = portfolioState.totalRealizedGain;
      const totalUnrealizedGain = portfolioState.totalUnrealizedGain;
      const totalOptionsCount = portfolioState.totalOptionsCount;
      const activeOptionsCount = portfolioState.activeOptionsCount;

      // Update the evolution entry
      const updateStmt = this.db.prepare(`
      UPDATE portfolio_evolution 
      SET 
        total_portfolio_value = ?,
        total_unrealized_gain = ?,
        total_realized_gain = ?,
        total_options_count = ?,
        active_options_count = ?
      WHERE snapshot_date = ?
    `);

      updateStmt.run([
        totalPortfolioValue,
        totalUnrealizedGain,
        totalRealizedGain,
        totalOptionsCount,
        activeOptionsCount,
        date,
      ]);
      updateStmt.free();

      console.log(`✅ Updated evolution entry for ${date}:`, {
        totalPortfolioValue,
        totalRealizedGain,
        totalUnrealizedGain,
      });
    } catch (_error) {      console.error(
        `❌ Error recalculating evolution entry for ${date}:`,
        error
      );
    }
  }

  /**
   * Get portfolio state as of a specific date
   * This calculates what the portfolio looked like on that date
   * @param {string} asOfDate - Date to calculate state for (YYYY-MM-DD)
   * @returns {Object} Portfolio state
   */
  async getPortfolioStateAsOfDate(asOfDate) {
    try {
      // Get all portfolio entries
      const entriesStmt = this.db.prepare(`
      SELECT * FROM portfolio_entries
    `);

      const entries = [];
      while (entriesStmt.step()) {
        entries.push(entriesStmt.getAsObject());
      }
      entriesStmt.free();

      // Get all sales that happened up to this date
      const salesStmt = this.db.prepare(`
      SELECT 
        portfolio_entry_id,
        SUM(quantity_sold) as total_sold,
        SUM(total_sale_value) as total_sale_value,
        SUM(realized_gain_loss) as total_realized_gain
      FROM sales_transactions 
      WHERE sale_date <= ?
      GROUP BY portfolio_entry_id
    `);

      const salesByEntry = {};
      salesStmt.bind([asOfDate]);
      while (salesStmt.step()) {
        const sale = salesStmt.getAsObject();
        salesByEntry[sale.portfolio_entry_id] = sale;
      }
      salesStmt.free();

      // Get price data as of this date (or closest before)
      const priceStmt = this.db.prepare(`
      SELECT 
        exercise_price,
        current_value,
        grant_date
      FROM price_history 
      WHERE price_date <= ?
      ORDER BY price_date DESC
    `);

      const pricesByKey = {};
      priceStmt.bind([asOfDate]);
      while (priceStmt.step()) {
        const price = priceStmt.getAsObject();
        const key = `${price.exercise_price}-${price.grant_date}`;
        if (!pricesByKey[key]) {
          pricesByKey[key] = price.current_value;
        }
      }
      priceStmt.free();

      // Calculate portfolio state
      let totalCurrentValue = 0;
      let totalRealizedGain = 0;
      let totalUnrealizedGain = 0;
      let totalOptionsCount = 0;
      let activeOptionsCount = 0;

      for (const entry of entries) {
        // Calculate quantities as of this date
        const salesForEntry = salesByEntry[entry.id];
        const soldQuantity = salesForEntry ? salesForEntry.total_sold : 0;
        const remainingQuantity = entry.quantity - soldQuantity;

        // Add to totals
        totalOptionsCount += entry.quantity;
        activeOptionsCount += remainingQuantity;

        // Add realized gains from sales
        if (salesForEntry) {
          totalRealizedGain += salesForEntry.total_realized_gain || 0;
        }

        // Calculate current value using price as of this date
        const priceKey = `${entry.exercise_price}-${entry.grant_date}`;
        const currentPrice = pricesByKey[priceKey] || entry.current_value || 0;
        const currentEntryValue = remainingQuantity * currentPrice;

        totalCurrentValue += currentEntryValue;

        // Calculate unrealized gain for this entry
        const targetPercentageQuery =
          await this.getSetting("target_percentage");
        const targetPercentage = parseFloat(targetPercentageQuery || "65");
        const targetValue = remainingQuantity * 10 * (targetPercentage / 100);

        // Tax calculation (proportional to remaining quantity)
        const taxRatio = remainingQuantity / entry.quantity;
        const entryTax =
          (entry.tax_amount || entry.tax_auto_calculated || 0) * taxRatio;

        const unrealizedGain = currentEntryValue - entryTax - targetValue;
        totalUnrealizedGain += unrealizedGain;
      }

      return {
        totalCurrentValue,
        totalRealizedGain,
        totalUnrealizedGain,
        totalOptionsCount,
        activeOptionsCount,
      };
    } catch (_error) {      console.error(
        `❌ Error calculating portfolio state for ${asOfDate}:`,
        error
      );
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
    } catch (_error) {      console.error("Error checking existing grant:", error);
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
    } catch (_error) {      console.error("❌ Error in mergeGrant:", error);
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
      } catch (_error) {        console.warn("Could not get tax rate setting, using default:", error);
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
    } catch (_error) {      console.error("Error adding portfolio entry:", error);
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
    } catch (_error) {      console.error("❌ Error creating evolution entry for grant:", error);
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
      console.log(`💰 Recording sale transaction for ${saleDate}`);

      // Get the portfolio entry to calculate proportional tax
      const entryStmt = this.db.prepare(
        "SELECT * FROM portfolio_entries WHERE id = ?"
      );
      entryStmt.bind([portfolioEntryId]);

      let portfolioEntry = null;
      if (entryStmt.step()) {
        portfolioEntry = entryStmt.getAsObject();
      }
      entryStmt.free();

      if (!portfolioEntry) {
        throw new Error(
          `Portfolio entry with ID ${portfolioEntryId} not found`
        );
      }

      // Calculate values
      const totalSaleValue = quantitySold * salePrice;
      const taxAmount = portfolioEntry.tax_amount || 0;
      const taxAutoCalculated = portfolioEntry.tax_auto_calculated || 0;
      const totalTax = taxAmount > 0 ? taxAmount : taxAutoCalculated;

      // Calculate proportional tax allocation
      const taxAllocatedToSold =
        (totalTax * quantitySold) / portfolioEntry.quantity;
      const newTaxAmount = totalTax - taxAllocatedToSold;

      // Calculate realized gain/loss vs target
      const targetPercentageQuery = await this.getSetting("target_percentage");
      const targetPercentage = parseFloat(targetPercentageQuery || "65");
      const targetValue = quantitySold * 10 * (targetPercentage / 100);
      const realizedGainLoss =
        totalSaleValue - taxAllocatedToSold - targetValue;

      // Insert sale transaction
      const saleStmt = this.db.prepare(`
      INSERT INTO sales_transactions (
        portfolio_entry_id, sale_date, quantity_sold, sale_price, 
        total_sale_value, tax_deducted, realized_gain_loss, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const saleResult = saleStmt.run([
        portfolioEntryId,
        saleDate,
        quantitySold || 0,
        salePrice || 0,
        totalSaleValue || 0,
        taxAllocatedToSold || 0,
        realizedGainLoss || 0,
        notes || null,
      ]);
      saleStmt.free();

      // Update portfolio entry with reduced tax and increased sold quantity
      if (taxAmount > 0) {
        // Manual tax exists - update it
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

      // Create evolution snapshot for the sale date
      await this.createPortfolioSnapshot(
        saleDate,
        "sale",
        `Sale: ${quantitySold} options at €${salePrice}`
      );

      // 🔥 CRITICAL FIX: Recalculate ALL evolution entries from the sale date forward
      console.log(
        `🔄 Recalculating evolution timeline from ${saleDate} forward due to past sale...`
      );
      await this.recalculateEvolutionFromDate(saleDate);

      console.log(
        `✅ Sale recorded and evolution timeline updated. Tax reduced from €${totalTax.toFixed(
          2
        )} to €${newTaxAmount.toFixed(2)}`
      );

      return Promise.resolve({
        id: saleResult.insertId,
        taxAllocatedToSold: taxAllocatedToSold || 0,
        realizedGainLoss: realizedGainLoss || 0,
        totalSaleValue: totalSaleValue || 0,
        remainingTax: newTaxAmount || 0,
        evolutionRecalculated: true, // Indicate that evolution was updated
      });
    } catch (_error) {      console.error("❌ Error in recordSaleTransaction:", error);
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
  -- Amount granted = remaining options × €10
  ((pe.quantity - pe.total_sold_quantity) * 10) as amount_granted,
  pe.current_value,
  pe.total_sold_quantity,
  (pe.quantity - pe.total_sold_quantity) as quantity_remaining,
  pe.tax_amount,
  pe.tax_auto_calculated,
  ph.current_value as latest_current_value,
  ph.price_date as last_price_update,
  ph.fund_name as latest_fund_name,
  
  -- Current total value = remaining quantity × current price
  ((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) as current_total_value,
  
  -- FIXED: P&L = (Current Value - Tax) - (Target Value)
  -- Tax is already proportionally reduced in database, don't apply proportional calculation again
  CASE 
    WHEN COALESCE(ph.current_value, pe.current_value, 0) > 0 THEN
      -- (Current total value - stored tax) - (target value for remaining options)
      (((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) - 
       COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) -
      ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
    ELSE 
      -- When no current value, P&L = (0 - stored tax) - target value
      (0 - COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) -
      ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
  END as profit_loss_vs_target,
  
  -- Target value = remaining options × €10 × target percentage
  ((pe.quantity - pe.total_sold_quantity) * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100) as target_total_value,
  
  -- FIXED: Return % = (Current Value - Tax) / Amount Granted × 100
  -- Tax is already proportionally reduced in database, don't apply proportional calculation again
  CASE 
    WHEN COALESCE(ph.current_value, pe.current_value, 0) > 0 AND (pe.quantity - pe.total_sold_quantity) > 0 THEN
      -- (Current total value - stored tax) / amount granted × 100
      ((((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) - 
        COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) /
       ((pe.quantity - pe.total_sold_quantity) * 10)) * 100
    ELSE 
      CASE 
        WHEN (pe.quantity - pe.total_sold_quantity) > 0 THEN
          -- (0 - stored tax) / amount granted × 100
          (((0 - COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) /
            ((pe.quantity - pe.total_sold_quantity) * 10)) * 100)
        ELSE 0
      END
  END as current_return_percentage,
  
  -- Selling restrictions
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
    } catch (_error) {      return Promise.reject(error);
    }
  }

  // Get sales history
  async getSalesHistory() {
    try {
      const stmt = this.db.prepare(`
SELECT 
  st.id,
  st.sale_date,
  st.quantity_sold,
  st.sale_price,
  st.total_sale_value,
  st.tax_deducted,
  st.notes,
  pe.grant_date,
  pe.exercise_price,
  pe.quantity as original_quantity,
  pe.fund_name,
  
  -- FIXED: Calculate Profit/Loss vs Target (same formula as portfolio overview)
  -- Profit/Loss vs Target = (Total Sale Value - Tax Deducted) - (Quantity × €10 × Target %)
  ((st.total_sale_value - st.tax_deducted) - (st.quantity_sold * 10 * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)) as profit_loss_vs_target
  
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      console.error("Grant history query error:", error);
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      console.error("Error getting portfolio events:", error);
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
    } catch (_error) {      return Promise.reject(error);
    }
  }

  // FIXED: Enhanced portfolio snapshot creation with duplicate handling
  async createPortfolioSnapshot(date, triggerType = "auto", notes = "") {
    try {
      console.log(
        `📸 Creating portfolio snapshot for ${date} (${triggerType})`
      );

      // Check if snapshot already exists for this date
      const existingStmt = this.db.prepare(`
      SELECT id, notes FROM portfolio_evolution 
      WHERE snapshot_date = ?
    `);
      existingStmt.bind([date]);

      let existingSnapshot = null;
      if (existingStmt.step()) {
        existingSnapshot = existingStmt.getAsObject();
      }
      existingStmt.free();

      // Get accurate portfolio state as of this date
      const portfolioState = await this.getPortfolioStateAsOfDate(date);

      if (existingSnapshot) {
        // Update existing snapshot with new notes and accurate values
        let updatedNotes = existingSnapshot.notes || "";

        if (notes && notes.trim() !== "") {
          if (updatedNotes && !updatedNotes.includes(notes)) {
            updatedNotes += updatedNotes.endsWith(".") ? " " : ". ";
            updatedNotes += notes;
          } else if (!updatedNotes) {
            updatedNotes = notes;
          }
        }

        const updateStmt = this.db.prepare(`
        UPDATE portfolio_evolution 
        SET 
          total_portfolio_value = ?,
          total_unrealized_gain = ?,
          total_realized_gain = ?,
          total_options_count = ?,
          active_options_count = ?,
          notes = ?
        WHERE snapshot_date = ?
      `);

        updateStmt.run([
          portfolioState.totalCurrentValue,
          portfolioState.totalUnrealizedGain,
          portfolioState.totalRealizedGain,
          portfolioState.totalOptionsCount,
          portfolioState.activeOptionsCount,
          updatedNotes,
          date,
        ]);
        updateStmt.free();

        console.log(`✅ Updated existing portfolio snapshot for ${date}`);
      } else {
        // Create new snapshot with accurate values
        const insertStmt = this.db.prepare(`
        INSERT INTO portfolio_evolution (
          snapshot_date,
          total_portfolio_value,
          total_unrealized_gain,
          total_realized_gain,
          total_options_count,
          active_options_count,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

        insertStmt.run([
          date,
          portfolioState.totalCurrentValue,
          portfolioState.totalUnrealizedGain,
          portfolioState.totalRealizedGain,
          portfolioState.totalOptionsCount,
          portfolioState.activeOptionsCount,
          notes,
        ]);
        insertStmt.free();

        console.log(`✅ Created new portfolio snapshot for ${date}`);
      }

      this.saveDatabase();
      return Promise.resolve({ success: true });
    } catch (_error) {      console.error(`❌ Error creating portfolio snapshot for ${date}:`, error);
      return Promise.reject(error);
    }
  }
  async recalculateEntireEvolutionTimeline() {
    try {
      console.log("🔄 Manually recalculating entire evolution timeline...");

      // Get the earliest evolution entry date
      const earliestStmt = this.db.prepare(`
      SELECT MIN(snapshot_date) as earliest_date 
      FROM portfolio_evolution
    `);

      let earliestDate = null;
      if (earliestStmt.step()) {
        const result = earliestStmt.getAsObject();
        earliestDate = result.earliest_date;
      }
      earliestStmt.free();

      if (earliestDate) {
        console.log(`📅 Recalculating from earliest date: ${earliestDate}`);
        await this.recalculateEvolutionFromDate(earliestDate);
        console.log("✅ Entire evolution timeline recalculated");
      } else {
        console.log("ℹ️ No evolution entries found to recalculate");
      }
    } catch (_error) {      console.error("❌ Error in manual evolution recalculation:", error);
      throw error;
    }
  }
  async debugEvolutionConsistency() {
    try {
      console.log("🔍 Checking evolution timeline consistency...");

      // Get all evolution entries with sales dates
      const stmt = this.db.prepare(`
      SELECT 
        e.snapshot_date,
        e.total_portfolio_value,
        e.notes,
        s.sale_date,
        s.quantity_sold,
        s.sale_price
      FROM portfolio_evolution e
      LEFT JOIN sales_transactions s ON DATE(e.snapshot_date) = DATE(s.sale_date)
      ORDER BY e.snapshot_date DESC
      LIMIT 10
    `);

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      console.table(rows);

      // Check for potential issues
      for (let i = 0; i < rows.length - 1; i++) {
        const current = rows[i];
        const next = rows[i + 1];

        const change =
          current.total_portfolio_value - next.total_portfolio_value;
        const changePercent = (change / next.total_portfolio_value) * 100;

        if (Math.abs(changePercent) > 10) {
          console.warn(
            `⚠️ Large change detected: ${current.snapshot_date} vs ${next.snapshot_date}: ${changePercent.toFixed(1)}%`
          );
          console.warn(
            `Current: €${current.total_portfolio_value}, Previous: €${next.total_portfolio_value}`
          );
          console.warn(`Notes: "${current.notes}"`);
        }
      }
    } catch (_error) {      console.error("❌ Error in evolution consistency check:", error);
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      console.error("Error updating tax amount:", error);
      return Promise.reject(error);
    }
  }
  async deleteDatabase() {
    try {
      console.log("🗑️ Starting database deletion process...");

      // Close current database connection
      if (this.db) {
        console.log("📎 Closing database connection...");
        this.db.close();
        this.db = null;
      }

      // Delete the database file
      if (fs.existsSync(this.dbPath)) {
        console.log(`🗑️ Deleting database file: ${this.dbPath}`);
        fs.unlinkSync(this.dbPath);
      }

      // Delete backup file if it exists
      const backupPath = `${this.dbPath}.bak`;
      if (fs.existsSync(backupPath)) {
        console.log(`🗑️ Deleting backup file: ${backupPath}`);
        fs.unlinkSync(backupPath);
      }

      // Create a fresh database using the correct method name
      console.log("🆕 Creating fresh database...");
      await this.initialize(); // FIXED: Use initialize() instead of initializeDatabase()

      console.log("✅ Database deletion and recreation completed");

      return Promise.resolve({
        success: true,
        message: "Database deleted and recreated successfully",
      });
    } catch (_error) {      console.error("❌ Error during database deletion:", error);

      // If something went wrong, try to restore from backup or create new
      try {
        console.log("🔄 Attempting recovery...");
        await this.initialize(); // FIXED: Use initialize() instead of initializeDatabase()
        return Promise.resolve({
          success: true,
          message: "Database deleted with recovery",
        });
      } catch (recoveryError) {
        console.error("❌ Recovery also failed:", recoveryError);
        return Promise.reject({
          success: false,
          error: `Database deletion failed: ${error.message}. Recovery also failed: ${recoveryError.message}`,
        });
      }
    }
  }

  /**
   * Create an emergency backup before database deletion
   * This is called automatically before deleteDatabase()
   */
  async createEmergencyBackup() {
    try {
      console.log("💾 Creating emergency backup before deletion...");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const emergencyBackupPath = path.join(
        path.dirname(this.dbPath),
        `emergency-backup-${timestamp}.json`
      );

      // Export current database
      const exportData = await this.exportDatabase();

      // Write to emergency backup file
      fs.writeFileSync(
        emergencyBackupPath,
        JSON.stringify(exportData, null, 2)
      );

      console.log(`💾 Emergency backup created: ${emergencyBackupPath}`);

      return {
        success: true,
        backupPath: emergencyBackupPath,
      };
    } catch (_error) {      console.error("❌ Failed to create emergency backup:", error);
      // Don't throw error - deletion can proceed without backup
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enhanced delete database method with automatic backup
   */
  async deleteDatabaseWithBackup() {
    try {
      console.log("🗑️ Starting enhanced database deletion with backup...");

      // Step 1: Create emergency backup
      const backupResult = await this.createEmergencyBackup();
      if (backupResult.success) {
        console.log(`✅ Emergency backup created: ${backupResult.backupPath}`);
      } else {
        console.warn(`⚠️ Emergency backup failed: ${backupResult.error}`);
        // Continue with deletion anyway
      }

      // Step 2: Proceed with regular deletion
      return await this.deleteDatabase();
    } catch (_error) {      console.error("❌ Enhanced database deletion failed:", error);
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
    } catch (_error) {      console.error("Error deleting portfolio entry:", error);
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
    } catch (_error) {      return Promise.reject(error);
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
    } catch (_error) {      return Promise.reject(error);
    }
  }

  async getSetting(key) {
    try {
      console.log(`🔍 DEBUG DB: getSetting('${key}') called`);

      const stmt = this.db.prepare(
        "SELECT setting_value FROM settings WHERE setting_key = ?"
      );
      stmt.bind([key]);

      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject().setting_value;
        console.log(`🔍 DEBUG DB: Found ${key} =`, result);
      } else {
        console.log(`🔍 DEBUG DB: No value found for ${key}`);
      }
      stmt.free();

      return Promise.resolve(result);
    } catch (_error) {      console.error(`❌ Error getting setting '${key}':`, error);
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
    } catch (_error) {      console.error("Error getting latest price date:", error);
      return Promise.reject(error);
    }
  }

  async updateSetting(key, value) {
    try {
      // Now we can use INSERT OR REPLACE safely since setting_key is the primary key
      const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

      const result = stmt.run([key, value]);
      stmt.free();
      // Verify it was saved
      const verifyStmt = this.db.prepare(
        "SELECT setting_value FROM settings WHERE setting_key = ?"
      );
      verifyStmt.bind([key]);
      let savedValue = null;
      if (verifyStmt.step()) {
        savedValue = verifyStmt.getAsObject().setting_value;
      }
      verifyStmt.free();
      this.saveDatabase();
      return Promise.resolve({ changes: 1 });
    } catch (_error) {      return Promise.reject(error);
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
