#!/usr/bin/env node

/**
 * ===== IMPROVED EXISTING HELPERS ANALYZER - PORTFOLIO TRACKER =====
 * Analyzes renderer.js functions and maps them to existing helper files
 * NOW IGNORES WRAPPER FUNCTIONS (already migrated functions)
 *
 * USAGE: node existing-helpers-analyzer.js
 *
 * This will identify which functions should move to which existing helper files:
 * - ui-state-management.js (modals, tabs, notifications)
 * - ipc-communication.js (data loading, IPC calls)
 * - app-helpers.js (simple business logic)
 * - dom-helpers.js (DOM manipulation)
 * - event-handlers.js (event handling)
 */

const fs = require("fs");
const path = require("path");

class ExistingHelpersAnalyzer {
  constructor() {
    this.rendererPath = path.join(process.cwd(), "renderer.js");
    this.functions = [];
    this.wrapperFunctions = [];

    // Map of existing helper files and their purposes
    this.existingHelpers = {
      "ui-state-management.js": {
        purpose: "Modals, tabs, notifications, UI state",
        sections: [
          "ModalManager",
          "TabManager",
          "Notifications",
          "ActionButtons",
        ],
        patterns: [
          /modal/i,
          /tab/i,
          /notification/i,
          /show.*Modal/i,
          /close.*Modal/i,
          /hide/i,
          /toggle/i,
        ],
      },
      "ipc-communication.js": {
        purpose: "IPC calls, data loading from main process",
        sections: ["Portfolio", "Settings", "Database"],
        patterns: [
          /load.*Data/i,
          /get.*Data/i,
          /save.*Data/i,
          /ipc/i,
          /invoke/i,
          /check.*Status/i,
        ],
      },
      "app-helpers.js": {
        purpose: "Simple business logic wrappers",
        sections: ["AppHelpers class methods"],
        patterns: [
          /format/i,
          /calculate/i,
          /validate/i,
          /process/i,
          /confirm/i,
          /update.*(?!Modal)/i,
        ],
      },
      "dom-helpers.js": {
        purpose: "DOM manipulation and element management",
        sections: ["DOM utilities"],
        patterns: [
          /element/i,
          /attach.*Listener/i,
          /setup.*Listener/i,
          /initialize.*Element/i,
          /query/i,
          /selector/i,
        ],
      },
      "event-handlers.js": {
        purpose: "Event listener setup and handling",
        sections: ["Event handler groups"],
        patterns: [
          /event/i,
          /listener/i,
          /handler/i,
          /click/i,
          /attach.*Event/i,
        ],
      },
      "formatters.js": {
        purpose: "Data formatting and display utilities",
        sections: ["FormatHelpers class methods"],
        patterns: [/format/i, /currency/i, /date/i, /percentage/i, /number/i],
      },
      "chart-visualization.js": {
        purpose: "Chart creation and data visualization",
        sections: ["Chart utilities and rendering"],
        patterns: [
          /chart/i,
          /graph/i,
          /visual/i,
          /plot/i,
          /render.*Chart/i,
          /create.*Chart/i,
        ],
      },
      "portfolio-calculations.js": {
        purpose: "Business logic calculations",
        sections: ["Portfolio math and calculations"],
        patterns: [
          /calculate/i,
          /compute/i,
          /math/i,
          /total/i,
          /sum/i,
          /average/i,
          /percentage/i,
          /profit/i,
          /loss/i,
        ],
      },
      "config.js": {
        purpose: "Configuration and settings management",
        sections: ["Config utilities"],
        patterns: [/config/i, /setting/i, /preference/i, /option/i],
      },
      "html-generators.js": {
        purpose: "HTML generation and table rendering (ui/ folder)",
        sections: ["HTMLGenerators class methods"],
        patterns: [
          /render/i,
          /generate/i,
          /html/i,
          /table/i,
          /row/i,
          /cell/i,
          /template/i,
        ],
      },
    };

    // Known migrated functions (manually curated list)
    this.knownMigratedFunctions = [
      "toggleNotes",
      "openSettings",
      "closeSettingsPanel",
      "closeModals",
      "updatePortfolioStats",
      "showPriceUpdateNotification",
      "hidePriceUpdateNotification",
      "updateActionButtons",
      "getSellingStatusText",
      "showDeleteConfirmModal",
      "showAddOptionsModal",
      "showMergeGrantsModal",
      "showSellModal",
      "showDeleteDatabaseModal",
      "checkPriceUpdateStatus",
    ];
  }

