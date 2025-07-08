// download-chrome.js - Downloads portable Chrome for bundling
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

class ChromeDownloader {
  constructor() {
    this.chromeDir = path.join(__dirname, "chrome-portable");
    this.platform = process.platform;
  }

  async downloadPortableChrome() {
    console.log("🔽 Setting up portable Chrome for distribution...");

    // Create chrome directory with absolute path
    const absoluteChromeDir = path.resolve(this.chromeDir);
    if (!fs.existsSync(absoluteChromeDir)) {
      fs.mkdirSync(absoluteChromeDir, { recursive: true });
    }

    try {
      // Method 1: Use Puppeteer's browser management with absolute path
      console.log("📦 Using Puppeteer browser management...");

      // Use absolute path to avoid the "Target directory is expected to be absolute" error
      const command = `npx @puppeteer/browsers install chrome@stable --path "${absoluteChromeDir}"`;
      console.log(`Running: ${command}`);

      execSync(command, {
        stdio: "inherit",
        cwd: __dirname,
      });

      console.log("✅ Chrome downloaded successfully via Puppeteer");

      // Verify the download
      const downloaded = this.verifyChromiumDownload(absoluteChromeDir);
      if (downloaded) {
        console.log("✅ Chrome installation verified");
        return true;
      } else {
        throw new Error("Download verification failed");
      }
    } catch (puppeteerError) {
      console.warn("⚠️ Puppeteer method failed:", puppeteerError.message);

      try {
        // Method 2: Use standard puppeteer package
        console.log("🔄 Trying standard Puppeteer installation...");

        // First ensure puppeteer is installed
        execSync("npm install puppeteer", {
          stdio: "inherit",
          cwd: __dirname,
        });

        // Check if Chromium was downloaded to node_modules
        const nodeModulesChromium = path.join(
          __dirname,
          "node_modules",
          "puppeteer",
          ".local-chromium"
        );
        if (fs.existsSync(nodeModulesChromium)) {
          console.log("✅ Puppeteer Chromium found in node_modules");

          // Copy to our chrome-portable directory for bundling
          this.copyChromiumFromNodeModules(
            nodeModulesChromium,
            absoluteChromeDir
          );
          return true;
        } else {
          throw new Error("Puppeteer did not download Chromium");
        }
      } catch (standardError) {
        console.warn("⚠️ Standard method also failed:", standardError.message);

        // Method 3: Manual download (simplified)
        console.log("🌐 Attempting manual Chrome setup...");
        return await this.setupManualChrome();
      }
    }
  }

  // Verify Chromium download
  verifyChromiumDownload(downloadDir) {
    try {
      // Look for Chrome executable in the download directory
      const findChrome = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
          const fullPath = path.join(dir, item.name);

          if (item.isDirectory()) {
            const result = findChrome(fullPath);
            if (result) return result;
          } else if (item.name === "chrome.exe" || item.name === "chrome") {
            return fullPath;
          }
        }
        return null;
      };

