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

    // IMPROVED: Human-like timing configuration
    this.humanTiming = {
      typing: { min: 40, max: 100 }, // ms between keystrokes (balanced speed)
      mouseMove: { min: 150, max: 400 }, // ms for mouse movements
      pageLoad: { min: 2000, max: 4000 }, // ms to wait for page loads
      thinking: { min: 500, max: 1200 }, // ms for "thinking" pauses
      reading: { min: 1000, max: 2500 }, // ms for "reading" content
      postAction: { min: 200, max: 600 }, // ms after actions
    };

    // IMPROVED: Retry configuration
    this.retryConfig = {
      maxAttempts: 3,
      elementSearch: 2,
      downloadWait: 12, // seconds
    };
  }

  // EXISTING: Keep your current directory methods
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

  // IMPROVED: Human-like delay with randomization
  async humanDelay(baseMs, variation = 0.3) {
    const minMs = Math.floor(baseMs * (1 - variation));
    const maxMs = Math.floor(baseMs * (1 + variation));
    const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, randomMs));
  }

  // DEPRECATED: Keep for compatibility but redirect to humanDelay
  async delay(ms) {
    return this.humanDelay(ms, 0.1); // Small variation for old calls
  }

  // IMPROVED: Human-like typing with character delays
  async humanType(page, selector, text, options = {}) {
    const {
      clearFirst = true,
      typingSpeed = "normal", // 'slow', 'normal', 'fast'
    } = options;

    // Speed presets
    const speeds = {
      slow: { min: 80, max: 150 },
      normal: { min: 40, max: 100 },
      fast: { min: 20, max: 60 },
    };

    const speed = speeds[typingSpeed] || speeds.normal;

    try {
      await page.focus(selector);
      await this.humanDelay(this.humanTiming.thinking.min, 0.4);

      if (clearFirst) {
        await page.keyboard.down("Control");
        await page.keyboard.press("KeyA");
        await page.keyboard.up("Control");
        await this.humanDelay(100, 0.3);
      }

      // Type character by character with human-like delays
      for (let i = 0; i < text.length; i++) {
        await page.keyboard.type(text[i]);

        // Random delay between characters
        if (i < text.length - 1) {
          const charDelay =
            Math.floor(Math.random() * (speed.max - speed.min + 1)) + speed.min;
          await new Promise((resolve) => setTimeout(resolve, charDelay));
        }
      }

      console.log(`✅ Human typed: "${text}" in ${selector}`);
    } catch (error) {
      console.error(`❌ Human typing failed for ${selector}:`, error);
      throw error;
    }
  }

  // IMPROVED: Human-like clicking with mouse movement simulation
  async humanClick(page, selector, options = {}) {
    const {
      moveToFirst = true,
      doubleClick = false,
      thinkingPause = true,
    } = options;

    try {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element ${selector} not found`);
      }

      if (moveToFirst) {
        // Simulate mouse movement to element
        const box = await element.boundingBox();
        if (box) {
          // Add slight randomization to click position
          const x = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
          const y = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

          await page.mouse.move(x, y);
          await this.humanDelay(this.humanTiming.mouseMove.min, 0.4);
        }
      }

      if (thinkingPause) {
        // Brief "thinking" pause before clicking
        await this.humanDelay(this.humanTiming.thinking.min, 0.5);
      }

      if (doubleClick) {
        await page.click(selector, { clickCount: 2 });
      } else {
        await page.click(selector);
      }

      console.log(`✅ Human clicked: ${selector}`);

      // Small post-click delay
      await this.humanDelay(this.humanTiming.postAction.min, 0.3);
    } catch (error) {
      console.error(`❌ Human click failed for ${selector}:`, error);
      throw error;
    }
  }

  // IMPROVED: Human-like page reading simulation
  async simulateReading(page, options = {}) {
    const {
      scrolls = Math.floor(Math.random() * 2) + 1, // 1-2 scrolls (reduced for speed)
      readingTime = "normal", // 'quick', 'normal', 'thorough'
    } = options;

    const readingTimes = {
      quick: { min: 600, max: 1200 },
      normal: { min: 1000, max: 2000 },
      thorough: { min: 1800, max: 3500 },
    };

    const timing = readingTimes[readingTime] || readingTimes.normal;

    try {
      // Random small scrolls to simulate reading
      for (let i = 0; i < scrolls; i++) {
        const scrollDistance = Math.floor(Math.random() * 150) + 50;
        await page.evaluate((distance) => {
          window.scrollBy(0, distance);
        }, scrollDistance);

        const readTime = Math.random() * (timing.max - timing.min) + timing.min;
        await this.humanDelay(readTime, 0.3);
      }

      console.log(`✅ Simulated reading with ${scrolls} scrolls`);
    } catch (error) {
      console.warn("⚠️ Reading simulation failed:", error);
    }
  }

  // IMPROVED: Smart element finder with human-like behavior
  async findAndClickElement(page, strategies, options = {}) {
    const {
      simulateSearch = true,
      maxAttempts = this.retryConfig.elementSearch,
    } = options;

    if (simulateSearch) {
      // Simulate looking around the page first
      await this.simulateReading(page, { scrolls: 1, readingTime: "quick" });
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Search attempt ${attempt}/${maxAttempts}`);

      for (const strategy of strategies) {
        try {
          const { selector, description, clickOptions = {} } = strategy;

          // Wait a moment for elements to potentially appear
          await this.humanDelay(300, 0.3);

          const element = await page.$(selector);
          if (element) {
            console.log(`✅ Found element: ${description}`);

            // Human-like pause before clicking
            await this.humanDelay(400, 0.4);

            await this.humanClick(page, selector, clickOptions);
            return true;
          }
        } catch (error) {
          console.warn(`⚠️ Strategy failed: ${strategy.description}`, error);
        }
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Attempt ${attempt} failed, waiting before retry...`);
        await this.humanDelay(1500, 0.4); // Wait before retrying

        // Refresh page content understanding
        await page.evaluate(() => {
          // Force a small DOM refresh
          document.body.offsetHeight;
        });
      }
    }

    return false;
  }

  // EXISTING: Keep your Chrome detection (but improved)
  findChromeExecutable() {
    const possiblePaths = [];

    if (process.platform === "win32") {
      // Windows Chrome paths
      possiblePaths.push(
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
    try {
      const puppeteerChrome = puppeteer.executablePath();
      if (puppeteerChrome) {
        possiblePaths.unshift(puppeteerChrome); // Prefer bundled version
      }
    } catch (e) {
      console.warn("Puppeteer bundled Chrome not available");
    }

    // Find first existing executable
    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          console.log(`✅ Found Chrome: ${chromePath}`);
          return chromePath;
        }
      } catch (error) {
        continue;
      }
    }

    console.warn("❌ Chrome not found in standard locations");
    return null;
  }

  // IMPROVED: Less aggressive browser configuration
  getBrowserLaunchConfig() {
    const chromeExecutable = this.findChromeExecutable();

    const config = {
      headless: true, // Keep headless for reliability
      args: [
        // Essential for Electron
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",

        // Performance (keep minimal)
        "--disable-gpu",
        "--disable-software-rasterizer",

        // Essential browser behavior
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",

        // Anti-detection improvements
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
      ],

      // IMPROVED: More human-like default arguments
      ignoreDefaultArgs: ["--enable-automation"],

      // IMPROVED: Set realistic window size
      defaultViewport: null,
    };

    // Add Chrome executable if found
    if (chromeExecutable) {
      config.executablePath = chromeExecutable;
    }

    // Platform-specific optimizations (simplified)
    if (process.platform === "win32") {
      config.args.push("--disable-gpu-sandbox");
    }

    return config;
  }

  // IMPROVED: Setup stealth mode
  async setupStealthMode(page) {
    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Mock plugins array to look more realistic
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5], // Fake some plugins
      });

      // Mock languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    // Set realistic timezone and locale
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
  }

  // MAIN IMPROVED SCRAPING METHOD
  async scrapeData(onProgress = null) {
    let browser = null;

    try {
      if (onProgress) onProgress("Starting human-like scraper...");

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

      // IMPROVED: Set more human-like viewport
      await page.setViewport({
        width: 1366 + Math.floor(Math.random() * 100), // Slight randomization
        height: 768 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      });

      // IMPROVED: Set realistic user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Setup stealth mode
      await this.setupStealthMode(page);

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

      // IMPROVED: Navigate with human-like behavior
      await page.goto("https://option.esop.kbc.be/", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Simulate human reading the page
      await this.simulateReading(page, { readingTime: "normal" });

      if (onProgress) onProgress("Handling cookies...");

      // IMPROVED: Human-like cookie handling
      try {
        const cookieStrategies = [
          {
            selector: 'button:contains("understand")',
            description: "Cookie accept button (contains text)",
          },
          {
            selector: '[id*="cookie"] button, [class*="cookie"] button',
            description: "Cookie buttons by ID/class",
          },
          {
            selector: "button[data-accept], button[data-consent]",
            description: "Cookie consent buttons",
          },
        ];

        const cookieHandled = await this.findAndClickElement(
          page,
          cookieStrategies,
          {
            simulateSearch: false, // Skip extra reading for speed
            maxAttempts: 1,
          }
        );

        if (cookieHandled) {
          await this.humanDelay(800, 0.3); // Wait after cookie handling
        }
      } catch (error) {
        console.log("⚠️ Cookie handling skipped:", error.message);
      }

      if (onProgress) onProgress("Setting date and submitting...");

      // IMPROVED: Human-like form filling
      try {
        await this.humanType(page, 'input[name="from"]', "2015-01-01", {
          clearFirst: true,
          typingSpeed: "fast", // Use fast typing for efficiency
        });

        // Brief pause to "review" the input
        await this.humanDelay(500, 0.4);
      } catch (dateError) {
        console.warn("Could not set date field:", dateError.message);
        throw new Error(
          "Could not fill date field. Website structure may have changed."
        );
      }

      if (onProgress) onProgress("Submitting form...");

      // IMPROVED: Human-like form submission
      await this.humanClick(page, 'input[type="submit"]', {
        moveToFirst: true,
        thinkingPause: true,
      });

      // Wait for navigation/new content with human-like patience
      await this.humanDelay(2500, 0.4);

      if (onProgress) onProgress("Looking for export options...");

      // Simulate looking around for export options
      await this.simulateReading(page, { readingTime: "quick" });

      // IMPROVED: Smart CSV export detection
      const exportStrategies = [
        {
          selector: ".exportText",
          description: "Original export text element",
        },
        {
          selector: 'a[href*="csv"], a[href*="CSV"]',
          description: "CSV download links by href",
        },
        {
          selector: 'button:contains("export"), button:contains("Export")',
          description: "Export buttons",
        },
        {
          selector: "[data-export], [data-download], [data-csv]",
          description: "Data attribute export elements",
        },
      ];

      const csvExported = await this.findAndClickElement(
        page,
        exportStrategies,
        {
          simulateSearch: true,
          maxAttempts: 2,
        }
      );

      if (!csvExported) {
        // IMPROVED: Better error reporting with page info
        const pageInfo = await page.evaluate(() => {
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

      // IMPROVED: Patient waiting for download
      await this.humanDelay(2000, 0.3); // Initial wait

      if (onProgress) onProgress("Verifying download...");

      // Check for file with human-like patience
      let attempts = 0;
      const maxAttempts = this.retryConfig.downloadWait;

      while (!fs.existsSync(this.filePath) && attempts < maxAttempts) {
        const waitTime = 700 + Math.random() * 400; // 700-1100ms random intervals
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        attempts++;

        // Check for alternative file names
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
        message: "Data scraped successfully with human-like behavior",
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
        // Human-like browser closing - not instant
        await this.humanDelay(300, 0.2);
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser:", closeError);
        }
      }
    }
  }

  // EXISTING: Keep your current methods for compatibility
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

  // EXISTING: Test connection method (keep unchanged)
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
