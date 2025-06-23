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
   * NEW: Identify functions that are already migrated (wrapper functions)
   * These only contain a single call to a helper function
   */
  identifyWrapperFunctions() {
    this.wrapperFunctions = [];

    this.functions.forEach((funcName) => {
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
   * Extract the body of a specific function
   */
  extractFunctionBody(funcName) {
    const funcRegex = new RegExp(
      `${funcName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)^\\s*\\}`,
      "gm"
    );

    const match = funcRegex.exec(this.content);
    return match ? match[1].trim() : "";
  }

  /**
   * Check if a function is a wrapper (only calls helper)
   */
  isWrapperFunction(funcBody) {
    // Remove comments and whitespace
    const cleanBody = funcBody
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Check for common wrapper patterns (updated for all helpers)
    const wrapperPatterns = [
      /^(return\s+)?window\.UIStateManager\./,
      /^(return\s+)?window\.IPCCommunication\./,
      /^(return\s+)?this\.helpers\./,
      /^(return\s+)?window\.DOMHelpers\./,
      /^(return\s+)?window\.EventHandlers\./,
      /^(return\s+)?window\.AppHelpers/,
      /^(return\s+)?window\.FormatHelpers\./,
      /^(return\s+)?window\.ChartVisualization\./,
      /^(return\s+)?window\.PortfolioCalculations\./,
      /^(return\s+)?window\.Config\./,
      /^(return\s+)?window\.HTMLGenerators\./,
      /^(return\s+)?this\.htmlGenerators\./,
      /^(return\s+)?this\.chartVisualization\./,
      /^(return\s+)?this\.portfolioCalculations\./,
    ];

    // If the function body matches a wrapper pattern and is short
    return (
      wrapperPatterns.some((pattern) => pattern.test(cleanBody)) &&
      cleanBody.length < 100
    ); // Simple wrapper functions should be short
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
