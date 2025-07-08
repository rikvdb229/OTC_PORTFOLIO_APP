// ensure-chromium.js - Ensures Chromium is downloaded for bundling
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Checking Chromium installation for bundling...");

// Check if Puppeteer's Chromium exists
const chromiumPath = path.join(
  __dirname,
  "node_modules",
  "puppeteer",
  ".local-chromium"
);

if (!fs.existsSync(chromiumPath)) {
  console.log("❌ Chromium not found. Installing...");

  try {
    // Force download Chromium
    console.log("⬇️ Downloading Chromium...");
    execSync("npx puppeteer browsers install chrome", {
      stdio: "inherit",
      cwd: __dirname,
    });

    console.log("✅ Chromium downloaded successfully");
  } catch (error) {
    console.error("❌ Failed to download Chromium:", error.message);

    // Try alternative method
    try {
      console.log("🔄 Trying alternative download method...");
      execSync("npm rebuild puppeteer", {
        stdio: "inherit",
        cwd: __dirname,
      });
      console.log("✅ Chromium installation completed via rebuild");
    } catch (rebuildError) {
      console.error("❌ Alternative method also failed:", rebuildError.message);
      process.exit(1);
    }
  }
} else {
  console.log("✅ Chromium found - ready for bundling");
}

// Verify Chromium directories exist
const chromiumDirs = fs
  .readdirSync(chromiumPath, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

if (chromiumDirs.length === 0) {
  console.error("❌ Chromium directory exists but appears empty");
  process.exit(1);
}

console.log(
  `✅ Found ${chromiumDirs.length} Chromium version(s):`,
  chromiumDirs
);
console.log("🚀 Ready to build with bundled Chromium!");