  analyze() {
    console.log("🎯 IMPROVED EXISTING HELPERS ANALYZER");
    console.log("====================================\n");

    try {
      this.extractFunctions();
      this.identifyWrapperFunctions();
      this.categorizeFunctions();
      this.generateMigrationPlan();
      this.createImplementationGuide();
    } catch (error) {
      console.error("❌ Analysis failed:", error.message);
      this.suggestManualReview();
    }
  }

  extractFunctions() {
    if (!fs.existsSync(this.rendererPath)) {
      throw new Error("renderer.js not found");
    }

    const content = fs.readFileSync(this.rendererPath, "utf8");
    this.content = content;

    // Extract function definitions more precisely
    const functionPattern =
      /^\s*(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm;
    const found = new Set();
    let match;

    while ((match = functionPattern.exec(content)) !== null) {
      const funcName = match[1];

      // Skip obvious non-methods
      if (this.isValidFunction(funcName)) {
        found.add(funcName);
      }
    }

    this.functions = Array.from(found);
    console.log(
      `📄 Analyzed renderer.js: found ${this.functions.length} functions\n`
    );
  }

  /**
   * IMPROVED: Identify functions that are already migrated (wrapper functions)
   * Uses both pattern detection AND known migrated function list
   */
  identifyWrapperFunctions() {
    this.wrapperFunctions = [];

    this.functions.forEach((funcName) => {
      // Check if it's in our known migrated list
      if (this.knownMigratedFunctions.includes(funcName)) {
        this.wrapperFunctions.push(funcName);
        return;
      }

      // Check if it's a wrapper function by analyzing the body
      const funcBody = this.extractFunctionBody(funcName);
      if (this.isWrapperFunction(funcBody)) {
        this.wrapperFunctions.push(funcName);
      }
    });

    // Remove wrapper functions from the main functions list
    this.functions = this.functions.filter(
      (func) => !this.wrapperFunctions.includes(func)
    );

    if (this.wrapperFunctions.length > 0) {
      console.log("✅ ALREADY MIGRATED (Wrapper Functions):");
      this.wrapperFunctions.forEach((func, i) => {
        console.log(`   ${i + 1}. ${func}() - ✅ Already moved to helper`);
      });
      console.log("");
    }

    console.log(
      `🔍 Functions still needing migration: ${this.functions.length}`
    );
    console.log("");
  }

  /**
   * Extract the body of a specific function with better bracket matching
   */
  extractFunctionBody(funcName) {
    const lines = this.content.split("\n");
    let inFunction = false;
    let bracketCount = 0;
    let funcBody = [];
    let startFound = false;

    // Create regex to match function start
    const funcStartRegex = new RegExp(
      `^\\s*(?:async\\s+)?${funcName}\\s*\\([^)]*\\)\\s*\\{`
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inFunction && funcStartRegex.test(line)) {
        inFunction = true;
        startFound = true;
        // Count opening braces in the function declaration line
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        bracketCount = openBraces - closeBraces;
        continue;
      }

      if (inFunction) {
        // Count braces in current line
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        bracketCount += openBraces - closeBraces;

        // If we haven't closed all braces, add this line to function body
        if (bracketCount > 0) {
          funcBody.push(line);
        } else {
          // Function ended
          break;
        }
      }
    }

    return funcBody.join("\n").trim();
  }

