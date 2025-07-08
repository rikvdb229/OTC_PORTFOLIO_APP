const fs = require("fs");

function analyzeCurrentRenderer() {
  try {
    const content = fs.readFileSync("renderer.js", "utf8");

    // Find all method definitions
    const methodRegex = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
    const methods = [];
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];

      // Skip constructor and obvious non-methods
      if (
        methodName !== "constructor" &&
        methodName !== "if" &&
        methodName !== "for" &&
        methodName !== "while" &&
        methodName !== "catch" &&
        methodName !== "then"
      ) {
        methods.push(methodName);
      }
    }

    console.log("🔍 CURRENT METHODS IN RENDERER.JS:");
    console.log("================================");
    console.log(`Total methods found: ${methods.length}`);
    console.log("");

    methods.forEach((method, i) => {
      console.log(`${i + 1}. ${method}()`);
    });

    console.log("");
    console.log("💡 NEXT EXTRACTION SUGGESTIONS:");
    console.log("================================");

    // Categorize remaining methods
    const simpleWrappers = methods.filter(
      (m) =>
        m.includes("update") && (m.includes("Table") || m.includes("Stats"))
    );

    const domMethods = methods.filter(
      (m) => m.includes("initialize") || m.includes("Element")
    );

    const utilityMethods = methods.filter(
      (m) => m.includes("check") || m.includes("debug") || m.includes("sort")
    );

    if (simpleWrappers.length > 0) {
      console.log("✅ SIMPLE WRAPPERS (safe to extract):");
      simpleWrappers.forEach((m) => console.log(`   - ${m}()`));
    }

    if (utilityMethods.length > 0) {
      console.log("⚠️ UTILITY METHODS (medium risk):");
      utilityMethods.forEach((m) => console.log(`   - ${m}()`));
    }

    if (domMethods.length > 0) {
      console.log("🔴 DOM METHODS (higher risk):");
      domMethods.forEach((m) => console.log(`   - ${m}()`));
    }

    console.log("");
    console.log("📋 RECOMMENDED NEXT STEP:");
    console.log("Extract the simplest methods first (update/wrapper methods)");
  } catch (error) {
    console.error("Error reading renderer.js:", error.message);
    console.log("");
    console.log(
      "📝 ALTERNATIVE: Please copy/paste the method names from your renderer.js"
    );
    console.log(
      "Look for lines that start with method names followed by parentheses:"
    );
    console.log("Example: methodName() {");
  }
}

// Run the analysis
analyzeCurrentRenderer();
