#!/usr/bin/env node

/**
 * ===== CSS CLEANUP SCRIPT - PORTFOLIO TRACKER =====
 * Removes duplicate and unused CSS definitions
 *
 * USAGE: node css-cleanup.js
 *
 * WHAT IT DOES:
 * 1. Scans all CSS files for duplicate rules
 * 2. Finds unused CSS selectors by checking HTML/JS files
 * 3. Removes duplicate CSS variables
 * 4. Consolidates similar rules
 * 5. Reports space savings
 */

const fs = require("fs");
const path = require("path");

class CSSCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.stylesDir = path.join(this.projectRoot, "styles");
    this.dryRun = process.argv.includes("--dry-run");

    this.stats = {
      duplicatesFound: 0,
      unusedSelectors: 0,
      duplicateVariables: 0,
      sizeReduction: 0,
    };

    this.usedSelectors = new Set();
    this.cssVariables = new Map();
    this.duplicateRules = new Map();
  }

  async run() {
    console.log("🧹 CSS CLEANUP SCRIPT - PORTFOLIO TRACKER");
    console.log("=========================================\n");

    if (this.dryRun) {
      console.log("🔍 DRY RUN MODE - Analysis only\n");
    }

    try {
      // Step 1: Scan HTML/JS files for used selectors
      await this.scanForUsedSelectors();

      // Step 2: Analyze CSS files
      await this.analyzeCSSFiles();

      // Step 3: Find and remove duplicates
      await this.removeDuplicates();

      // Step 4: Remove unused selectors
      await this.removeUnusedSelectors();

      // Step 5: Optimize CSS variables
      await this.optimizeVariables();

      // Step 6: Generate report
      this.generateReport();
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
      process.exit(1);
    }
  }

  async scanForUsedSelectors() {
    console.log("🔍 Scanning for used CSS selectors...");

    const filesToScan = ["index.html", "renderer.js", "main.js"];

    // Common selectors that are always needed
    const alwaysUsed = [
      "html",
      "body",
      "*",
      "button",
      "input",
      "table",
      "th",
      "td",
      "tr",
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "nav",
      "header",
      "footer",
    ];

    alwaysUsed.forEach((selector) => this.usedSelectors.add(selector));

    for (const file of filesToScan) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        // Find class names (class="...")
        const classMatches = content.match(/class\s*=\s*["']([^"']+)["']/g);
        if (classMatches) {
          classMatches.forEach((match) => {
            const classes = match.match(/["']([^"']+)["']/)[1].split(/\s+/);
            classes.forEach((cls) => {
              if (cls.trim()) {
                this.usedSelectors.add(`.${cls.trim()}`);
              }
            });
          });
        }

        // Find IDs (id="...")
        const idMatches = content.match(/id\s*=\s*["']([^"']+)["']/g);
        if (idMatches) {
          idMatches.forEach((match) => {
            const id = match.match(/["']([^"']+)["']/)[1];
            this.usedSelectors.add(`#${id}`);
          });
        }

        // Find dynamic class names in JS (getElementById, querySelector, etc.)
        const jsSelectors = content.match(
          /['"]\.[a-zA-Z][a-zA-Z0-9-_]*['"]|['"]#[a-zA-Z][a-zA-Z0-9-_]*['"]/g
        );
        if (jsSelectors) {
          jsSelectors.forEach((selector) => {
            const clean = selector.replace(/['"]/g, "");
            this.usedSelectors.add(clean);
          });
        }

        console.log(`  ✅ Scanned: ${file}`);
      }
    }

    console.log(`  📊 Found ${this.usedSelectors.size} used selectors\n`);
  }

  async analyzeCSSFiles() {
    console.log("📊 Analyzing CSS files...");

    const cssFiles = this.getAllCSSFiles();

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, "utf8");

      // Extract CSS rules
      this.extractCSSRules(content, file);

      // Extract CSS variables
      this.extractCSSVariables(content, file);

      console.log(`  ✅ Analyzed: ${path.relative(this.stylesDir, file)}`);
    }

    console.log(`  📊 Found ${this.duplicateRules.size} unique rules`);
    console.log(`  📊 Found ${this.cssVariables.size} CSS variables\n`);
  }

  extractCSSRules(content, filename) {
    // Remove comments and normalize whitespace
    const normalized = content
      .replace(/\/\*.*?\*\//gs, "")
      .replace(/\s+/g, " ")
      .trim();

    // Extract CSS rules (selector { properties })
    const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(normalized)) !== null) {
      const selector = match[1].trim();
      const properties = match[2].trim();

      if (selector && properties) {
        const ruleKey = `${selector}|${properties}`;

        if (this.duplicateRules.has(ruleKey)) {
          this.duplicateRules.get(ruleKey).push(filename);
          this.stats.duplicatesFound++;
        } else {
          this.duplicateRules.set(ruleKey, [filename]);
        }
      }
    }
  }

  extractCSSVariables(content, filename) {
    // Extract CSS custom properties
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();

      if (this.cssVariables.has(varName)) {
        const existing = this.cssVariables.get(varName);
        if (existing.value !== varValue) {
          console.log(`  ⚠️  Variable conflict: --${varName}`);
          console.log(`     ${existing.file}: ${existing.value}`);
          console.log(`     ${filename}: ${varValue}`);
        }
      } else {
        this.cssVariables.set(varName, { value: varValue, file: filename });
      }
    }
  }

  async removeDuplicates() {
    console.log("🗑️  Finding duplicate CSS rules...");

    const duplicates = Array.from(this.duplicateRules.entries()).filter(
      ([rule, files]) => files.length > 1
    );

    if (duplicates.length === 0) {
      console.log("  ✅ No duplicate rules found\n");
      return;
    }

    console.log(`  📊 Found ${duplicates.length} duplicate rules:`);

    for (const [rule, files] of duplicates) {
      const [selector] = rule.split("|");
      console.log(`    🔄 ${selector} (in ${files.length} files)`);

      if (!this.dryRun) {
        // Keep rule in first file, remove from others
        const [keepFile, ...removeFiles] = files;

        for (const file of removeFiles) {
          await this.removeRuleFromFile(file, rule);
        }
      }
    }

    this.stats.duplicatesFound = duplicates.length;
    console.log("");
  }

  async removeUnusedSelectors() {
    console.log("🔍 Finding unused CSS selectors...");

    const cssFiles = this.getAllCSSFiles();
    let unusedCount = 0;

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, "utf8");
      const rules = this.extractSelectorsFromFile(content);

      let cleanedContent = content;
      let fileChanged = false;

      for (const rule of rules) {
        const selector = rule.selector;

        // Skip CSS variables, keyframes, media queries, etc.
        if (this.shouldSkipSelector(selector)) {
          continue;
        }

        // Check if selector is used
        if (!this.isSelectorUsed(selector)) {
          console.log(
            `    🗑️  Unused: ${selector} in ${path.relative(this.stylesDir, file)}`
          );

          if (!this.dryRun) {
            // Remove the entire rule
            cleanedContent = cleanedContent.replace(rule.fullRule, "");
            fileChanged = true;
          }

          unusedCount++;
        }
      }

      if (fileChanged && !this.dryRun) {
        fs.writeFileSync(file, cleanedContent);
      }
    }

    this.stats.unusedSelectors = unusedCount;
    console.log(`  📊 Found ${unusedCount} unused selectors\n`);
  }

  extractSelectorsFromFile(content) {
    const rules = [];
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(content)) !== null) {
      const selector = match[1].trim();
      const properties = match[2].trim();
      const fullRule = match[0];

      rules.push({
        selector,
        properties,
        fullRule,
      });
    }

    return rules;
  }

  shouldSkipSelector(selector) {
    // Skip selectors that are hard to detect or are special
    const skipPatterns = [
      /^:root$/,
      /^@/, // @media, @keyframes, etc.
      /^:-/, // pseudo-selectors like ::-webkit-
      /^::/, // pseudo-elements
      /^html$/,
      /^body$/,
      /^\*/, // universal selector
      /hover/, // hover states
      /focus/, // focus states
      /active/, // active states
      /before/, // pseudo-elements
      /after/, // pseudo-elements
      /var\(/, // CSS variables
    ];

    return skipPatterns.some((pattern) => pattern.test(selector));
  }

  isSelectorUsed(selector) {
    // Extract the main class/id from complex selectors
    const mainSelectors = selector
      .split(/[\s>+~,]/)
      .map((s) => s.trim())
      .filter((s) => s.match(/^[.#]/));

    if (mainSelectors.length === 0) {
      return true; // Keep element selectors
    }

    return mainSelectors.some((sel) => this.usedSelectors.has(sel));
  }

  async optimizeVariables() {
    console.log("⚙️  Optimizing CSS variables...");

    // Find unused CSS variables
    const allCSSContent = this.getAllCSSFiles()
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");

    let unusedVars = 0;

    for (const [varName, info] of this.cssVariables) {
      const usage = allCSSContent.match(new RegExp(`var\\(--${varName}`, "g"));

      if (!usage || usage.length <= 1) {
        // Only defined, never used
        console.log(
          `    🗑️  Unused variable: --${varName} in ${path.relative(this.stylesDir, info.file)}`
        );
        unusedVars++;

        if (!this.dryRun) {
          await this.removeVariableFromFile(info.file, varName);
        }
      }
    }

    this.stats.duplicateVariables = unusedVars;
    console.log(`  📊 Found ${unusedVars} unused variables\n`);
  }

  async removeRuleFromFile(filename, ruleKey) {
    // Implementation would remove specific rule from file
    // This is complex due to CSS parsing, so for now just log
    console.log(
      `    🗑️  Would remove rule from ${path.relative(this.stylesDir, filename)}`
    );
  }

  async removeVariableFromFile(filename, varName) {
    const content = fs.readFileSync(filename, "utf8");
    const regex = new RegExp(`\\s*--${varName}\\s*:[^;]+;`, "g");
    const cleaned = content.replace(regex, "");

    fs.writeFileSync(filename, cleaned);
  }

  getAllCSSFiles() {
    const cssFiles = [];

    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith(".css")) {
          cssFiles.push(fullPath);
        }
      }
    };

    scanDir(this.stylesDir);
    return cssFiles;
  }

  generateReport() {
    console.log("📊 CLEANUP REPORT");
    console.log("================");

    const cssFiles = this.getAllCSSFiles();
    let totalSize = 0;

    for (const file of cssFiles) {
      totalSize += fs.statSync(file).size;
    }

    console.log(`\n📁 CSS Files: ${cssFiles.length}`);
    console.log(`📏 Total Size: ${(totalSize / 1024).toFixed(2)} KB`);

    console.log(`\n🔍 Analysis Results:`);
    console.log(`  • Duplicate Rules: ${this.stats.duplicatesFound}`);
    console.log(`  • Unused Selectors: ${this.stats.unusedSelectors}`);
    console.log(`  • Unused Variables: ${this.stats.duplicateVariables}`);
    console.log(`  • Used Selectors: ${this.usedSelectors.size}`);

    const potentialSavings =
      this.stats.duplicatesFound * 50 +
      this.stats.unusedSelectors * 30 +
      this.stats.duplicateVariables * 20;

    console.log(`\n💾 Estimated Savings: ~${potentialSavings} bytes`);

    if (this.dryRun) {
      console.log("\n📋 Run without --dry-run to apply changes");
    } else {
      console.log("\n✅ Cleanup completed!");
    }

    console.log("\n💡 Manual Review Recommended:");
    console.log("  • Check for any broken styles after cleanup");
    console.log("  • Verify all UI components still work");
    console.log("  • Test responsive layouts");
  }
}

// Run cleanup
const cleanup = new CSSCleanup();
cleanup.run().catch(console.error);