  /**
   * IMPROVED: Check if a function is a wrapper (only calls helper)
   */
  isWrapperFunction(funcBody) {
    if (!funcBody) return false;

    // Remove comments and normalize whitespace
    const cleanBody = funcBody
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // If body is empty or very short, might be a wrapper
    if (cleanBody.length === 0) return false;

    // Check for common wrapper patterns
    const wrapperPatterns = [
      /window\.UIStateManager\./,
      /window\.IPCCommunication\./,
      /this\.helpers\./,
      /window\.DOMHelpers\./,
      /window\.EventHandlers\./,
      /window\.AppHelpers/,
      /window\.FormatHelpers\./,
      /window\.ChartVisualization\./,
      /window\.PortfolioCalculations\./,
      /window\.Config\./,
      /window\.HTMLGenerators\./,
      /this\.htmlGen\./,
    ];

    // Check if the function body contains mainly helper calls
    const hasHelperCall = wrapperPatterns.some((pattern) =>
      pattern.test(cleanBody)
    );

    // Check if it's a simple function (few lines, mostly helper calls)
    const lines = cleanBody
      .split(/[;\n]/)
      .filter((line) => line.trim().length > 0);
    const isSimple = lines.length <= 3; // Simple functions have 3 or fewer statements

    return hasHelperCall && isSimple;
  }

  isValidFunction(name) {
    const skipList = [
      "constructor",
      "if",
      "for",
      "while",
      "catch",
      "then",
      "else",
      "try",
      "finally",
      "switch",
      "case",
      "return",
      "function",
    ];

    return !skipList.includes(name) && name.length > 1;
  }

