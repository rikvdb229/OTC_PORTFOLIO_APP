// test-chrome-simple.js - Simple Chrome detection and test
const fs = require("fs");
const path = require("path");

function findChrome() {
  console.log("🔍 Searching for Chrome executables...\n");

  const locations = [
    {
      name: "System Chrome (64-bit)",
      path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    },
    {
      name: "System Chrome (32-bit)",
      path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    },
  ];

  // Add Puppeteer Chromium locations
  const puppeteerBase = path.join(
    __dirname,
    "node_modules",
    "puppeteer",
    ".local-chromium"
  );
  if (fs.existsSync(puppeteerBase)) {
    try {
      const versions = fs.readdirSync(puppeteerBase);
      versions.forEach((version) => {
        const chromePath = path.join(
          puppeteerBase,
          version,
          "chrome-win",
          "chrome.exe"
        );
        locations.push({
          name: `Puppeteer Chromium (${version})`,
          path: chromePath,
        });
      });
    } catch (error) {
      console.warn("Could not scan Puppeteer directory:", error.message);
    }
  }

  let foundChrome = null;
  let foundCount = 0;

  locations.forEach((location) => {
    const exists = fs.existsSync(location.path);
    const status = exists ? "✅ FOUND" : "❌ NOT FOUND";

    console.log(`${status} ${location.name}`);
    console.log(`   Path: ${location.path}`);

    if (exists) {
      try {
        const stats = fs.statSync(location.path);
        const sizeMB = Math.round(stats.size / (1024 * 1024));
        console.log(`   Size: ${sizeMB} MB`);
        console.log(`   Modified: ${stats.mtime.toLocaleDateString()}`);

        if (!foundChrome) {
          foundChrome = location.path;
        }
        foundCount++;
      } catch (statError) {
        console.log(`   Error reading file stats: ${statError.message}`);
      }
    }
    console.log("");
  });

  console.log(`📊 Summary: Found ${foundCount} Chrome installation(s)`);

  if (foundChrome) {
    console.log(`🎯 Will use: ${foundChrome}`);
    return foundChrome;
  } else {
    console.log("❌ No Chrome installations found");
    return null;
  }
}

async function testChrome(chromePath) {
  if (!chromePath) {
    console.log("❌ Cannot test: No Chrome path provided");
    return false;
  }

  console.log("\n🧪 Testing Chrome launch...");

  try {
    const puppeteer = require("puppeteer");

    console.log("🚀 Launching Chrome...");
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("✅ Chrome launched successfully");

    console.log("📄 Creating test page...");
    const page = await browser.newPage();

    console.log("🌐 Navigating to test URL...");
    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    const title = await page.title();
    console.log(`✅ Page loaded: "${title}"`);

    await browser.close();
    console.log("✅ Chrome test completed successfully");

    return true;
  } catch (error) {
    console.log(`❌ Chrome test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 CHROME DETECTION AND TEST");
  console.log("============================\n");

  // Check if Puppeteer is available
  try {
    require("puppeteer");
    console.log("✅ Puppeteer module available\n");
  } catch (error) {
    console.log("❌ Puppeteer not found - installing...");
    try {
      const { execSync } = require("child_process");
      execSync("npm install puppeteer", { stdio: "inherit" });
      console.log("✅ Puppeteer installed\n");
    } catch (installError) {
      console.log("❌ Failed to install Puppeteer:", installError.message);
      return;
    }
  }

  // Find Chrome
  const chromePath = findChrome();

  if (chromePath) {
    // Test Chrome
    const testPassed = await testChrome(chromePath);

    console.log("\n🏁 FINAL RESULT:");
    if (testPassed) {
      console.log("✅ Chrome setup is working correctly");
      console.log("🎉 Ready for development and distribution");
    } else {
      console.log("❌ Chrome test failed");
      console.log("💡 Check Chrome installation and permissions");
    }
  } else {
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("1. Install Google Chrome from https://www.google.com/chrome/");
    console.log("2. Or run: npm install puppeteer (to download Chromium)");
    console.log("3. Or run: npm run setup-chrome");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
}

module.exports = { findChrome, testChrome };
