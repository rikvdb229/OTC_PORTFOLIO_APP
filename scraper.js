const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class KBCScraper {
  constructor() {
    // Use app data directory instead of process.cwd() for better permissions
    this.downloadDir = this.getDataDirectory();
    this.today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    this.fileName = `kbc_productList_${this.today}.csv`;
    this.filePath = path.join(this.downloadDir, this.fileName);

    // Ensure DATA directory exists with proper permissions
    this.ensureDataDirectory();
  }

  // Get proper data directory that works with user permissions
  getDataDirectory() {
    let dataDir;

    try {
      // Try to use Electron's user data directory first (best for permissions)
      if (app && app.getPath) {
        dataDir = path.join(app.getPath("userData"), "DATA");
      } else {
        // Fallback to Documents folder for better user permissions
        const os = require("os");
        dataDir = path.join(os.homedir(), "Documents", "OTC_Portfolio_Data");
      }
    } catch (error) {
      // Final fallback to current working directory
      console.warn(
        "Could not determine user data directory, using current directory"
      );
      dataDir = path.join(process.cwd(), "DATA");
    }

    return dataDir;
  }

  // Ensure data directory exists with error handling
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true });
        console.log(`✅ Created data directory: ${this.downloadDir}`);
      }
    } catch (error) {
      console.error(`❌ Could not create data directory: ${error.message}`);
      // Try alternative location
      this.downloadDir = path.join(
        require("os").tmpdir(),
        "OTC_Portfolio_Data"
      );
      fs.mkdirSync(this.downloadDir, { recursive: true });
      console.log(`⚠️ Using temporary directory: ${this.downloadDir}`);
    }
  }

  // Helper method to replace waitForTimeout
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Find Chrome executable for distribution
  findChromeExecutable() {
    const possiblePaths = [];

    if (process.platform === "win32") {
      // Windows Chrome paths
      possiblePaths.push(
        // Standard Chrome installations
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      );

      // Bundled with app (if we include it)
      if (process.resourcesPath) {
        possiblePaths.push(
          path.join(process.resourcesPath, "chrome", "chrome.exe"),
          path.join(process.resourcesPath, "chromium", "chrome.exe")
        );
      }

      possiblePaths.push(
        path.join(__dirname, "chrome", "chrome.exe"),
        path.join(__dirname, "chrome-win", "chrome.exe")
      );
    } else if (process.platform === "darwin") {
      // macOS paths
      possiblePaths.push(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      );
      if (process.resourcesPath) {
        possiblePaths.push(
          path.join(
            process.resourcesPath,
            "chrome",
            "Chrome.app",
            "Contents",
            "MacOS",
            "Chrome"
          )
        );
      }
    } else {
      // Linux paths
      possiblePaths.push(
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium"
      );
    }

    // Check Puppeteer's bundled Chromium
    const puppeteerChromiumPath = path.join(
      __dirname,
      "node_modules",
      "puppeteer",
      ".local-chromium"
    );
    if (fs.existsSync(puppeteerChromiumPath)) {
      try {
        const versions = fs.readdirSync(puppeteerChromiumPath);
        if (versions.length > 0) {
          const latestVersion = versions.sort().pop();
          let executablePath;

          if (process.platform === "win32") {
            executablePath = path.join(
              puppeteerChromiumPath,
              latestVersion,
              "chrome-win",
              "chrome.exe"
            );
          } else if (process.platform === "darwin") {
            executablePath = path.join(
              puppeteerChromiumPath,
              latestVersion,
              "chrome-mac",
              "Chromium.app",
              "Contents",
              "MacOS",
              "Chromium"
            );
          } else {
            executablePath = path.join(
              puppeteerChromiumPath,
              latestVersion,
              "chrome-linux",
              "chrome"
            );
          }

          if (fs.existsSync(executablePath)) {
            possiblePaths.unshift(executablePath); // Add to beginning for priority
            console.log(`🔍 Found Puppeteer Chromium: ${executablePath}`);
          }
        }
      } catch (error) {
        console.warn(
          "Error scanning Puppeteer Chromium directory:",
          error.message
        );
      }
    }

    // Check which Chrome executable exists
    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`✅ Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    console.log("❌ No Chrome executable found in any location");
    return null;
  }

  // Get browser launch configuration with Chrome detection
  getBrowserLaunchConfig() {
    const chromeExecutable = this.findChromeExecutable();

    const config = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-hang-monitor",
        "--disable-sync",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images", // Faster loading
        "--disable-javascript-harmony-shipping",
        "--disable-background-networking",
      ],
    };

    // Add Chrome executable if found
    if (chromeExecutable) {
      config.executablePath = chromeExecutable;
    }

    // Platform-specific optimizations
    if (process.platform === "win32") {
      config.args.push(
        "--disable-gpu-sandbox",
        "--disable-software-rasterizer"
      );
    }

    return config;
  }

  async scrapeData(onProgress = null) {
    let browser = null;

    try {
      if (onProgress) onProgress("Starting scraper...");

      // Check for Chrome availability first
      const chromeExecutable = this.findChromeExecutable();
      if (!chromeExecutable) {
        throw new Error(
          "Chrome not found. Please install Google Chrome or contact support for a version with bundled browser."
        );
      }

      console.log(`Using Chrome at: ${chromeExecutable}`);

      const launchConfig = this.getBrowserLaunchConfig();

      if (onProgress) onProgress("Launching browser...");

      try {
        browser = await puppeteer.launch(launchConfig);
        console.log("✅ Browser launched successfully");
      } catch (browserError) {
        console.error("Browser launch error:", browserError);

        // Try even more minimal configuration
        if (onProgress) onProgress("Retrying with minimal configuration...");

        try {
          browser = await puppeteer.launch({
            headless: true,
            executablePath: chromeExecutable,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
            ],
          });
        } catch (minimalError) {
          // Last resort: try without specifying executable path (use bundled)
          browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
        }
      }

      const page = await browser.newPage();

      // Suppress DevTools console errors and set up error handling
      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("Autofill") || text.includes("devtools://")) {
          return; // Ignore these warnings
        }
        if (text.includes("ERROR") || text.includes("Failed")) {
          console.log("PAGE ERROR:", text);
        }
      });

      page.on("pageerror", (error) => {
        console.error("Page error:", error.message);
      });

      // Set reasonable timeouts
      page.setDefaultTimeout(45000);
      page.setDefaultNavigationTimeout(45000);

      // Set download directory with error handling
      try {
        const client = await page.target().createCDPSession();
        await client.send("Page.setDownloadBehavior", {
          behavior: "allow",
          downloadPath: this.downloadDir,
        });
      } catch (cdpError) {
        console.warn(
          "Could not set download directory via CDP:",
          cdpError.message
        );
      }

      if (onProgress) onProgress("Loading KBC page...");

      await page.goto("https://option.esop.kbc.be/", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Handle cookies with timeout
      try {
        await Promise.race([
          page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button, a"));
            for (let btn of buttons) {
              if (btn.textContent.toLowerCase().includes("understand")) {
                btn.click();
                break;
              }
            }
          }),
          this.delay(3000), // Max 3 seconds for cookie handling
        ]);
        await this.delay(500);
      } catch (e) {
        console.log("Cookie handling skipped or failed");
      }

      if (onProgress) onProgress("Setting date and submitting...");

      // Set date with error handling
      try {
        await page.focus('input[name="from"]');
        await page.keyboard.down("Control");
        await page.keyboard.press("KeyA");
        await page.keyboard.up("Control");
        await page.type('input[name="from"]', "2015-01-01");
      } catch (dateError) {
        console.warn("Could not set date field:", dateError.message);
        throw new Error(
          "Could not fill date field. Website structure may have changed."
        );
      }

      // Handle potential new tab/navigation
      const newPagePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 8000); // 8 second timeout

        browser.on("targetcreated", async (target) => {
          if (target.type() === "page") {
            clearTimeout(timeout);
            try {
              const newPage = await target.page();
              resolve(newPage);
            } catch (error) {
              resolve(null);
            }
          }
        });
      });

      // Click submit button
      try {
        await page.click('input[type="submit"]');
      } catch (submitError) {
        throw new Error(
          "Could not submit form. Website structure may have changed."
        );
      }

      if (onProgress) onProgress("Waiting for data to load...");

      // Wait for the new page or content
      let dataPage;
      try {
        dataPage = await Promise.race([
          newPagePromise,
          this.delay(8000).then(() => page),
        ]);

        if (!dataPage) {
          dataPage = page;
        }

        // Wait for page to be ready
        await this.delay(3000);
      } catch (e) {
        console.log("Using original page as data page");
        dataPage = page;
      }

      // Debug current page
      const currentPageInfo = await dataPage.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        ready: document.readyState,
      }));

      console.log("Current page info:", currentPageInfo);

      if (onProgress)
        onProgress(`Processing page: ${currentPageInfo.title}...`);

      // Wait for dynamic content
      await this.delay(3000);

      if (onProgress) onProgress("Looking for CSV export...");

      // Enhanced CSV export detection
      const csvExported = await dataPage.evaluate(() => {
        // Strategy 1: Original .exportText class
        let exportElement = document.querySelector(".exportText");
        if (exportElement) {
          console.log("Found .exportText element");
          exportElement.click();
          return true;
        }

        // Strategy 2: CSV links
        const links = Array.from(document.querySelectorAll("a"));
        const csvLink = links.find((link) =>
          link.textContent.toLowerCase().includes("csv")
        );
        if (csvLink) {
          console.log("Found CSV link:", csvLink.textContent);
          csvLink.click();
          return true;
        }

        // Strategy 3: Export buttons
        const exportButtons = Array.from(
          document.querySelectorAll(
            "button, a, input[type='button'], input[type='submit']"
          )
        );
        const exportButton = exportButtons.find((btn) => {
          const text = btn.textContent || btn.value || "";
          return (
            text.toLowerCase().includes("export") ||
            text.toLowerCase().includes("download") ||
            text.toLowerCase().includes("csv")
          );
        });
        if (exportButton) {
          console.log(
            "Found export button:",
            exportButton.textContent || exportButton.value
          );
          exportButton.click();
          return true;
        }

        // Strategy 4: Data attributes
        const dataElements = Array.from(
          document.querySelectorAll(
            "[data-export], [data-download], [data-csv]"
          )
        );
        if (dataElements.length > 0) {
          console.log("Found data export element");
          dataElements[0].click();
          return true;
        }

        // Debug info
        console.log(
          "Available links:",
          links.map((l) => l.textContent.trim()).filter((t) => t)
        );
        console.log(
          "Available buttons:",
          exportButtons
            .map((b) => b.textContent || b.value || "no text")
            .filter((t) => t !== "no text")
        );

        return false;
      });

      if (!csvExported) {
        const pageInfo = await dataPage.evaluate(() => {
          return {
            url: window.location.href,
            title: document.title,
            hasForm: document.forms.length > 0,
            linkCount: document.querySelectorAll("a").length,
            buttonCount: document.querySelectorAll(
              'button, input[type="button"]'
            ).length,
          };
        });

        console.error("CSV export not found. Page info:", pageInfo);
        throw new Error(
          `CSV export not found on page: ${pageInfo.title}. The website structure may have changed.`
        );
      }

      if (onProgress) onProgress("Download started...");

      // Wait for download with longer timeout
      await this.delay(5000);

      if (onProgress) onProgress("Verifying download...");

      // Check if file exists with extended wait
      let attempts = 0;
      const maxAttempts = 15; // 15 seconds

      while (!fs.existsSync(this.filePath) && attempts < maxAttempts) {
        await this.delay(1000);
        attempts++;

        // Also check for any CSV files with today's date
        try {
          const files = fs.readdirSync(this.downloadDir);
          const todayFiles = files.filter(
            (f) => f.includes(this.today) && f.endsWith(".csv")
          );
          if (todayFiles.length > 0) {
            this.filePath = path.join(this.downloadDir, todayFiles[0]);
            this.fileName = todayFiles[0];
            break;
          }
        } catch (readError) {
          // Continue waiting
        }
      }

      if (!fs.existsSync(this.filePath)) {
        throw new Error(
          `CSV file was not downloaded after ${maxAttempts} seconds. Check download directory: ${this.downloadDir}`
        );
      }

      if (onProgress) onProgress("Scraping completed successfully!");

      return {
        success: true,
        fileName: this.fileName,
        filePath: this.filePath,
        message: "Data scraped successfully",
        downloadDir: this.downloadDir,
      };
    } catch (error) {
      console.error("Scraping error:", error);
      return {
        success: false,
        error: error.message,
        message: "Failed to scrape data",
        downloadDir: this.downloadDir,
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser:", closeError);
        }
      }
    }
  }

  // Find the latest CSV file
  getLatestCSVFile() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        return null;
      }

      const files = fs
        .readdirSync(this.downloadDir)
        .filter(
          (file) => file.startsWith("kbc_productList_") && file.endsWith(".csv")
        )
        .map((file) => ({
          name: file,
          path: path.join(this.downloadDir, file),
          stats: fs.statSync(path.join(this.downloadDir, file)),
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      return files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error("Error finding latest CSV:", error);
      return null;
    }
  }

  // Test connection
  async testConnection() {
    let browser = null;
    try {
      const chromeExecutable = this.findChromeExecutable();
      if (!chromeExecutable) {
        return {
          success: false,
          error: "Chrome not found",
          message: "Chrome browser is required but not found on this system",
        };
      }

      const launchConfig = this.getBrowserLaunchConfig();
      browser = await puppeteer.launch(launchConfig);
      const page = await browser.newPage();

      const response = await page.goto("https://option.esop.kbc.be/", {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      const title = await page.title();

      return {
        success: true,
        status: response.status(),
        title: title,
        message: "Connection successful",
        chromeFound: true,
        chromePath: chromeExecutable,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Connection failed",
        chromeFound: !!this.findChromeExecutable(),
      };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser in test:", closeError);
        }
      }
    }
  }
}

module.exports = KBCScraper;
