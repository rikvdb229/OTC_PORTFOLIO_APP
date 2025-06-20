// migrate-database.js - Migrate database from current directory to user directory
const fs = require("fs");
const path = require("path");
const os = require("os");

class DatabaseMigrator {
  constructor() {
    this.currentDbPath = path.join(process.cwd(), "portfolio.db");
    this.userDbDir = path.join(
      os.homedir(),
      "AppData",
      "Local",
      "OTCPortfolioApp"
    );
    this.userDbPath = path.join(this.userDbDir, "portfolio.db");
  }

  async migrate() {
    console.log("🔄 DATABASE MIGRATION TOOL");
    console.log("==========================\n");

    console.log("📍 Source (current directory):", this.currentDbPath);
    console.log("📍 Destination (user directory):", this.userDbPath);
    console.log("");

    // Check if source database exists
    if (!fs.existsSync(this.currentDbPath)) {
      console.log("❌ No database found in current directory");
      console.log("   Nothing to migrate");
      return;
    }

    // Get source database info
    const sourceStats = fs.statSync(this.currentDbPath);
    console.log(
      `📊 Source database: ${Math.round(sourceStats.size / 1024)} KB`
    );
    console.log(`📅 Last modified: ${sourceStats.mtime.toISOString()}`);
    console.log("");

    // Check if destination already exists
    if (fs.existsSync(this.userDbPath)) {
      const destStats = fs.statSync(this.userDbPath);
      console.log(`⚠️  Destination database already exists!`);
      console.log(`📊 Destination: ${Math.round(destStats.size / 1024)} KB`);
      console.log(`📅 Last modified: ${destStats.mtime.toISOString()}`);

      // Compare modification times
      if (destStats.mtime > sourceStats.mtime) {
        console.log("");
        console.log("🛑 Destination database is newer than source!");
        console.log("   Migration aborted to prevent data loss");
        console.log("   Manual review recommended");
        return;
      }

      // Create backup of destination
      const backupPath = `${this.userDbPath}.backup.${Date.now()}`;
      try {
        fs.copyFileSync(this.userDbPath, backupPath);
        console.log(`📦 Created backup: ${path.basename(backupPath)}`);
      } catch (backupError) {
        console.log(`❌ Could not create backup: ${backupError.message}`);
        return;
      }
    }

    // Ensure destination directory exists
    try {
      if (!fs.existsSync(this.userDbDir)) {
        fs.mkdirSync(this.userDbDir, { recursive: true });
        console.log(`📁 Created destination directory`);
      }
    } catch (dirError) {
      console.log(
        `❌ Could not create destination directory: ${dirError.message}`
      );
      return;
    }

    // Perform migration
    try {
      console.log("🚀 Starting migration...");
      fs.copyFileSync(this.currentDbPath, this.userDbPath);

      // Verify migration
      const newStats = fs.statSync(this.userDbPath);
      if (newStats.size === sourceStats.size) {
        console.log("✅ Migration completed successfully!");
        console.log(`📊 Migrated: ${Math.round(newStats.size / 1024)} KB`);

        // Offer to remove source
        console.log("");
        console.log("🗑️  Source database can now be safely removed");
        console.log(`   Location: ${this.currentDbPath}`);
        console.log("   (The app will now use the user directory location)");
      } else {
        console.log("❌ Migration verification failed!");
        console.log("   File sizes do not match");
      }
    } catch (copyError) {
      console.log(`❌ Migration failed: ${copyError.message}`);
    }
  }

  async checkMigrationNeeded() {
    const currentExists = fs.existsSync(this.currentDbPath);
    const userExists = fs.existsSync(this.userDbPath);

    console.log("🔍 MIGRATION STATUS CHECK");
    console.log("=========================\n");

    console.log(
      `📁 Current directory database: ${currentExists ? "EXISTS" : "NOT FOUND"}`
    );
    console.log(
      `📁 User directory database: ${userExists ? "EXISTS" : "NOT FOUND"}`
    );
    console.log("");

    if (!currentExists && !userExists) {
      console.log("📝 Status: New installation - no migration needed");
    } else if (!currentExists && userExists) {
      console.log(
        "✅ Status: Already using user directory - no migration needed"
      );
    } else if (currentExists && !userExists) {
      console.log("🔄 Status: Migration recommended");
      console.log("💡 Run: node migrate-database.js migrate");
    } else {
      console.log("⚠️  Status: Both databases exist - manual review needed");

      const currentStats = fs.statSync(this.currentDbPath);
      const userStats = fs.statSync(this.userDbPath);

      console.log("");
      console.log("Current directory database:");
      console.log(`   Size: ${Math.round(currentStats.size / 1024)} KB`);
      console.log(`   Modified: ${currentStats.mtime.toISOString()}`);

      console.log("User directory database:");
      console.log(`   Size: ${Math.round(userStats.size / 1024)} KB`);
      console.log(`   Modified: ${userStats.mtime.toISOString()}`);

      if (userStats.mtime > currentStats.mtime) {
        console.log("");
        console.log("💡 Recommendation: User directory database is newer");
        console.log("   The app will use the user directory version");
      } else {
        console.log("");
        console.log("💡 Recommendation: Current directory database is newer");
        console.log("   Consider running migration to update user directory");
      }
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const migrator = new DatabaseMigrator();

if (args.includes("migrate")) {
  migrator.migrate().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
} else {
  migrator.checkMigrationNeeded().catch((error) => {
    console.error("Check failed:", error);
    process.exit(1);
  });
}
