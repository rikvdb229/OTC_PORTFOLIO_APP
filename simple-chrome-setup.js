// simple-chrome-setup.js - Simple and reliable Chrome setup for distribution
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function setupChrome() {
  console.log("🚀 SIMPLE CHROME SETUP FOR DISTRIBUTION");
  console.log("=======================================\n");

  // Check if system Chrome exists
  const systemChrome = checkSystemChrome();

  // Try to ensure Puppeteer's Chromium is available
  const puppeteerChromium = await ensurePuppeteerChromium();

  // Update package.json for proper bundling
  updatePackageJsonForBundling(puppeteerChromium);

  // Test the setup
  await testChromeSetup();

  console.log("\n🎉 CHROME SETUP COMPLETE!");
  console.log("=========================");

  if (systemChrome) {
    console.log("✅ System Chrome: Available");
  }

  if (puppeteerChromium) {
    console.log("✅ Puppeteer Chromium: Available for bundling");
  }

  console.log("\n📦 For distribution:");
  console.log("1. Run: npm run build-win");
  console.log("2. The installer will include bundled Chromium");
  console.log("3. Users won't need Chrome pre-installed");
}

function checkSystemChrome() {
  console.log("🔍 Checking for system Chrome...");

  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const chromePath of chromePaths) {
    if (fs.existsSync(chromePath)) {
      console.log(`✅ Found system Chrome: ${chromePath}`);
      return chromePath;
    }
  }

  console.log("❌ System Chrome not found");
  return null;
}

async function ensurePuppeteerChromium() {
  console.log("\n📦 Setting up Puppeteer Chromium...");

  const puppeteerDir = path.join(__dirname, "node_modules", "puppeteer");
  const chromiumDir = path.join(puppeteerDir, ".local-chromium");

  // Check if Puppeteer is installed
  if (!fs.existsSync(puppeteerDir)) {
    console.log("📥 Installing Puppeteer...");
    try {
      execSync("npm install puppeteer", { stdio: "inherit" });
    } catch (error) {
      console.error("❌ Failed to install Puppeteer:", error.message);
      return null;
    }
  }

  // Check if Chromium was downloaded
  if (fs.existsSync(chromiumDir)) {
    const versions = fs.readdirSync(chromiumDir);
    if (versions.length > 0) {
      console.log(`✅ Puppeteer Chromium found: ${versions.length} version(s)`);
      console.log(`   Versions: ${versions.join(", ")}`);
      console.log(`   Location: ${chromiumDir}`);
      return chromiumDir;
    }
  }

  // Force Chromium download with better detection
  console.log("🔽 Downloading Chromium...");
  try {
    // Create a more robust download script
    const downloadScript = `
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting Chromium download...');
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Chromium downloaded and launched successfully!');
    await browser.close();
    
    // Verify the download location
    const chromiumDir = path.join(__dirname, 'node_modules', 'puppeteer', '.local-chromium');
    if (fs.existsSync(chromiumDir)) {
      const versions = fs.readdirSync(chromiumDir);
      console.log('📁 Chromium location verified:', chromiumDir);
      console.log('📦 Versions found:', versions.join(', '));
    } else {
      console.log('⚠️ Chromium directory not found at expected location');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Chromium download/launch failed:', error.message);
    process.exit(1);
  }
})();
`;

    const scriptPath = path.join(__dirname, "download-chromium-test.js");
    fs.writeFileSync(scriptPath, downloadScript);

    execSync(`node "${scriptPath}"`, { stdio: "inherit" });

    // Clean up
    fs.unlinkSync(scriptPath);

    // Re-check for Chromium directory
    if (fs.existsSync(chromiumDir)) {
      const versions = fs.readdirSync(chromiumDir);
      if (versions.length > 0) {
        console.log("✅ Chromium download successful");
        console.log(`   Final location: ${chromiumDir}`);
        return chromiumDir;
      }
    }

    // If still not found, check alternative locations
    console.log("🔍 Searching for Chromium in alternative locations...");
    const altLocations = [
      path.join(__dirname, "node_modules", "puppeteer-core", ".local-chromium"),
      path.join(__dirname, "node_modules", "@puppeteer", "browsers"),
      path.join(require("os").homedir(), ".cache", "puppeteer"),
    ];

    for (const altPath of altLocations) {
      if (fs.existsSync(altPath)) {
        console.log(`✅ Found Chromium at alternative location: ${altPath}`);
        return altPath;
      }
    }

    throw new Error("Chromium directory not found after download");
  } catch (error) {
    console.error("❌ Chromium download failed:", error.message);
    console.log("💡 Fallback: Will rely on system Chrome for distribution");
    return null;
  }
}