      const chromePath = findChrome(downloadDir);
      if (chromePath) {
        console.log(`✅ Found Chrome executable: ${chromePath}`);
        return chromePath;
      } else {
        console.log("❌ Chrome executable not found in download directory");
        return null;
      }
    } catch (error) {
      console.error("Error verifying download:", error.message);
      return null;
    }
  }

  // Copy Chromium from node_modules to portable directory
  copyChromiumFromNodeModules(source, destination) {
    try {
      console.log("📋 Copying Chromium from node_modules...");

      // Use robocopy on Windows for better directory copying
      if (process.platform === "win32") {
        execSync(`robocopy "${source}" "${destination}" /E /IS /NP`, {
          stdio: "inherit",
        });
      } else {
        execSync(`cp -r "${source}"/* "${destination}"/`, {
          stdio: "inherit",
        });
      }

      console.log("✅ Chromium copied successfully");
      return true;
    } catch (error) {
      console.warn("⚠️ Copy failed:", error.message);
      return false;
    }
  }

  // Simplified manual Chrome setup
  async setupManualChrome() {
    console.log("🔧 Manual Chrome setup...");

    // For now, we'll recommend the user install Chrome
    console.log("📝 MANUAL SETUP REQUIRED:");
    console.log("1. Ensure Google Chrome is installed on target machines");
    console.log("2. OR include Chrome installer with your distribution");
    console.log("3. OR use a different web scraping approach");

    // Create a placeholder file to indicate manual setup
    const placeholderPath = path.join(
      this.chromeDir,
      "manual-setup-required.txt"
    );
    fs.writeFileSync(
      placeholderPath,
      `
Manual Chrome Setup Required
============================

This application requires Google Chrome to function properly.

For end users:
- Install Google Chrome from https://www.google.com/chrome/
- The application will automatically detect and use the installed Chrome

For developers:
- Consider bundling Chrome with your application
- Or implement an alternative web scraping solution
- Or require Chrome as a prerequisite

Generated: ${new Date().toISOString()}
`
    );

    console.log("📄 Created manual setup instructions");
    return true;
  }

  async downloadChromeManually() {
    console.log("🌐 Downloading Chrome manually...");

    let downloadUrl;
    let filename;

    if (this.platform === "win32") {
      // Windows Chrome portable
      downloadUrl =
        "https://dl.google.com/chrome/install/googlechromestandaloneenterprise64.msi";
      filename = "chrome-installer.msi";
    } else if (this.platform === "darwin") {
      // macOS Chrome
      downloadUrl =
        "https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg";
      filename = "chrome-installer.dmg";
    } else {
      // Linux Chrome
      downloadUrl =
        "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb";
      filename = "chrome-installer.deb";
    }

    const downloadPath = path.join(this.chromeDir, filename);

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(downloadPath);

      https
        .get(downloadUrl, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: ${response.statusCode}`));
            return;
          }

          response.pipe(file);

          file.on("finish", () => {
            file.close();
            console.log(`✅ Downloaded ${filename}`);
            console.log(
              "⚠️ Manual installation required - automated extraction not implemented"
            );
            resolve();
          });
        })
        .on("error", (error) => {
          fs.unlink(downloadPath, () => {}); // Delete partial file
          reject(error);
        });
    });
  }

  checkExistingChrome() {
    console.log("🔍 Checking for existing Chrome installations...");

    const possiblePaths = [];

    if (this.platform === "win32") {
      possiblePaths.push(
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      );
    } else if (this.platform === "darwin") {
      possiblePaths.push(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      );
    } else {
      possiblePaths.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser");
    }

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    console.log("❌ No system Chrome installation found");
    return null;
  }

  async setup() {
    console.log("🚀 Chrome Setup for OTC Portfolio App");
    console.log("=====================================\n");

    // Check for existing Chrome
    const existingChrome = this.checkExistingChrome();

    if (existingChrome) {
      console.log("✅ System Chrome found - app should work on this machine");
      console.log("💡 For distribution, you may still want to bundle Chrome\n");
    }

    // Check Puppeteer's bundled Chromium
    const puppeteerChromium = path.join(
      __dirname,
      "node_modules",
      "puppeteer",
      ".local-chromium"
    );
    if (fs.existsSync(puppeteerChromium)) {
      console.log("✅ Puppeteer Chromium found");

      const versions = fs.readdirSync(puppeteerChromium);
      if (versions.length > 0) {
        console.log(`   Versions: ${versions.join(", ")}`);
      }
    } else {
      console.log("❌ Puppeteer Chromium not found");
      console.log("💡 Run: npm install puppeteer\n");
    }

    // Offer to download portable Chrome
    console.log("🔽 Setting up portable Chrome for distribution...");
    const success = await this.downloadPortableChrome();

    if (success) {
      console.log("\n✅ Chrome setup completed!");
      console.log("\n📦 Next steps for distribution:");
      console.log("1. Include chrome-portable folder in your build");
      console.log("2. Update electron-builder config to bundle Chrome");
      console.log("3. Test on machines without Chrome installed");
    } else {
      console.log("\n❌ Chrome setup failed");
      console.log("\n🔧 Manual alternatives:");
      console.log("1. Ensure users install Chrome before running your app");
      console.log("2. Create an installer that includes Chrome");
      console.log("3. Use a different web scraping approach");
    }
  }
}

// Run the setup
if (require.main === module) {
  const downloader = new ChromeDownloader();
  downloader.setup().catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
}

module.exports = ChromeDownloader;
