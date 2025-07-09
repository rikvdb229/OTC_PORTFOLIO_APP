// debug-build.js - Debug and rebuild portable app with enhanced logging
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class DebugBuilder {
  constructor() {
    this.projectRoot = process.cwd();
    this.distDir = path.join(this.projectRoot, "dist");
  }

  async run() {
    console.log("🔧 DEBUG BUILD FOR PORTABLE DATABASE ISSUE");
    console.log("==========================================\n");

    try {
      await this.replacePortfolioDbWithDebugVersion();
      await this.cleanAndRebuild();
      await this.findAndTestPortableExecutable();
      await this.provideTroubleshootingSteps();
    } catch (error) {
      console.error("💥 Debug build failed:", error.message);
      process.exit(1);
    }
  }

  async replacePortfolioDbWithDebugVersion() {
    console.log("📝 Step 1: Installing debug version of portfolio-db.js...\n");

    const dbPath = path.join(this.projectRoot, "portfolio-db.js");

    // Backup current version
    if (fs.existsSync(dbPath)) {
      const backupPath = dbPath + ".backup-" + Date.now();
      fs.copyFileSync(dbPath, backupPath);
      console.log(
        `📦 Backed up current portfolio-db.js to: ${path.basename(backupPath)}`
      );
    }

    console.log("✅ Debug version should be copied manually");
    console.log(
      "   The debug version includes enhanced logging to track exactly what happens"
    );
    console.log("   during database initialization.\n");
  }

  async cleanAndRebuild() {
    console.log("🔨 Step 2: Clean rebuild of portable version...\n");

    try {
      // Clean dist directory
      if (fs.existsSync(this.distDir)) {
        console.log("🧹 Cleaning dist directory...");
        fs.rmSync(this.distDir, { recursive: true, force: true });
        console.log("✅ Dist directory cleaned");
      }

      // Clean node_modules if needed
      const nodeModules = path.join(this.projectRoot, "node_modules");
      if (process.argv.includes("--full-clean") && fs.existsSync(nodeModules)) {
        console.log("🧹 Full clean: removing node_modules...");
        fs.rmSync(nodeModules, { recursive: true, force: true });
        console.log("📦 Reinstalling dependencies...");
        execSync("npm install", { stdio: "inherit", cwd: this.projectRoot });
        console.log("✅ Dependencies reinstalled");
      }

      // Build portable version
      console.log("🔨 Building portable version with debug logging...");
      execSync("npm run build-portable", {
        stdio: "inherit",
        cwd: this.projectRoot,
      });
      console.log("✅ Portable build completed\n");
    } catch (buildError) {
      console.error("❌ Build failed:", buildError.message);
      throw buildError;
    }
  }

  async findAndTestPortableExecutable() {
    console.log("🔍 Step 3: Finding and testing portable executable...\n");

    // Find the portable executable
    const portableExe = this.findPortableExecutable();

    if (!portableExe) {
      console.log("❌ No portable executable found in dist directory");
      console.log("   Check build output above for errors");
      return;
    }

    console.log(`✅ Found portable executable: ${path.basename(portableExe)}`);

    // Check file size
    const stats = fs.statSync(portableExe);
    const sizeMB = Math.round(stats.size / 1024 / 1024);
    console.log(`📊 File size: ${sizeMB} MB`);

    if (sizeMB < 100) {
      console.log(
        "⚠️ WARNING: File size seems small - Chromium bundling may have failed"
      );
    } else {
      console.log("✅ File size looks good - likely includes Chromium");
    }

    // Create test scenario
    await this.createTestScenario(portableExe);
  }

  findPortableExecutable() {
    try {
      const files = fs.readdirSync(this.distDir, { recursive: true });

      for (const file of files) {
        if (
          typeof file === "string" &&
          file.endsWith(".exe") &&
          file.includes("portable")
        ) {
          return path.join(this.distDir, file);
        }
      }

      // Also check subdirectories
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            const result = walkDir(fullPath);
            if (result) return result;
          } else if (item.endsWith(".exe") && item.includes("portable")) {
            return fullPath;
          }
        }
        return null;
      };

      return walkDir(this.distDir);
    } catch (error) {
      console.log("❌ Error finding portable executable:", error.message);
      return null;
    }
  }

  async createTestScenario(portableExePath) {
    console.log("🧪 Step 4: Creating test scenario...\n");

    // Create test directory
    const testDir = path.join(this.projectRoot, "test-portable-" + Date.now());
    fs.mkdirSync(testDir);
    console.log(`📁 Created test directory: ${testDir}`);

    // Copy portable executable to test directory
    const testExePath = path.join(testDir, path.basename(portableExePath));
    fs.copyFileSync(portableExePath, testExePath);
    console.log(`📋 Copied executable to: ${testExePath}`);

    // Create test batch file
    const batchContent = `@echo off
echo =====================================
echo PORTABLE DATABASE DEBUG TEST
echo =====================================
echo.
echo Starting Portfolio Tracker in debug mode...
echo Look for detailed database initialization logs.
echo.
echo Press any key to start the application...
pause > nul
echo.
echo Starting application...
"${path.basename(portableExePath)}"
echo.
echo Application closed. Press any key to exit...
pause > nul
`;

    const batchPath = path.join(testDir, "test-portable-db.bat");
    fs.writeFileSync(batchPath, batchContent);
    console.log(`📝 Created test batch file: test-portable-db.bat`);

    console.log("\n✅ Test scenario ready!");
    console.log(`📁 Test directory: ${testDir}`);
    console.log("\n🧪 TO TEST:");
    console.log(`1. Navigate to: ${testDir}`);
    console.log("2. Run: test-portable-db.bat");
    console.log("3. Watch the console output for detailed database logs");
    console.log(
      "4. Look for messages about database creation and write permissions\n"
    );
  }

  async provideTroubleshootingSteps() {
    console.log("🔍 Step 5: Troubleshooting Guide\n");

    console.log("📋 WHAT TO LOOK FOR IN THE DEBUG OUTPUT:");
    console.log("");
    console.log("✅ SUCCESS INDICATORS:");
    console.log('   • "✅ PORTABLE: Using executable directory"');
    console.log('   • "✅ Write permissions confirmed"');
    console.log('   • "✅ Database saved successfully"');
    console.log('   • "✅ Database initialization completed successfully"');
    console.log("");
    console.log("❌ FAILURE INDICATORS:");
    console.log('   • "❌ Write permission test failed"');
    console.log('   • "⚠️ Executable directory failed"');
    console.log('   • "💥 CRITICAL: Database directory setup failed"');
    console.log('   • "❌ Failed to save database"');
    console.log("");
    console.log("🔧 COMMON ISSUES AND SOLUTIONS:");
    console.log("");
    console.log(
      'Issue: "Write permission test failed for executable directory"'
    );
    console.log(
      "Solution: Run the app from a writable location (Desktop, Documents)"
    );
    console.log("");
    console.log('Issue: "Portable detection result: NOT PORTABLE"');
    console.log('Solution: Check if executable name contains "portable"');
    console.log("");
    console.log('Issue: "Database file was not created"');
    console.log("Solution: Check antivirus software blocking file creation");
    console.log("");
    console.log("Issue: App works but no database persists");
    console.log("Solution: Database might be created in fallback location");
    console.log("");
    console.log("🛠️ DEBUGGING COMMANDS:");
    console.log("");
    console.log("After running the test, you can also:");
    console.log("• Check if portfolio.db was created next to the .exe");
    console.log(
      "• Look for portfolio.db in Documents/PortfolioTracker-Portable"
    );
    console.log("• Check for debug log files in the app directory");
    console.log("• Run the app from different locations to test portability");
  }
}

// CLI interface
if (require.main === module) {
  const builder = new DebugBuilder();

  if (process.argv.includes("--help")) {
    console.log("Debug Build Script for Portfolio Tracker");
    console.log("");
    console.log("Usage:");
    console.log("  node debug-build.js               Normal debug build");
    console.log(
      "  node debug-build.js --full-clean  Clean node_modules and rebuild"
    );
    console.log("  node debug-build.js --help        Show this help");
    console.log("");
    process.exit(0);
  }

  builder.run().catch((error) => {
    console.error("💥 Fatal error:", error.message);
    process.exit(1);
  });
}

module.exports = DebugBuilder;
