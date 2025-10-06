const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class PortfolioDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.dbDirectory = null;
    this.debugLog = [];
    this.initializeDatabasePath();
  }
  // Enhanced logging for debugging
  logDebug(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.debugLog.push(logEntry);
    console.log(logEntry);
  }

  // Initialize database path with Windows permission-friendly locations
  initializeDatabasePath() {
    this.logDebug(`🚀 Starting database path initialization...`);
    this.logDebug(`🖥️ Platform: ${process.platform}`);
    this.logDebug(`📍 Process executable path: ${process.execPath}`);
    this.logDebug(`📂 Current working directory: ${process.cwd()}`);

    // ✨ OFFICIAL: Check electron-builder portable environment variables
    const portableExecutableDir = process.env.PORTABLE_EXECUTABLE_DIR;
    const portableExecutableFile = process.env.PORTABLE_EXECUTABLE_FILE;
    const portableAppFilename = process.env.PORTABLE_EXECUTABLE_APP_FILENAME;

    this.logDebug(`🔍 ELECTRON-BUILDER PORTABLE DETECTION:`);
    this.logDebug(
      `   PORTABLE_EXECUTABLE_DIR: ${portableExecutableDir || "undefined"}`
    );
    this.logDebug(
      `   PORTABLE_EXECUTABLE_FILE: ${portableExecutableFile || "undefined"}`
    );
    this.logDebug(
      `   PORTABLE_EXECUTABLE_APP_FILENAME: ${portableAppFilename || "undefined"}`
    );

    let dbDirectory;
    let dbPath;
    let strategy;

    if (!app) {
      throw new Error(
        "Electron app not available - this should only run in main process"
      );
    }

    // Check if we're in development mode
    if (!app.isPackaged) {
      strategy = "development";
      dbDirectory = process.cwd();
      dbPath = path.join(dbDirectory, "portfolio.db");
      this.logDebug(`🔧 DEVELOPMENT: Using project directory: ${dbDirectory}`);
    }
    // Check if we're in portable mode (OFFICIAL electron-builder way)
    else if (portableExecutableDir) {
      strategy = "portable";
      this.logDebug(`📱 PORTABLE MODE DETECTED (official electron-builder)`);

      // For TRUE PORTABILITY: Try to store database next to executable
      try {
        // First try: Store database in the same directory as the original portable executable
        // This is what you want for USB stick portability
        const originalExeDir = path.dirname(
          portableExecutableFile || process.execPath
        );
        this.logDebug(
          `📁 Trying original executable directory: ${originalExeDir}`
        );

        if (this.testWritePermissions(originalExeDir)) {
          dbDirectory = originalExeDir;
          dbPath = path.join(dbDirectory, "portfolio.db");
          this.logDebug(
            `✅ PORTABLE: Using executable directory: ${dbDirectory}`
          );
        } else {
          throw new Error("Original executable directory not writable");
        }
      } catch (execDirError) {
        this.logDebug(
          `⚠️ Original executable directory failed: ${execDirError.message}`
        );

        // Fallback: Use portable executable directory (temp location)
        try {
          if (this.testWritePermissions(portableExecutableDir)) {
            dbDirectory = portableExecutableDir;
            dbPath = path.join(dbDirectory, "portfolio.db");
            this.logDebug(
              `📱 PORTABLE FALLBACK: Using temp portable dir: ${dbDirectory}`
            );
          } else {
            throw new Error("Portable executable directory not writable");
          }
        } catch (portableDirError) {
          this.logDebug(
            `⚠️ Portable directory failed: ${portableDirError.message}`
          );

          // Final fallback for portable: Documents folder
          dbDirectory = path.join(
            require("os").homedir(),
            "Documents",
            "PortfolioTracker-Portable"
          );
          dbPath = path.join(dbDirectory, "portfolio.db");
          this.logDebug(
            `📁 PORTABLE FINAL FALLBACK: Using Documents: ${dbDirectory}`
          );
        }
      }
    }
    // Regular installer mode
    else {
      strategy = "installer";
      dbDirectory = app.getPath("userData");
      dbPath = path.join(dbDirectory, "portfolio.db");
      this.logDebug(`📦 INSTALLER: Using Electron userData: ${dbDirectory}`);
    }

    this.dbDirectory = dbDirectory;
    this.dbPath = dbPath;

    this.logDebug(`🎯 FINAL RESULT:`);
    this.logDebug(`   Strategy: ${strategy}`);
    this.logDebug(`   Is Packaged: ${app.isPackaged}`);
    this.logDebug(`   Directory: ${this.dbDirectory}`);
    this.logDebug(`   Database Path: ${this.dbPath}`);
    this.logDebug(`   Directory Exists: ${fs.existsSync(this.dbDirectory)}`);

    // Ensure directory exists
    this.ensureDatabaseDirectory();
  }

  // Test write permissions helper
  testWritePermissions(dirPath) {
    try {
      // Ensure directory exists first
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Test write permissions with a temporary file
      const testFile = path.join(dirPath, `write-test-${Date.now()}.tmp`);
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);

      this.logDebug(`✅ Write permissions confirmed for: ${dirPath}`);
      return true;
    } catch (error) {
      this.logDebug(
        `❌ Write permission test failed for ${dirPath}: ${error.message}`
      );
      return false;
    }
  }

  // Detect if we're running in development mode
  // Detect if running as portable version
  // IMPROVED: More robust portable version detection with detailed logging
  // IMPROVED: Development mode detection with detailed logging
  testWritePermissions(dirPath) {
    try {
      // Ensure directory exists first
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Test write permissions with a temporary file
      const testFile = path.join(dirPath, `write-test-${Date.now()}.tmp`);
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);

      this.logDebug(`✅ Write permissions confirmed for: ${dirPath}`);
      return true;
    } catch (error) {
      this.logDebug(
        `❌ Write permission test failed for ${dirPath}: ${error.message}`
      );
      return false;
    }
  }

  // Ensure database directory exists with proper Windows permissions
  ensureDatabaseDirectory() {
    this.logDebug(`🔧 Ensuring database directory exists and is writable...`);

    try {
      if (!fs.existsSync(this.dbDirectory)) {
        this.logDebug(`📁 Creating directory: ${this.dbDirectory}`);
        fs.mkdirSync(this.dbDirectory, { recursive: true, mode: 0o755 });
        this.logDebug(`✅ Directory created successfully`);
      } else {
        this.logDebug(`✅ Directory already exists: ${this.dbDirectory}`);
      }

      // Final write test
      if (this.testWritePermissions(this.dbDirectory)) {
        this.logDebug(
          `✅ Final verification: Directory is ready for database operations`
        );
      } else {
        throw new Error(`Final verification failed: Directory not writable`);
      }
    } catch (error) {
      this.logDebug(
        `💥 CRITICAL: Database directory setup failed: ${error.message}`
      );
      throw error;
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
      execPath: process.execPath,
      cwd: process.cwd(),
      isPackaged: app ? app.isPackaged : false,
      portableExecutableDir: process.env.PORTABLE_EXECUTABLE_DIR,
      portableExecutableFile: process.env.PORTABLE_EXECUTABLE_FILE,
    };
  }
  outputDebugLog() {
    console.log("\n" + "=".repeat(80));
    console.log("🐛 PORTFOLIO TRACKER DATABASE DEBUG LOG");
    console.log("=".repeat(80));

    this.debugLog.forEach((entry) => console.log(entry));

    console.log("=".repeat(80));
    console.log(
      "🔍 Database Info:",
      JSON.stringify(this.getDatabaseInfo(), null, 2)
    );
    console.log("=".repeat(80) + "\n");
  }
  exportDebugLog() {
    try {
      const logPath = path.join(
        this.dbDirectory || os.tmpdir(),
        `portfolio-debug-${Date.now()}.log`
      );
      const logContent = this.debugLog.join("\n");
      fs.writeFileSync(logPath, logContent);
      console.log(`📝 Debug log exported to: ${logPath}`);
      return logPath;
    } catch (error) {
      console.log(`❌ Failed to export debug log: ${error.message}`);
      return null;
    }
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
    this.logDebug("🔧 Initializing SQL.js database...");

    try {
      const SQL = await initSqlJs();

      // Try to load existing database
      if (fs.existsSync(this.dbPath)) {
        this.logDebug(`📂 Loading existing database from: ${this.dbPath}`);
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(filebuffer);
        this.logDebug("✅ Existing database loaded successfully");

        // Run database migrations for existing databases
        await this.runMigrations();
      } else {
        this.logDebug("🆕 Creating new database");
        this.db = new SQL.Database();
        await this.createTables();
        await this.saveDatabase();
        this.logDebug("✅ New database created and saved");
      }

      this.logDebug("✅ Database initialization completed successfully");
      return this.db;
    } catch (error) {
      this.logDebug(`💥 Database initialization failed: ${error.message}`);
      throw error;
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
  async saveDatabase() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
      this.logDebug(`✅ Database saved successfully to: ${this.dbPath}`);
    } catch (error) {
      this.logDebug(`❌ Failed to save database: ${error.message}`);
      throw error;
    }
  }

  // Create all necessary tables
  // REPLACE the createTables method in portfolio-db.js with this clean version:

  async createTables() {
    this.logDebug(`🏗️ Creating database schema...`);
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
      grant_date_price DECIMAL(10,2) DEFAULT 10.00,
      tax_amount DECIMAL(10,2) DEFAULT NULL,
      tax_auto_calculated DECIMAL(10,2),
      total_sold_quantity INTEGER DEFAULT 0,
      source TEXT CHECK(source IN ('KBC', 'ING')) NOT NULL DEFAULT 'KBC',
      isin VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Single unified price history table
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_date DATE NOT NULL,
      exercise_price DECIMAL(10,2) NOT NULL,
      current_value DECIMAL(10,2) NOT NULL,
      high_value DECIMAL(10,2),
      low_value DECIMAL(10,2),
      grant_date DATE,
      fund_name TEXT,
      portfolio_entry_id INTEGER,
      scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(exercise_price, grant_date, price_date),
      FOREIGN KEY (portfolio_entry_id) REFERENCES portfolio_entries(id)
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

    -- Database metadata
    CREATE TABLE IF NOT EXISTS database_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schema_version INTEGER NOT NULL DEFAULT 3,
      last_migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      backup_count INTEGER DEFAULT 0
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_portfolio_grant_date ON portfolio_entries(grant_date);
    CREATE INDEX IF NOT EXISTS idx_portfolio_exercise_price ON portfolio_entries(exercise_price);
    CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(price_date);
    CREATE INDEX IF NOT EXISTS idx_price_history_option ON price_history(exercise_price, grant_date);
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
        const result = stmt.run([key, value]);

        if (result.changes > 0) {
          console.log(`✅ Created setting: ${key} = ${value}`);
        } else {
          console.log(`✅ Setting exists: ${key}`);
        }

        stmt.free();
      });

      // Initialize database metadata with version 3 (clean schema)
      const metaStmt = this.db.prepare(
        "INSERT OR IGNORE INTO database_metadata (schema_version) VALUES (?)"
      );
      metaStmt.run([3]);
      metaStmt.free();

      this.saveDatabase();
      this.logDebug(`✅ Database schema created successfully`);
      console.log("✅ Clean database schema created successfully");
      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Schema creation failed: ${error.message}`);
      this.logDebug(`❌ Failed to create database schema: ${error.message}`);
      return Promise.reject(error);
    }
  }

  // Database migration system
  async runMigrations() {
    this.logDebug("🔄 Running database migrations...");

    try {
      // Rename FOP to isin
      await this.migrateRenameFOPToIsin();

      // Migrate source column
      await this.migrateAddSourceColumn();

      // Migrate FOP column
      await this.migrateAddFOPColumn();

      // Migrate price_history relations
      await this.migratePriceHistoryRelations();

      // Check if grant_date_price column exists
      await this.migrateAddGrantDatePriceColumn();

      // Populate grant_date_price for existing entries
      await this.migratePopulateGrantDatePrices();

      // Remove zero prices from price_history
      await this.migrateRemoveZeroPrices();

      this.logDebug("✅ All migrations completed successfully");
    } catch (error) {
      this.logDebug(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  async migrateRenameFOPToIsin() {
    try {
      const stmt = this.db.prepare("PRAGMA table_info(portfolio_entries)");
      const columns = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        columns.push(row.name);
      }
      stmt.free();

      if (columns.includes('FOP') && !columns.includes('isin')) {
        this.logDebug("🔧 Renaming FOP column to isin...");
        this.db.exec(`ALTER TABLE portfolio_entries RENAME COLUMN FOP TO isin;`);
        this.logDebug("✅ FOP column renamed to isin successfully");
      } else if (!columns.includes('isin') && !columns.includes('FOP')) {
        this.logDebug("🔧 Adding isin column to portfolio_entries table...");
        this.db.exec(`ALTER TABLE portfolio_entries ADD COLUMN isin VARCHAR(50);`);
        this.logDebug("✅ isin column added successfully");
      } else {
        this.logDebug("✅ isin column already exists. No migration needed.");
      }
    } catch (error) {
      this.logDebug(`❌ Error migrating isin column: ${error.message}`);
    }
  }

  // Migration: Add source column to portfolio_entries if it doesn't exist
  async migrateAddSourceColumn() {
    try {
      // Check if column exists
      const stmt = this.db.prepare("PRAGMA table_info(portfolio_entries)");
      const columns = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        columns.push(row.name);
      }
      stmt.free();

      if (columns.includes('source')) {
        this.logDebug("✅ source column already exists");
        return;
      }
      this.logDebug("🔧 Adding source column to portfolio_entries table...");

      this.db.exec(`
        ALTER TABLE portfolio_entries
        ADD COLUMN source TEXT CHECK(source IN ('KBC', 'ING')) NOT NULL DEFAULT 'KBC';
      `);
      this.logDebug("✅ source column added successfully");
    } catch (error) {
      this.logDebug(`❌ Error adding source column: ${error.message}`);
      throw error;
    }
  }

  // Migration: Add FOP column to portfolio_entries if it doesn't exist
  async migrateAddFOPColumn() {
    try {
      // Check if column exists
      const stmt = this.db.prepare("PRAGMA table_info(portfolio_entries)");
      const columns = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        columns.push(row.name);
      }
      stmt.free();

      if (columns.includes('FOP')) {
        this.logDebug("✅ FOP column already exists");
        return;
      }
      this.logDebug("🔧 Adding FOP column to portfolio_entries table...");

      this.db.exec(`
        ALTER TABLE portfolio_entries
        ADD COLUMN FOP TEXT;
      `);
      this.logDebug("✅ FOP column added successfully");
    } catch (error) {
      this.logDebug(`❌ Error adding FOP column: ${error.message}`);
      throw error;
    }
  }

  // Migration: Link price_history entries to portfolio_entries
  async migratePriceHistoryRelations() {
    // 1. Check if column exists
    const pragma = this.db.exec("PRAGMA table_info(price_history)");
    const cols = pragma.length ? pragma[0].values : [];
    const hasColumn = cols.some(col => col[1] === "portfolio_entry_id");

    if (!hasColumn) {
      this.logDebug("🔧 Adding portfolio_entry_id column to price_history table...");
      this.db.exec(`
      ALTER TABLE price_history
      ADD COLUMN portfolio_entry_id INTEGER;
    `);
    }

    // 2. Backfill portfolio_entry_id
    this.db.exec(`
    UPDATE price_history
    SET portfolio_entry_id = (
      SELECT pe.id
      FROM portfolio_entries pe
      WHERE pe.exercise_price = price_history.exercise_price
        AND pe.grant_date = price_history.grant_date
      LIMIT 1
    )
    WHERE portfolio_entry_id IS NULL;
  `);

    // 3. Enable runtime foreign key checks
    this.db.exec("PRAGMA foreign_keys = ON;");

    this.logDebug("✅ migratePriceHistoryRelations completed");
  }


  // Migration: Add grant_date_price column if it doesn't exist
  async migrateAddGrantDatePriceColumn() {
    try {
      // Check if column exists
      const stmt = this.db.prepare("PRAGMA table_info(portfolio_entries)");
      const columns = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        columns.push(row.name);
      }
      stmt.free();

      if (columns.includes('grant_date_price')) {
        this.logDebug("✅ grant_date_price column already exists");
        return;
      }

      this.logDebug("🔧 Adding grant_date_price column to portfolio_entries table...");
      this.db.exec(`
        ALTER TABLE portfolio_entries 
        ADD COLUMN grant_date_price DECIMAL(10,2) DEFAULT 10.00;
      `);

      this.logDebug("✅ grant_date_price column added successfully");
    } catch (error) {
      this.logDebug(`❌ Error adding grant_date_price column: ${error.message}`);
      throw error;
    }
  }

  // Migration: Populate grant_date_price for existing entries using historical data
  async migratePopulateGrantDatePrices() {
    try {
      // Get all entries that need migration (grant_date_price is NULL or 10.00)
      const selectStmt = this.db.prepare(`
        SELECT id, grant_date, exercise_price, fund_name 
        FROM portfolio_entries 
        WHERE grant_date_price IS NULL OR grant_date_price = 10.00
      `);

      const entriesToMigrate = [];
      while (selectStmt.step()) {
        entriesToMigrate.push(selectStmt.getAsObject());
      }
      selectStmt.free();

      if (entriesToMigrate.length === 0) {
        this.logDebug("✅ No entries need grant_date_price migration");
        return;
      }

      this.logDebug(`🔧 Migrating grant_date_price for ${entriesToMigrate.length} entries...`);

      let updatedCount = 0;
      let fallbackCount = 0;

      for (const entry of entriesToMigrate) {
        try {
          // Try to find historical price for this specific grant date and exercise price
          const priceStmt = this.db.prepare(`
            SELECT current_value 
            FROM price_history 
            WHERE price_date = ? AND exercise_price = ?
            ORDER BY scraped_at DESC 
            LIMIT 1
          `);

          let grantDatePrice = null;
          priceStmt.bind([entry.grant_date, entry.exercise_price]);
          if (priceStmt.step()) {
            const priceData = priceStmt.getAsObject();
            grantDatePrice = priceData.current_value;
          }
          priceStmt.free();

          // Only use exact matches - no fallback to closest prices
          // This preserves the original user experience where they had no historical data

          // Update the entry with the found price or keep 10.00 as fallback
          const finalPrice = grantDatePrice || 10.00;
          const updateStmt = this.db.prepare(`
            UPDATE portfolio_entries 
            SET grant_date_price = ? 
            WHERE id = ?
          `);
          updateStmt.run([finalPrice, entry.id]);
          updateStmt.free();

          if (grantDatePrice) {
            updatedCount++;
            this.logDebug(`✅ Updated entry ${entry.id} with exact grant date price: €${finalPrice}`);
          } else {
            fallbackCount++;
            this.logDebug(`⚠️ Entry ${entry.id} kept fallback price: €${finalPrice} (no exact historical data)`);
          }

        } catch (entryError) {
          this.logDebug(`❌ Error migrating entry ${entry.id}: ${entryError.message}`);
          // Continue with other entries
        }
      }

      this.logDebug(`✅ Grant date price migration completed:`);
      this.logDebug(`   - ${updatedCount} entries updated with exact grant date prices`);
      this.logDebug(`   - ${fallbackCount} entries kept fallback price (€10.00 - no exact historical data available)`);

      // Save the database after migration
      await this.saveDatabase();

    } catch (error) {
      this.logDebug(`❌ Error populating grant_date_price: ${error.message}`);
      throw error;
    }
  }

  // Migration: Remove zero prices from price_history
  async migrateRemoveZeroPrices() {
    try {
      this.logDebug("🔄 Checking for zero prices in price_history...");

      const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM price_history WHERE current_value = 0 OR current_value IS NULL");
      let zeroCount = 0;
      if (countStmt.step()) {
        const result = countStmt.getAsObject();
        zeroCount = result.count;
      }
      countStmt.free();

      if (zeroCount === 0) {
        this.logDebug("✅ No zero prices found in price_history");
        return;
      }

      this.logDebug(`🔧 Removing ${zeroCount} zero/null prices from price_history...`);

      const deleteStmt = this.db.prepare("DELETE FROM price_history WHERE current_value = 0 OR current_value IS NULL");
      deleteStmt.step();
      deleteStmt.free();

      await this.saveDatabase();
      this.logDebug(`✅ Removed ${zeroCount} zero/null prices from price_history`);
    } catch (error) {
      this.logDebug(`❌ Error removing zero prices: ${error.message}`);
    }
  }

  // Add diagnostic method for troubleshooting
  async runDiagnostics() {
    this.logDebug(`🔍 Running database diagnostics...`);

    try {
      // Check basic database info
      const info = this.getDatabaseInfo();
      this.logDebug(`📊 Database Info: ${JSON.stringify(info, null, 2)}`);

      // Check table existence
      const tables = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      this.logDebug(`📋 Database tables: ${JSON.stringify(tables, null, 2)}`);

      // Check record counts
      if (tables.length > 0) {
        try {
          const portfolioCount = this.db.exec(
            "SELECT COUNT(*) as count FROM portfolios"
          );
          const entryCount = this.db.exec(
            "SELECT COUNT(*) as count FROM portfolio_entries"
          );
          this.logDebug(
            `📈 Record counts - Portfolios: ${JSON.stringify(portfolioCount)}, Entries: ${JSON.stringify(entryCount)}`
          );
        } catch (countError) {
          this.logDebug(
            `⚠️ Could not get record counts: ${countError.message}`
          );
        }
      }
    } catch (error) {
      this.logDebug(`❌ Diagnostics failed: ${error.message}`);
    }
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
    } catch (error) {
      console.error("❌ Error getting sale with portfolio data:", error);
      throw error;
    }
  }
  async getClosestPriceForDate(targetDate, exercisePrice, grantDate) {
    try {
      console.log(
        `📊 Looking for price data for €${exercisePrice} (${grantDate}) on ${targetDate}`
      );

      // First, try to get exact price for this date
      const exactStmt = this.db.prepare(`
      SELECT current_value, price_date, 'exact' as match_type
      FROM price_history 
      WHERE price_date = ? AND exercise_price = ? AND grant_date = ?
    `);

      exactStmt.bind([targetDate, exercisePrice, grantDate]);
      if (exactStmt.step()) {
        const result = exactStmt.getAsObject();
        exactStmt.free();
        console.log(
          `✅ Found exact price for ${targetDate}: €${result.current_value}`
        );
        return result;
      }
      exactStmt.free();

      // If no exact match, find the closest price
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
    } catch (error) {
      console.error(`❌ Error getting closest price for ${targetDate}:`, error);
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
      st.portfolio_entry_id,
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
      ((st.total_sale_value - st.tax_deducted) - (st.quantity_sold * COALESCE(pe.grant_date_price, 10) * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)) as profit_loss_vs_target
      
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

      // Validate required parameters
      if (!updatedSale.id) {
        throw new Error("Sale ID is required");
      }
      if (!updatedSale.sale_date) {
        throw new Error("Sale date is required");
      }
      if (updatedSale.sale_price === undefined || updatedSale.sale_price === null) {
        throw new Error("Sale price is required");
      }

      // First get the current sale data
      const currentSale = await this.getSaleDetails(updatedSale.id);
      console.log("📦 Current sale data:", currentSale);

      if (!currentSale) {
        throw new Error(`Sale with ID ${updatedSale.id} not found`);
      }

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

      // Calculate new profit/loss vs target (using stored tax_deducted and grant_date_price)
      const taxDeducted = currentSale.tax_deducted || 0;
      const targetPercentageQuery = await this.getSetting("target_percentage");
      const targetPercentage = parseFloat(targetPercentageQuery || "65");

      // Get grant_date_price from portfolio entry
      const portfolioStmt = this.db.prepare(`
        SELECT grant_date_price FROM portfolio_entries WHERE id = ?
      `);
      portfolioStmt.bind([currentSale.portfolio_entry_id]);
      let grantDatePrice = 10; // fallback
      if (portfolioStmt.step()) {
        const portfolioData = portfolioStmt.getAsObject();
        grantDatePrice = portfolioData.grant_date_price || 10;
      }
      portfolioStmt.free();

      const targetValue = currentSale.quantity_sold * grantDatePrice * (targetPercentage / 100);
      const newProfitLossVsTarget = newTotalSaleValue - taxDeducted - targetValue;

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

      // Validate all parameters before binding
      const params = [
        updatedSale.sale_date,
        updatedSale.sale_price,
        newTotalSaleValue,
        updatedSale.notes || null,
        updatedSale.id,
      ];

      console.log("🔍 SQL binding parameters:", params);

      // Check for undefined values
      params.forEach((param, index) => {
        if (param === undefined) {
          throw new Error(`SQL parameter at index ${index} is undefined`);
        }
      });

      stmt.bind(params);
      stmt.step();
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

        // 3. *** NEW: Recalculate evolution timeline from earliest affected date ***
        const earliestDate =
          oldSaleDate < newSaleDate ? oldSaleDate : newSaleDate;
        console.log(`🔥 Triggering optimized evolution timeline rebuild from ${earliestDate} due to sale date change`);
        await this.rebuildCompleteEvolutionTimeline(null, earliestDate);

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

        // Recalculate timeline from sale date (price change affects realized gains)
        console.log(`🔥 Triggering optimized evolution timeline rebuild from ${newSaleDate} due to sale price change`);
        await this.rebuildCompleteEvolutionTimeline(null, newSaleDate);
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
    } catch (error) {
      console.error("❌ Error updating sale:", error);
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
    } catch (error) {
      console.error("❌ Error removing sale note from evolution:", error);
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
    } catch (error) {
      console.error("❌ Error adding sale note to evolution:", error);
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
    } catch (error) {
      console.error("❌ Error updating sale note in evolution:", error);
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
      const grantDatePrice = existing.grant_date_price || 10;
      const newAmountGranted = newQuantity * grantDatePrice;

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
        const additionalAutoTax = additionalQty * grantDatePrice * (taxRate / 100);

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

  async addPortfolioEntry(grantData) {
    const {
      grantDate,
      exercisePrice,
      quantity,
      taxAmount = null,
      source = "KBC",
      isin = null,
      fundName: ingFundName,
      currentValue: ingCurrentValue,
      firstAvailablePrice: ingFirstAvailablePrice,
    } = grantData;

    try {
      console.log("Adding portfolio entry:", grantData);

      if (!grantDate || !exercisePrice || !quantity) {
        throw new Error(
          "Missing required parameters: grantDate, exercisePrice, or quantity"
        );
      }

      let fundName = ingFundName;
      let currentValue = ingCurrentValue;
      let grantDatePrice;

      if (source === "KBC") {
        const priceStmt = this.db.prepare(
          `SELECT fund_name, current_value FROM price_history WHERE exercise_price = ? AND price_date = ? ORDER BY price_date DESC LIMIT 1`
        );
        let priceData = null;
        priceStmt.bind([exercisePrice, grantDate]);
        if (priceStmt.step()) {
          priceData = priceStmt.getAsObject();
        }
        priceStmt.free();

        if (priceData) {
          fundName = priceData.fund_name || null;
          currentValue = priceData.current_value || 0;
        } else {
          const fallbackStmt = this.db.prepare(
            `SELECT fund_name, current_value, price_date FROM price_history WHERE exercise_price = ? AND price_date <= ? ORDER BY price_date DESC LIMIT 1`
          );
          let fallbackData = null;
          fallbackStmt.bind([exercisePrice, grantDate]);
          if (fallbackStmt.step()) {
            fallbackData = fallbackStmt.getAsObject();
          }
          fallbackStmt.free();

          if (fallbackData) {
            fundName = fallbackData.fund_name || null;
            currentValue = fallbackData.current_value || 0;
          }
        }
        grantDatePrice = currentValue && currentValue !== 'N/A' ? currentValue : 10;
      } else if (source === "ING") {
        grantDatePrice = ingFirstAvailablePrice && ingFirstAvailablePrice !== 'N/A' ? ingFirstAvailablePrice : 10;
      }

      const amountGranted = quantity * grantDatePrice;
      const taxRateSetting = await this.getSetting("tax_auto_rate");
      const taxRate = parseFloat(taxRateSetting || "30");
      const autoTax = amountGranted * (taxRate / 100);

      const stmt = this.db.prepare(
        `INSERT INTO portfolio_entries (grant_date, fund_name, exercise_price, quantity, amount_granted, current_value, grant_date_price, tax_amount, tax_auto_calculated, source, isin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      stmt.run([
        grantDate || null,
        fundName || null,
        exercisePrice || 0,
        quantity || 0,
        amountGranted || 0,
        currentValue && currentValue !== 'N/A' ? currentValue : 0,
        grantDatePrice,
        taxAmount || null,
        autoTax || 0,
        source,
        isin || null,
      ]);

      const lastIdStmt = this.db.prepare("SELECT last_insert_rowid() as id");
      let insertId = null;
      if (lastIdStmt.step()) {
        insertId = lastIdStmt.getAsObject().id;
      }
      stmt.free();
      lastIdStmt.free();
      this.saveDatabase();

      console.log("✅ Portfolio entry added with ID:", insertId);

      await this.rebuildCompleteEvolutionTimeline(null, grantDate);
      console.log("✅ Evolution timeline rebuilt from grant date forward");

      return Promise.resolve({ id: insertId });
    } catch (error) {
      console.error("Error adding portfolio entry:", error);
      return Promise.reject(error);
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
      const grantDatePrice = portfolioEntry.grant_date_price || 10;
      const targetValue = quantitySold * grantDatePrice * (targetPercentage / 100);
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

      // Rebuild evolution timeline from sale date forward
      // This ensures all evolution entries reflect the sale and creates proper notes
      console.log(
        `🔥 Triggering optimized evolution timeline rebuild from ${saleDate} due to sale...`
      );
      await this.rebuildCompleteEvolutionTimeline(null, saleDate);

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
    } catch (error) {
      console.error("❌ Error in recordSaleTransaction:", error);
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
  pe.source,
  pe.isin,
  pe.grant_date_price,
  -- Amount granted = remaining options × grant date price
  ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10)) as amount_granted,
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
      ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10) * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
    ELSE 
      -- When no current value, P&L = (0 - stored tax) - target value
      (0 - COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) -
      ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10) * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)
  END as profit_loss_vs_target,
  
  -- Target value = remaining options × grant date price × target percentage
  ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10) * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100) as target_total_value,
  
  -- FIXED: Return % = (Current Value - Tax) / Amount Granted × 100
  -- Tax is already proportionally reduced in database, don't apply proportional calculation again
  CASE 
    WHEN COALESCE(ph.current_value, pe.current_value, 0) > 0 AND (pe.quantity - pe.total_sold_quantity) > 0 THEN
      -- (Current total value - stored tax) / amount granted × 100
      ((((pe.quantity - pe.total_sold_quantity) * COALESCE(ph.current_value, pe.current_value, 0)) - 
        COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) /
       ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10))) * 100
    ELSE 
      CASE 
        WHEN (pe.quantity - pe.total_sold_quantity) > 0 THEN
          -- (0 - stored tax) / amount granted × 100
          (((0 - COALESCE(pe.tax_amount, pe.tax_auto_calculated, 0)) /
            ((pe.quantity - pe.total_sold_quantity) * COALESCE(pe.grant_date_price, 10))) * 100)
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
    grant_date,
    current_value,
    price_date,
    fund_name,
    ROW_NUMBER() OVER (PARTITION BY exercise_price, grant_date ORDER BY price_date DESC) as rn
  FROM price_history
) ph ON pe.exercise_price = ph.exercise_price AND pe.grant_date = ph.grant_date AND ph.rn = 1
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

      // Calculate normalized price percentage for each row
      for (const row of rows) {
        try {
          row.normalized_price_percentage = await this.calculateNormalizedPricePercentage(
            row.exercise_price,
            row.grant_date,
            row.current_value
          );
        } catch (error) {
          console.warn(`Failed to calculate normalized price for option ${row.exercise_price}:`, error.message);
          row.normalized_price_percentage = null;
        }
      }

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
  -- Profit/Loss vs Target = (Total Sale Value - Tax Deducted) - (Quantity × Grant Date Price × Target %)
  ((st.total_sale_value - st.tax_deducted) - (st.quantity_sold * COALESCE(pe.grant_date_price, 10) * (SELECT CAST(setting_value AS REAL) FROM settings WHERE setting_key = 'target_percentage')/100)) as profit_loss_vs_target
  
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
      FROM price_history
      WHERE exercise_price = ? AND grant_date = ?
      ORDER BY price_date ASC
    `);

      stmt.bind([exercisePrice, grantDate]);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      return Promise.resolve(rows);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Calculate normalized price percentage for an option
  async calculateNormalizedPricePercentage(exercisePrice, grantDate, currentValue) {
    try {
      if (!currentValue || currentValue === 0) {
        return null;
      }

      // Get price history for this option
      const priceHistory = await this.getOptionPriceHistory(exercisePrice, grantDate);

      if (!priceHistory || priceHistory.length === 0) {
        return null;
      }

      // Extract valid price values
      const priceValues = priceHistory
        .map(p => p.current_value)
        .filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);

      if (priceValues.length === 0) {
        return null;
      }

      const min = Math.min(...priceValues);
      const max = Math.max(...priceValues);

      // Handle edge case where all prices are the same
      if (min === max) {
        return null; // Position is meaningless if all prices are identical
      }

      // Calculate normalized percentage (0-100)
      const normalizedPct = ((currentValue - min) / (max - min)) * 100;

      // Round to 1 decimal place
      return Math.round(normalizedPct * 10) / 10;
    } catch (error) {
      console.warn(`Error calculating normalized price percentage:`, error.message);
      return null;
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
          description: `Added ${row.quantity} options (${row.fund_name || "Unknown Fund"
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
          description: `Sold ${row.quantity_sold} options (${row.fund_name || "Unknown Fund"
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
  // REPLACE the updatePricesFromCSV method in portfolio-db.js with this clean version:

  async updatePricesFromCSV(csvData, priceDate) {
    try {
      const today = priceDate || new Date().toISOString().split("T")[0];
      let updatedCount = 0;

      csvData.forEach((row) => {
        if (row.exercise_price && row.current_value) {
          // Single table update - no duplication!
          const priceStmt = this.db.prepare(`
          INSERT OR REPLACE INTO price_history 
          (price_date, exercise_price, current_value, high_value, low_value, grant_date, fund_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

          priceStmt.run([
            today,
            row.exercise_price,
            row.current_value,
            row.current_value, // For now, high = current
            row.current_value, // For now, low = current
            row.grant_date,
            row.fund_name,
          ]);
          priceStmt.free();

          updatedCount++;
        }
      });

      this.saveDatabase();

      // Rebuild evolution timeline from today after price update
      // This ensures all evolution entries reflect the new prices
      console.log(`🔥 Triggering evolution timeline rebuild from ${today} after price update`);
      await this.rebuildCompleteEvolutionTimeline(null, today);

      return Promise.resolve({ updatedCount });
    } catch (error) {
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
        console.log(`🔥 Triggering optimized evolution timeline rebuild from ${earliestDate} after deletion`);
        await this.rebuildCompleteEvolutionTimeline(null, earliestDate);
        console.log("✅ Evolution timeline rebuilt from earliest date forward");
      } else {
        console.log("ℹ️ No evolution entries found to recalculate");
      }
    } catch (error) {
      console.error("❌ Error in manual evolution recalculation:", error);
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
    } catch (error) {
      console.error("❌ Error in evolution consistency check:", error);
    }
  }
  // Database export functionality
  async exportDatabase() {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          schemaVersion: 3, // Updated version number
          appVersion: "0.1",
        },
        portfolioEntries: await this.getAllTableData("portfolio_entries"),
        priceHistory: await this.getAllTableData("price_history"),
        salesTransactions: await this.getAllTableData("sales_transactions"),
        portfolioEvolution: await this.getAllTableData("portfolio_evolution"),
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
        // Clear existing data - only the tables that exist
        const tables = [
          "sales_transactions",
          "portfolio_evolution",
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

      // Handle legacy imports that might have separate optionPriceHistory data
      if (
        importData.optionPriceHistory &&
        importData.optionPriceHistory.length > 0
      ) {
        console.log(
          "📥 Found legacy optionPriceHistory data, importing to price_history..."
        );
        await this.importTableData(
          "price_history",
          importData.optionPriceHistory
        );
      }

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

    try {
      // Get the actual table schema
      const schemaStmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
      const tableColumns = [];
      while (schemaStmt.step()) {
        const row = schemaStmt.getAsObject();
        tableColumns.push(row.name);
      }
      schemaStmt.free();

      console.log(`📋 Table ${tableName} columns:`, tableColumns);

      // Get columns from import data
      const sampleRow = data[0];
      const dataColumns = Object.keys(sampleRow);

      console.log(`📥 Import data columns:`, dataColumns);

      // Find columns that exist in both the table and the data
      const validColumns = dataColumns.filter((col) =>
        tableColumns.includes(col)
      );

      console.log(`✅ Valid columns for import:`, validColumns);

      // Skip columns that don't exist in the table
      const skippedColumns = dataColumns.filter(
        (col) => !tableColumns.includes(col)
      );
      if (skippedColumns.length > 0) {
        console.warn(
          `⚠️ Skipping columns not in ${tableName} table:`,
          skippedColumns
        );
      }

      if (validColumns.length === 0) {
        console.warn(
          `⚠️ No valid columns found for ${tableName}, skipping import`
        );
        return;
      }

      // Create insert statement with only valid columns
      const placeholders = validColumns.map(() => "?").join(", ");
      const insertSQL = `INSERT OR REPLACE INTO ${tableName} (${validColumns.join(", ")}) VALUES (${placeholders})`;

      console.log(`📝 Insert SQL: ${insertSQL}`);

      const stmt = this.db.prepare(insertSQL);

      // Import each row with only valid columns
      let importedCount = 0;
      data.forEach((row) => {
        try {
          const values = validColumns.map((col) => row[col]);
          stmt.run(values);
          importedCount++;
        } catch (rowError) {
          console.error(
            `❌ Error importing row to ${tableName}:`,
            rowError,
            row
          );
        }
      });

      stmt.free();
      console.log(
        `✅ Imported ${importedCount}/${data.length} rows to ${tableName}`
      );
    } catch (error) {
      console.error(`❌ Error importing data to ${tableName}:`, error);
      throw error;
    }
  }

  // Existing methods (unchanged for backward compatibility)
  async updateTaxAmount(entryId, taxAmount) {
    try {
      console.log("=== UPDATE TAX AMOUNT (sql.js) ===");
      console.log("Params:", { entryId, taxAmount });

      // Get the grant date for evolution recalculation
      const grantStmt = this.db.prepare(`
        SELECT grant_date FROM portfolio_entries WHERE id = ?
      `);
      grantStmt.bind([entryId]);
      let grantDate = null;
      if (grantStmt.step()) {
        const row = grantStmt.getAsObject();
        grantDate = row.grant_date;
      }
      grantStmt.free();

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

      // Recalculate evolution timeline from grant date (tax affects unrealized gains)
      if (grantDate) {
        console.log(`🔥 Triggering optimized evolution timeline rebuild from ${grantDate} due to tax change`);
        await this.rebuildCompleteEvolutionTimeline(null, grantDate);
      }

      this.saveDatabase();
      return Promise.resolve({ changes: 1 });
    } catch (error) {
      console.error("Error updating tax amount:", error);
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
    } catch (error) {
      console.error("❌ Error during database deletion:", error);

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
    } catch (error) {
      console.error("❌ Failed to create emergency backup:", error);
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
    } catch (error) {
      console.error("❌ Enhanced database deletion failed:", error);
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

      // Rebuild evolution timeline from the grant date forward
      // When deleting a grant, we need to recalculate from when it was originally added
      console.log(`🔥 Triggering optimized evolution timeline rebuild from ${entryToDelete.grant_date} after deletion`);
      await this.rebuildCompleteEvolutionTimeline(null, entryToDelete.grant_date);
      console.log("✅ Evolution timeline recalculated from grant date after deletion");

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
          AND ph2.grant_date = price_history.grant_date
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
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
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

  // Store historical prices in price_history table (INSERT OR REPLACE to avoid duplicates)
  async storeHistoricalPrices(fundName, exercisePrice, grantDate, priceHistory) {
    try {
      const validPrices = priceHistory.filter(p => p.price > 0);
      const filteredCount = priceHistory.length - validPrices.length;

      if (filteredCount > 0) {
        console.log(`💾 Storing ${validPrices.length} historical prices for ${fundName} (filtered out ${filteredCount} zero prices)`);
      } else {
        console.log(`💾 Storing ${validPrices.length} historical prices for ${fundName}`);
      }

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO price_history
        (fund_name, exercise_price, grant_date, price_date, current_value)
        VALUES (?, ?, ?, ?, ?)
      `);

      let insertCount = 0;

      for (const priceEntry of validPrices) {
        stmt.run([
          fundName,
          exercisePrice,
          grantDate,
          priceEntry.date,
          priceEntry.price
        ]);
        insertCount++;
      }

      stmt.free();
      this.saveDatabase();

      console.log(`✅ Successfully stored ${insertCount} historical prices`);

      return {
        success: true,
        stored: insertCount,
        fundName: fundName,
        exercisePrice: exercisePrice,
        grantDate: grantDate
      };

    } catch (error) {
      console.error('❌ Error storing historical prices:', error);
      throw error;
    }
  }

  /**
   * Helper method to get portfolio state for a single date (loads data and calls optimized method)
   */
  async getPortfolioStateOptimized(date) {
    try {
      // Load all necessary data once
      const portfolioEntries = [];
      const portfolioStmt = this.db.prepare('SELECT * FROM portfolio_entries');
      while (portfolioStmt.step()) {
        portfolioEntries.push(portfolioStmt.getAsObject());
      }
      portfolioStmt.free();

      const allSales = [];
      const salesStmt = this.db.prepare('SELECT * FROM sales_transactions ORDER BY sale_date');
      while (salesStmt.step()) {
        allSales.push(salesStmt.getAsObject());
      }
      salesStmt.free();

      const allPrices = [];
      const priceStmt = this.db.prepare('SELECT * FROM price_history ORDER BY price_date');
      while (priceStmt.step()) {
        allPrices.push(priceStmt.getAsObject());
      }
      priceStmt.free();

      const targetPercentage = parseFloat(await this.getSetting('target_percentage') || '65');

      return this.calculatePortfolioStateOptimized(date, portfolioEntries, allSales, allPrices, targetPercentage);
    } catch (error) {
      console.error(`❌ Error getting optimized portfolio state for ${date}:`, error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Calculate portfolio state using pre-loaded data (no database queries)
   * This is much faster than the original method that made queries for each date
   */
  calculatePortfolioStateOptimized(date, portfolioEntries, allSales, allPrices, targetPercentage) {
    // Calculate sales up to this date
    const salesByEntry = {};
    allSales.forEach(sale => {
      if (sale.sale_date <= date) {
        const entryId = sale.portfolio_entry_id;
        if (!salesByEntry[entryId]) {
          salesByEntry[entryId] = { total_sold: 0, total_sale_value: 0, total_realized_gain: 0 };
        }
        salesByEntry[entryId].total_sold += sale.quantity_sold;
        salesByEntry[entryId].total_sale_value += sale.total_sale_value;
        salesByEntry[entryId].total_realized_gain += sale.realized_gain_loss;
      }
    });

    // Get prices as of this date
    const pricesByKey = {};
    allPrices.forEach(price => {
      if (price.price_date <= date) {
        const key = `${price.exercise_price}-${price.grant_date}`;
        if (!pricesByKey[key]) {
          pricesByKey[key] = price.current_value;
        }
      }
    });

    // Calculate portfolio totals
    let totalCurrentValue = 0;
    let totalRealizedGain = 0;
    let totalUnrealizedGain = 0;
    let totalOptionsCount = 0;
    let activeOptionsCount = 0;

    for (const portfolioEntry of portfolioEntries) {
      // Only include grants that existed by this date
      if (portfolioEntry.grant_date > date) continue;

      const salesForEntry = salesByEntry[portfolioEntry.id];
      const soldQuantity = salesForEntry ? salesForEntry.total_sold : 0;
      const remainingQuantity = portfolioEntry.quantity - soldQuantity;

      // Add to totals
      totalOptionsCount += portfolioEntry.quantity;
      activeOptionsCount += remainingQuantity;

      // Add realized gains from sales
      if (salesForEntry) {
        totalRealizedGain += salesForEntry.total_realized_gain || 0;
      }

      // Calculate current value using price as of this date
      const priceKey = `${portfolioEntry.exercise_price}-${portfolioEntry.grant_date}`;
      const currentPrice = pricesByKey[priceKey] || portfolioEntry.current_value || 0;
      const currentEntryValue = remainingQuantity * currentPrice;

      totalCurrentValue += currentEntryValue;

      // Calculate unrealized gain
      const grantDatePrice = portfolioEntry.grant_date_price || 10;
      const targetValue = remainingQuantity * grantDatePrice * (targetPercentage / 100);
      const taxRatio = remainingQuantity / portfolioEntry.quantity;
      const entryTax = (portfolioEntry.tax_amount || portfolioEntry.tax_auto_calculated || 0) * taxRatio;
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
  }

  // Completely rebuild the evolution table with historical data
  async rebuildCompleteEvolutionTimeline(onProgress = null, fromDate = null) {
    try {
      // Reset progress tracking
      this._lastReportedPercentage = 0;

      if (fromDate) {
        console.log(`🚀 OPTIMIZED: Rebuilding evolution timeline from ${fromDate} forward...`);

        // Step 1: Delete only evolution data from the specified date forward
        console.log(`🗑️ Clearing evolution data from ${fromDate} forward...`);
        const deleteStmt = this.db.prepare('DELETE FROM portfolio_evolution WHERE snapshot_date >= ?');
        deleteStmt.bind([fromDate]);
        deleteStmt.step();
        deleteStmt.free();
      } else {
        console.log('🔥 Completely rebuilding daily evolution timeline with historical data...');

        // Step 1: Drop and recreate the entire evolution table
        console.log('🗑️ Clearing existing evolution data...');
        this.db.exec('DELETE FROM portfolio_evolution');
      }

      // Step 2: Get the date range
      const dateRange = await this.getPortfolioDateRange();
      if (!dateRange.firstGrantDate) {
        console.log('ℹ️ No grants found, nothing to rebuild');
        return;
      }

      // Determine the actual start date for rebuild
      const startDate = fromDate || dateRange.firstGrantDate;
      const endDate = dateRange.endDate;

      console.log(`📅 Building daily evolution from ${startDate} to ${endDate}`);

      // Step 3: Get all significant events for notes
      const significantEvents = await this.getAllSignificantEvents();

      // Step 4: Generate dates from start date to today
      const allDates = this.generateDateRange(startDate, endDate);
      console.log(`📊 Processing ${allDates.length} daily entries...`);

      // Performance warning for large date ranges
      if (allDates.length > 365) {
        console.log(`⚠️ Large date range detected (${allDates.length} days). This may take several minutes...`);
      }

      // Step 5: OPTIMIZED - Pre-load all data once and process in memory
      console.log('🚀 PERFORMANCE OPTIMIZATION: Pre-loading all portfolio data...');

      // Pre-load all portfolio entries
      const portfolioStmt = this.db.prepare('SELECT * FROM portfolio_entries');
      const portfolioEntries = [];
      while (portfolioStmt.step()) {
        portfolioEntries.push(portfolioStmt.getAsObject());
      }
      portfolioStmt.free();

      // Pre-load all sales
      const salesStmt = this.db.prepare('SELECT * FROM sales_transactions ORDER BY sale_date ASC');
      const allSales = [];
      while (salesStmt.step()) {
        allSales.push(salesStmt.getAsObject());
      }
      salesStmt.free();

      // Pre-load all historical prices
      const pricesStmt = this.db.prepare('SELECT * FROM price_history ORDER BY price_date DESC');
      const allPrices = [];
      while (pricesStmt.step()) {
        allPrices.push(pricesStmt.getAsObject());
      }
      pricesStmt.free();

      // Get target percentage once
      const targetPercentageQuery = await this.getSetting("target_percentage");
      const targetPercentage = parseFloat(targetPercentageQuery || "65");

      console.log(`📊 Pre-loaded: ${portfolioEntries.length} entries, ${allSales.length} sales, ${allPrices.length} prices`);

      // Create evolution entries only when portfolio value changes
      let processedCount = 0;
      let insertedCount = 0;
      let previousPortfolioValue = null;

      const insertStmt = this.db.prepare(`
        INSERT INTO portfolio_evolution 
        (snapshot_date, total_portfolio_value, total_unrealized_gain, total_realized_gain, total_options_count, active_options_count, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const date of allDates) {
        // OPTIMIZED: Calculate portfolio state using pre-loaded data
        const portfolioState = this.calculatePortfolioStateOptimized(
          date, portfolioEntries, allSales, allPrices, targetPercentage
        );
        const currentValue = portfolioState.totalCurrentValue || 0;

        // Get events for this specific date
        const dayEvents = significantEvents.get(date) || [];
        const notes = dayEvents.length > 0 ? dayEvents.map(event => `• ${event}`).join('\n') : '';
        const hasEvents = dayEvents.length > 0;

        // Check if we should insert this entry
        const valueChanged = previousPortfolioValue === null || Math.abs(currentValue - previousPortfolioValue) > 0.01;
        const shouldInsert = valueChanged || hasEvents;

        if (shouldInsert) {
          // Insert evolution entry (using correct bind/step pattern)
          insertStmt.bind([
            date,
            currentValue,
            portfolioState.totalUnrealizedGain || 0,
            portfolioState.totalRealizedGain || 0,
            portfolioState.totalOptionsCount || 0,
            portfolioState.activeOptionsCount || 0,
            notes
          ]);
          insertStmt.step();

          insertedCount++;
          previousPortfolioValue = currentValue;

          if (hasEvents) {
            console.log(`📅 Added evolution entry for ${date}: ${dayEvents.length} events, value €${currentValue.toFixed(2)}`);
          }
        } else {
          // Skip this entry - no change in value
          if (processedCount % 50 === 0) {
            console.log(`⏭️ Skipped ${date}: no value change (€${currentValue.toFixed(2)})`);
          }
        }

        processedCount++;

        // Log progress more frequently for large datasets
        const progressInterval = allDates.length > 365 ? 30 : 50;
        if (processedCount % progressInterval === 0 || processedCount === allDates.length) {
          const percentage = Math.round((processedCount / allDates.length) * 100);
          console.log(`📊 Processed ${processedCount}/${allDates.length} days (${percentage}%) - inserted ${insertedCount} entries`);

          // Send progress update to UI only every 10% to avoid overwhelming the UI
          if (onProgress) {
            const lastPercentage = this._lastReportedPercentage || 0;
            if (percentage >= lastPercentage + 10 || processedCount === allDates.length) {
              onProgress({
                text: `Processing evolution data: ${processedCount}/${allDates.length} days`,
                percentage: percentage
              });
              this._lastReportedPercentage = percentage;
            }
          }
        }
      }

      insertStmt.free();

      this.saveDatabase();
      console.log(`✅ Evolution timeline optimized: ${insertedCount} entries created from ${processedCount} days processed`);
      console.log(`📊 Efficiency: ${Math.round((insertedCount / processedCount) * 100)}% of days had value changes`);

    } catch (error) {
      console.error('❌ Error rebuilding evolution timeline:', error);
      throw error;
    }
  }

  // Get the portfolio date range (first grant to today)
  async getPortfolioDateRange() {
    try {
      // Get first grant date
      const firstGrantStmt = this.db.prepare(`
        SELECT MIN(grant_date) as first_grant_date 
        FROM portfolio_entries
      `);

      let firstGrantDate = null;
      if (firstGrantStmt.step()) {
        const result = firstGrantStmt.getAsObject();
        firstGrantDate = result.first_grant_date;
      }
      firstGrantStmt.free();

      // End date is today
      const today = new Date().toISOString().split('T')[0];

      return {
        firstGrantDate: firstGrantDate,
        endDate: today
      };

    } catch (error) {
      console.error('❌ Error getting portfolio date range:', error);
      throw error;
    }
  }

  // Get all significant events mapped by date
  async getAllSignificantEvents() {
    try {
      const eventsByDate = new Map();

      // Get all grant events
      const grantStmt = this.db.prepare(`
        SELECT grant_date, 
               SUM(quantity) as total_quantity,
               GROUP_CONCAT(fund_name || ' (' || quantity || ')') as grants_summary
        FROM portfolio_entries 
        GROUP BY grant_date 
        ORDER BY grant_date ASC
      `);

      while (grantStmt.step()) {
        const grant = grantStmt.getAsObject();
        const date = grant.grant_date;

        if (!eventsByDate.has(date)) {
          eventsByDate.set(date, []);
        }

        eventsByDate.get(date).push(
          `Grant received: ${grant.total_quantity} options (${grant.grants_summary})`
        );
      }
      grantStmt.free();

      // Get all sales events
      const salesStmt = this.db.prepare(`
        SELECT sale_date,
               SUM(quantity_sold) as total_sold,
               AVG(sale_price) as avg_price,
               COUNT(*) as sale_count
        FROM sales_transactions 
        GROUP BY sale_date 
        ORDER BY sale_date ASC
      `);

      while (salesStmt.step()) {
        const sale = salesStmt.getAsObject();
        const date = sale.sale_date;

        if (!eventsByDate.has(date)) {
          eventsByDate.set(date, []);
        }

        if (sale.sale_count === 1) {
          eventsByDate.get(date).push(
            `Sale: ${sale.total_sold} options at €${sale.avg_price.toFixed(2)}`
          );
        } else {
          eventsByDate.get(date).push(
            `Sales: ${sale.total_sold} options (${sale.sale_count} transactions, avg €${sale.avg_price.toFixed(2)})`
          );
        }
      }
      salesStmt.free();

      return eventsByDate;

    } catch (error) {
      console.error('❌ Error getting significant events:', error);
      throw error;
    }
  }

  // Generate array of all dates between start and end (inclusive)
  // async getAllGrantsNeedingUpdate() {
  //   const today = new Date().toISOString().split('T')[0];
  //   const stmt = this.db.prepare(`
  //     SELECT p.* FROM portfolio_entries p
  //     WHERE NOT EXISTS (
  //       SELECT 1 FROM price_history ph
  //       WHERE ph.exercise_price = p.exercise_price
  //       AND ph.grant_date = p.grant_date
  //       AND ph.price_date = ?
  //     )
  //   `);
  //   const grants = [];
  //   stmt.bind([today]);
  //   while (stmt.step()) {
  //     grants.push(stmt.getAsObject());
  //   }
  //   stmt.free();
  //   return grants;
  // }

  // Store a single price update for a specific grant
  async storePriceUpdate(grantId, price, timestamp) {
    try {
      if (!grantId || isNaN(price)) {
        throw new Error(`Invalid price update: grantId=${grantId}, price=${price}`);
      }

      // Normalize timestamps
      const priceDate = new Date(timestamp).toISOString().split("T")[0];
      const scrapedAt = new Date().toISOString().replace("T", " ").split(".")[0];
      // e.g. "2025-09-15 17:52:31"

      // 1. Fetch static info about the grant
      const stmt = this.db.prepare(`
      SELECT exercise_price, grant_date, fund_name
      FROM portfolio_entries
      WHERE id = :id
      LIMIT 1;
    `);

      stmt.bind({ ":id": grantId });
      let grantInfo = null;
      while (stmt.step()) {
        const row = stmt.getAsObject();
        grantInfo = row;
      }
      stmt.free();

      if (!grantInfo) {
        throw new Error(`Grant ${grantId} not found in portfolio_entries`);
      }

      // 2. Insert into price_history
      const insert = this.db.prepare(`
      INSERT OR REPLACE INTO price_history (
        price_date,
        exercise_price,
        current_value,
        grant_date,
        fund_name,
        scraped_at,
        portfolio_entry_id
      )
      VALUES (:price_date, :exercise_price, :current_value, :grant_date, :fund_name, :scraped_at, :portfolio_entry_id);
    `);

      insert.run({
        ":price_date": priceDate,
        ":exercise_price": grantInfo.exercise_price,
        ":current_value": price,
        ":grant_date": grantInfo.grant_date,
        ":fund_name": grantInfo.fund_name,
        ":scraped_at": scrapedAt,
        ":portfolio_entry_id": grantId
      });
      insert.free();

      // 3. Update portfolio_entries with latest current_value
      this.db.exec(`
      UPDATE portfolio_entries
      SET current_value = ${price}
      WHERE id = ${grantId};
    `);

      console.log(`💾 Stored price update for grant ${grantId}: ${price} on ${priceDate}, scraped at ${scrapedAt}`);
      return true;
    } catch (err) {
      console.error("❌ storePriceUpdate failed:", err);
      return false;
    }
  }


  async getAllGrantsNeedingUpdate() {
    const today = new Date().toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      SELECT * FROM portfolio_entries
      WHERE (quantity - total_sold_quantity) > 0
      AND id NOT IN (
        SELECT portfolio_entry_id
        FROM price_history
        WHERE price_date = ?
      )
    `);
    const grants = [];
    stmt.bind([today]);
    while (stmt.step()) {
      grants.push(stmt.getAsObject());
    }
    stmt.free();
    return grants;
  }

  generateDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Make sure we're working with valid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('❌ Invalid date range:', { startDate, endDate });
      return [];
    }

    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Get all significant dates (grants, sales, deletions) in chronological order
  async getAllSignificantDates() {
    try {
      const significantDates = new Map();

      // Get all grant dates with details
      const grantStmt = this.db.prepare(`
        SELECT grant_date, 
               SUM(quantity) as total_quantity,
               GROUP_CONCAT(fund_name || ' (' || quantity || ')') as grants_summary
        FROM portfolio_entries 
        GROUP BY grant_date 
        ORDER BY grant_date ASC
      `);

      while (grantStmt.step()) {
        const grant = grantStmt.getAsObject();
        const date = grant.grant_date;

        if (!significantDates.has(date)) {
          significantDates.set(date, { date, events: [] });
        }

        significantDates.get(date).events.push(
          `Grant received: ${grant.total_quantity} options (${grant.grants_summary})`
        );
      }
      grantStmt.free();

      // Get all sales dates with details
      const salesStmt = this.db.prepare(`
        SELECT sale_date,
               SUM(quantity_sold) as total_sold,
               AVG(sale_price) as avg_price,
               COUNT(*) as sale_count
        FROM sales_transactions 
        GROUP BY sale_date 
        ORDER BY sale_date ASC
      `);

      while (salesStmt.step()) {
        const sale = salesStmt.getAsObject();
        const date = sale.sale_date;

        if (!significantDates.has(date)) {
          significantDates.set(date, { date, events: [] });
        }

        if (sale.sale_count === 1) {
          significantDates.get(date).events.push(
            `Sale: ${sale.total_sold} options at €${sale.avg_price.toFixed(2)}`
          );
        } else {
          significantDates.get(date).events.push(
            `Sales: ${sale.total_sold} options (${sale.sale_count} transactions, avg €${sale.avg_price.toFixed(2)})`
          );
        }
      }
      salesStmt.free();

      // Convert map to array and sort by date
      const sortedDates = Array.from(significantDates.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return sortedDates;

    } catch (error) {
      console.error('❌ Error getting significant dates:', error);
      throw error;
    }
  }

  // Get historical prices for a specific option (grant date + exercise price)
  async getHistoricalPricesForOption(grantDate, exercisePrice) {
    try {
      console.log(`🔍 Querying historical prices for grant date: ${grantDate}, exercise price: €${exercisePrice}`);

      const stmt = this.db.prepare(`
        SELECT price_date, current_value 
        FROM price_history 
        WHERE grant_date = ? AND ABS(exercise_price - ?) < 0.01
        ORDER BY price_date DESC
      `);

      const prices = [];
      stmt.bind([grantDate, exercisePrice]);

      while (stmt.step()) {
        prices.push(stmt.getAsObject());
      }

      stmt.free();

      console.log(`✅ Found ${prices.length} historical price entries for this option`);
      return prices;

    } catch (error) {
      console.error('❌ Error getting historical prices for option:', error);
      throw error;
    }
  }
}

module.exports = PortfolioDatabase;
