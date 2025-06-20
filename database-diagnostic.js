// database-diagnostic.js - Diagnose and fix Windows database permission issues
const fs = require("fs");
const path = require("path");
const os = require("os");

class DatabaseDiagnostic {
  constructor() {
    this.results = {
      issues: [],
      recommendations: [],
      locations: [],
    };
  }

  async runDiagnostics() {
    console.log("🔍 DATABASE PERMISSIONS DIAGNOSTIC");
    console.log("==================================\n");

    // Test all possible database locations
    await this.testDatabaseLocations();

    // Check current working directory issues
    await this.checkCurrentDirectoryIssues();

    // Test file permissions
    await this.testFilePermissions();

    // Check Windows-specific issues
    if (process.platform === "win32") {
      await this.checkWindowsSpecificIssues();
    }

    // Generate recommendations
    this.generateRecommendations();

    // Display results
    this.displayResults();
  }

  async testDatabaseLocations() {
    console.log("📍 Testing database location options...\n");

    const locations = [
      {
        name: "Current Directory",
        path: path.join(process.cwd(), "portfolio.db"),
        description: "Same folder as the app (may need admin rights)",
      },
      {
        name: "User AppData Local",
        path: path.join(
          os.homedir(),
          "AppData",
          "Local",
          "OTCPortfolioApp",
          "portfolio.db"
        ),
        description: "Windows user-specific folder (recommended)",
      },
      {
        name: "User Documents",
        path: path.join(
          os.homedir(),
          "Documents",
          "OTCPortfolioApp",
          "portfolio.db"
        ),
        description: "User Documents folder (user-accessible)",
      },
      {
        name: "User Home",
        path: path.join(os.homedir(), ".otc-portfolio", "portfolio.db"),
        description: "Hidden folder in user home",
      },
      {
        name: "Temp Directory",
        path: path.join(os.tmpdir(), "OTCPortfolioApp", "portfolio.db"),
        description: "Temporary files (always writable, but may be cleared)",
      },
    ];

    for (const location of locations) {
      const result = await this.testLocation(location);
      this.results.locations.push(result);

      console.log(`📁 ${location.name}`);
      console.log(`   Path: ${location.path}`);
      console.log(`   Description: ${location.description}`);
      console.log(`   Directory Exists: ${result.directoryExists}`);
      console.log(`   Can Create Directory: ${result.canCreateDirectory}`);
      console.log(`   Can Write File: ${result.canWriteFile}`);
      console.log(`   Can Read File: ${result.canReadFile}`);
      console.log(`   Status: ${result.status}\n`);
    }
  }

  async testLocation(location) {
    const result = {
      ...location,
      directoryExists: false,
      canCreateDirectory: false,
      canWriteFile: false,
      canReadFile: false,
      status: "FAILED",
    };

    const directory = path.dirname(location.path);

    try {
      // Check if directory exists
      result.directoryExists = fs.existsSync(directory);

      // Try to create directory if it doesn't exist
      if (!result.directoryExists) {
        try {
          fs.mkdirSync(directory, { recursive: true });
          result.canCreateDirectory = true;
          result.directoryExists = true;
        } catch (createError) {
          result.canCreateDirectory = false;
        }
      } else {
        result.canCreateDirectory = true;
      }

      // Test write permissions
      if (result.directoryExists) {
        try {
          const testContent = "test-" + Date.now();
          fs.writeFileSync(location.path, testContent);
          result.canWriteFile = true;

          // Test read permissions
          try {
            const readContent = fs.readFileSync(location.path, "utf8");
            result.canReadFile = readContent === testContent;

            // Clean up test file
            fs.unlinkSync(location.path);
          } catch (readError) {
            result.canReadFile = false;
          }
        } catch (writeError) {
          result.canWriteFile = false;
        }
      }

      // Determine overall status
      if (
        result.canCreateDirectory &&
        result.canWriteFile &&
        result.canReadFile
      ) {
        result.status = "EXCELLENT";
      } else if (result.canWriteFile && result.canReadFile) {
        result.status = "GOOD";
      } else if (result.directoryExists) {
        result.status = "LIMITED";
      } else {
        result.status = "FAILED";
      }
    } catch (error) {
      result.error = error.message;
      result.status = "ERROR";
    }

    return result;
  }