  categorizeFunctions() {
    this.categorized = {};
    this.uncategorized = [];

    // Initialize categories
    Object.keys(this.existingHelpers).forEach((helper) => {
      this.categorized[helper] = [];
    });

    this.functions.forEach((funcName) => {
      let categorized = false;

      // Try to match function to existing helper file
      for (const [helperFile, config] of Object.entries(this.existingHelpers)) {
        if (this.matchesHelper(funcName, config.patterns)) {
          this.categorized[helperFile].push(funcName);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        this.uncategorized.push(funcName);
      }
    });
  }

  matchesHelper(funcName, patterns) {
    return patterns.some((pattern) => pattern.test(funcName));
  }

  generateMigrationPlan() {
    console.log("📋 MIGRATION PLAN TO EXISTING HELPERS");
    console.log("=====================================\n");

    let totalFunctionsToMove = 0;

    Object.entries(this.categorized).forEach(([helperFile, functions]) => {
      if (functions.length > 0) {
        const config = this.existingHelpers[helperFile];
        console.log(`📁 ${helperFile}`);
        console.log(`   Purpose: ${config.purpose}`);
        console.log(`   Functions to move (${functions.length}):`);

        functions.forEach((func, i) => {
          const risk = this.assessRisk(func);
          const riskIcon =
            risk === "low" ? "✅" : risk === "medium" ? "⚠️" : "🔴";
          console.log(`      ${i + 1}. ${riskIcon} ${func}() - ${risk} risk`);
        });
        console.log("");
        totalFunctionsToMove += functions.length;
      }
    });

    if (this.uncategorized.length > 0) {
      console.log("❓ UNCATEGORIZED FUNCTIONS");
      console.log("   These need manual review:");
      this.uncategorized.forEach((func, i) => {
        console.log(`      ${i + 1}. ${func}() - manual categorization needed`);
      });
      console.log("");
      totalFunctionsToMove += this.uncategorized.length;
    }

    console.log(`📊 SUMMARY:`);
    console.log(
      `   ✅ Already migrated: ${this.wrapperFunctions.length} functions`
    );
    console.log(
      `   🔄 Still need migration: ${totalFunctionsToMove} functions`
    );
    console.log(
      `   📄 Total functions analyzed: ${this.wrapperFunctions.length + totalFunctionsToMove}`
    );
    console.log("");
  }

  assessRisk(funcName) {
    // Simple risk assessment based on function name patterns
    const lowRisk = [/^show/, /^hide/, /^close/, /^format/, /^get/, /^check/];
    const highRisk = [/initialize/, /setup/, /attach/, /constructor/];

    if (lowRisk.some((pattern) => pattern.test(funcName))) return "low";
    if (highRisk.some((pattern) => pattern.test(funcName))) return "high";
    return "medium";
  }

  createImplementationGuide() {
    console.log("🛠️ IMPLEMENTATION GUIDE");
    console.log("=======================\n");

    console.log("📅 RECOMMENDED ORDER (Safest First):");
    console.log("");

    // Day 1: Lowest risk functions
    const day1Functions = [];
    Object.entries(this.categorized).forEach(([helper, functions]) => {
      functions.forEach((func) => {
        if (this.assessRisk(func) === "low") {
          day1Functions.push({ func, helper });
        }
      });
    });

    if (day1Functions.length > 0) {
      console.log("🎯 NEXT TO MIGRATE - LOW RISK (Safe to start):");
      day1Functions.forEach(({ func, helper }, i) => {
        console.log(`   ${i + 1}. Move ${func}() → ${helper}`);
      });
      console.log("");
    }

    // Day 2: Medium risk functions
    const day2Functions = [];
    Object.entries(this.categorized).forEach(([helper, functions]) => {
      functions.forEach((func) => {
        if (this.assessRisk(func) === "medium") {
          day2Functions.push({ func, helper });
        }
      });
    });

    if (day2Functions.length > 0) {
      console.log("⚠️ MEDIUM RISK (After low risk ones):");
      day2Functions.forEach(({ func, helper }, i) => {
        console.log(`   ${i + 1}. Move ${func}() → ${helper}`);
      });
      console.log("");
    }

    // Day 3: High risk functions
    const day3Functions = [];
    Object.entries(this.categorized).forEach(([helper, functions]) => {
      functions.forEach((func) => {
        if (this.assessRisk(func) === "high") {
          day3Functions.push({ func, helper });
        }
      });
    });

    if (day3Functions.length > 0) {
      console.log("🔴 HIGH RISK (Expert level):");
      day3Functions.forEach(({ func, helper }, i) => {
        console.log(`   ${i + 1}. Move ${func}() → ${helper}`);
      });
      console.log("");
    }

    // Show next recommended function
    if (day1Functions.length > 0) {
      const nextFunc = day1Functions[0];
      console.log("🎯 NEXT RECOMMENDED FUNCTION TO MIGRATE:");
      console.log(`   ${nextFunc.func}() → ${nextFunc.helper}`);
      console.log(`   Risk: LOW ✅`);
      console.log("");
    }

    this.generateSpecificInstructions();
  }

  generateSpecificInstructions() {
    console.log("📝 SPECIFIC MIGRATION STEPS");
    console.log("===========================\n");

    console.log("🔧 For each function migration:");
    console.log("");
    console.log("1. BACKUP:");
    console.log(
      '   git add . && git commit -m "Backup before moving [function]"'
    );
    console.log("");
    console.log("2. MOVE FUNCTION:");
    console.log("   a. Copy function from renderer.js");
    console.log("   b. Add to appropriate section in helper file");
    console.log("   c. Add app parameter: functionName(app) { ... }");
    console.log('   d. Replace "this" with "app" inside function');
    console.log("");
    console.log("3. UPDATE RENDERER.JS:");
    console.log("   Replace method body with helper call:");
    console.log("   functionName() {");
    console.log("     window.HelperName.functionName(this);");
    console.log("   }");
    console.log("");
    console.log("4. TEST:");
    console.log("   npm start");
    console.log("   Test the specific functionality");
    console.log("   Check console for errors");
    console.log("");
    console.log("5. COMMIT:");
    console.log('   git add . && git commit -m "Move: [function] to [helper]"');
    console.log("");
  }

  suggestManualReview() {
    console.log("\n📋 MANUAL REVIEW NEEDED");
    console.log("=======================\n");

    console.log("Please review renderer.js manually and identify:");
    console.log("1. Modal-related functions → ui-state-management.js");
    console.log("2. Data loading functions → ipc-communication.js");
    console.log("3. Simple business logic → app-helpers.js");
    console.log("4. DOM manipulation → dom-helpers.js");
    console.log("5. Event handling → event-handlers.js\n");

    console.log("Start with the simplest functions first!");
  }
}

// Create analyzer instance and run
const analyzer = new ExistingHelpersAnalyzer();
analyzer.analyze();