function updatePackageJsonForBundling(chromiumPath) {
  console.log("\n⚙️ Updating package.json for Chrome bundling...");

  const packageJsonPath = path.join(__dirname, "package.json");

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Ensure build configuration exists
    if (!packageJson.build) {
      packageJson.build = {};
    }

    // Update files array to include Chromium
    const files = packageJson.build.files || [];
    const chromiumEntry = "node_modules/puppeteer/.local-chromium/**/*";

    if (!files.includes(chromiumEntry)) {
      files.push(chromiumEntry);
      packageJson.build.files = files;
    }

    // Update extraResources
    const extraResources = packageJson.build.extraResources || [];
    const chromiumResource = {
      from: "node_modules/puppeteer/.local-chromium",
      to: "chromium",
      filter: ["**/*"],
    };

    // Check if chromium resource already exists
    const existingResource = extraResources.find(
      (resource) => resource.from === "node_modules/puppeteer/.local-chromium"
    );

    if (!existingResource) {
      extraResources.push(chromiumResource);
      packageJson.build.extraResources = extraResources;
    }

    // Write back to package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("✅ package.json updated for Chrome bundling");
  } catch (error) {
    console.error("❌ Failed to update package.json:", error.message);
  }
}

async function testChromeSetup() {
  console.log("\n🧪 Testing Chrome setup...");

  try {
    // Import and test the scraper
    const KBCScraper = require("./scraper");
    const scraper = new KBCScraper();

    const testResult = await scraper.testConnection();

    if (testResult.success) {
      console.log("✅ Chrome setup test: PASSED");
      console.log(`   Status: ${testResult.status}`);
      console.log(`   Page title: ${testResult.title}`);
      if (testResult.chromePath) {
        console.log(`   Chrome path: ${testResult.chromePath}`);
      }
    } else {
      console.log("❌ Chrome setup test: FAILED");
      console.log(`   Error: ${testResult.error}`);
    }
  } catch (error) {
    console.log("❌ Chrome test failed:", error.message);
  }
}

// Create additional helper functions
function createChromeInstallInstructions() {
  const instructionsPath = path.join(__dirname, "CHROME_SETUP_INSTRUCTIONS.md");
  const instructions = `
# Chrome Setup Instructions

## For End Users

If the application shows "Chrome not found" error:

1. **Install Google Chrome** from https://www.google.com/chrome/
2. **Restart the application** - it will automatically detect Chrome

## For Developers

### Option 1: Bundle Chrome (Recommended)
\`\`\`bash
npm run setup-chrome
npm run build-win
\`\`\`

### Option 2: Require Chrome Installation
Include in your installer/documentation that users need Chrome.

### Option 3: Alternative Scraping
Consider using a different web scraping approach that doesn't require Chrome.

## Troubleshooting

### "Chrome not found" Error
- Install Google Chrome
- Ensure Chrome is in standard installation location
- Run as administrator (if needed)

### Permission Errors
- Use user directory for database (already implemented)
- Install app per-user (not system-wide)

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log("📝 Created Chrome setup instructions");
}

// Run the setup
if (require.main === module) {
  setupChrome()
    .then(() => {
      createChromeInstallInstructions();
      console.log("\n🎯 NEXT STEPS:");
      console.log("1. Test your app: npm run dev");
      console.log("2. Build for distribution: npm run build-win");
      console.log("3. Test installer on machine without Chrome");
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

module.exports = { setupChrome, checkSystemChrome };