  async checkCurrentDirectoryIssues() {
    console.log("🔍 Checking current directory issues...\n");

    const currentDir = process.cwd();
    const issues = [];

    // Check if we're in Program Files (common admin issue)
    if (currentDir.toLowerCase().includes("program files")) {
      issues.push({
        type: "ADMIN_REQUIRED",
        message:
          "App is running from Program Files - may require administrator rights",
        solution:
          "Move app to user directory or use different database location",
      });
    }

    // Check if we're on a network drive
    if (currentDir.startsWith("\\\\")) {
      issues.push({
        type: "NETWORK_DRIVE",
        message:
          "App is running from network drive - may have permission restrictions",
        solution: "Copy app to local drive or use local database location",
      });
    }

    // Check for read-only directory
    try {
      const testFile = path.join(
        currentDir,
        "write-test-" + Date.now() + ".tmp"
      );
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (writeError) {
      issues.push({
        type: "READ_ONLY",
        message: "Current directory is read-only or access denied",
        solution: "Run as administrator or use different database location",
      });
    }

    if (issues.length === 0) {
      console.log("✅ No issues found with current directory\n");
    } else {
      console.log("❌ Current directory issues found:");
      issues.forEach((issue) => {
        console.log(`   - ${issue.message}`);
        console.log(`     Solution: ${issue.solution}`);
      });
      console.log("");

      this.results.issues.push(...issues);
    }
  }

  async testFilePermissions() {
    console.log("🔐 Testing file permission methods...\n");

    const testMethods = [
      {
        name: "fs.constants.R_OK",
        test: (filePath) => fs.accessSync(filePath, fs.constants.R_OK),
      },
      {
        name: "fs.constants.W_OK",
        test: (filePath) => fs.accessSync(filePath, fs.constants.W_OK),
      },
      {
        name: "Direct read test",
        test: (filePath) => fs.readFileSync(filePath),
      },
      {
        name: "Direct write test",
        test: (filePath) => fs.writeFileSync(filePath, "test"),
      },
    ];

    // Create a test file
    const testFile = path.join(os.tmpdir(), "permission-test.db");
    try {
      fs.writeFileSync(testFile, "test content");

      testMethods.forEach((method) => {
        try {
          method.test(testFile);
          console.log(`✅ ${method.name}: Working`);
        } catch (error) {
          console.log(`❌ ${method.name}: Failed - ${error.message}`);
        }
      });

      // Clean up
      fs.unlinkSync(testFile);
    } catch (setupError) {
      console.log(`❌ Could not create test file: ${setupError.message}`);
    }

    console.log("");
  }

  async checkWindowsSpecificIssues() {
    console.log("🪟 Checking Windows-specific issues...\n");

    // Check UAC status
    try {
      const { execSync } = require("child_process");
      const uacResult = execSync(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA',
        { encoding: "utf8" }
      );

      if (uacResult.includes("0x1")) {
        console.log("🔒 UAC (User Account Control) is enabled");
        this.results.issues.push({
          type: "UAC_ENABLED",
          message: "UAC may block file operations in protected locations",
          solution: "Use user directory for database or run as administrator",
        });
      } else {
        console.log("✅ UAC is disabled");
      }
    } catch (error) {
      console.log("⚠️ Could not check UAC status");
    }

    // Check if running as administrator
    try {
      const testAdminPath =
        "C:\\Windows\\System32\\test-admin-" + Date.now() + ".tmp";
      fs.writeFileSync(testAdminPath, "test");
      fs.unlinkSync(testAdminPath);
      console.log("🔓 Running with administrator privileges");
    } catch (error) {
      console.log("👤 Running with standard user privileges");
    }

    // Check Windows version
    const osVersion = os.release();
    console.log(`🖥️ Windows version: ${osVersion}`);

    console.log("");
  }

  generateRecommendations() {
    console.log("💡 RECOMMENDATIONS\n");

    // Find best location
    const excellentLocations = this.results.locations.filter(
      (loc) => loc.status === "EXCELLENT"
    );
    const goodLocations = this.results.locations.filter(
      (loc) => loc.status === "GOOD"
    );

    if (excellentLocations.length > 0) {
      const best = excellentLocations[0];
      this.results.recommendations.push({
        priority: "HIGH",
        action: `Use ${best.name} for database`,
        reason: "Full read/write access available",
        implementation: `Set database path to: ${best.path}`,
      });
    } else if (goodLocations.length > 0) {
      const best = goodLocations[0];
      this.results.recommendations.push({
        priority: "MEDIUM",
        action: `Use ${best.name} for database`,
        reason: "Good read/write access available",
        implementation: `Set database path to: ${best.path}`,
      });
    }

    // Permission-related recommendations
    if (this.results.issues.some((issue) => issue.type === "ADMIN_REQUIRED")) {
      this.results.recommendations.push({
        priority: "HIGH",
        action: "Move database to user directory",
        reason: "Avoid administrator rights requirement",
        implementation: "Use AppData/Local or Documents folder",
      });
    }

    // General recommendations
    this.results.recommendations.push({
      priority: "LOW",
      action: "Implement database location fallback",
      reason: "Handle different permission scenarios gracefully",
      implementation: "Try multiple locations in order of preference",
    });
  }

  displayResults() {
    console.log("📋 SUMMARY\n");

    console.log("🎯 RECOMMENDED LOCATIONS (in order):");
    const sortedLocations = this.results.locations
      .filter((loc) => loc.status === "EXCELLENT" || loc.status === "GOOD")
      .sort((a, b) => {
        const statusOrder = { EXCELLENT: 0, GOOD: 1 };
        return statusOrder[a.status] - statusOrder[b.status];
      });

    if (sortedLocations.length === 0) {
      console.log("❌ No fully working locations found!");
      console.log(
        "   Consider running as administrator or checking Windows permissions."
      );
    } else {
      sortedLocations.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.name} (${loc.status})`);
        console.log(`   ${loc.path}`);
      });
    }

    console.log("\n🔧 ACTIONS TO TAKE:");
    if (this.results.recommendations.length === 0) {
      console.log("✅ No specific actions needed");
    } else {
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   How: ${rec.implementation}`);
      });
    }

    console.log("\n==================================");
    console.log("Diagnostic complete! 🏁");
  }
}

// Run diagnostics if called directly
if (require.main === module) {
  const diagnostic = new DatabaseDiagnostic();
  diagnostic.runDiagnostics().catch((error) => {
    console.error("Diagnostic failed:", error);
    process.exit(1);
  });
}

module.exports = DatabaseDiagnostic;
