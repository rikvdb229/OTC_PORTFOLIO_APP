// ESLint v9+ flat configuration for Electron app (CommonJS)
const js = require("@eslint/js");

module.exports = [
  // Apply to all JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs", // Since you're using require()
      globals: {
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",

        // Browser globals for renderer process
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        FormData: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        Chart: "readonly", // Chart.js

        // Electron globals
        ipcRenderer: "readonly",
        ipcMain: "readonly",

        // Your app globals (defined in other files)
        app: "readonly",
        FormatHelpers: "readonly",
        TabManager: "readonly",
        TableManager: "readonly",
        ModalManager: "readonly",
        NotificationManager: "readonly",
        SettingsManager: "readonly",
        EvolutionOperations: "readonly",
        getReturnClass: "readonly",
        confirmEditSale: "readonly",
        currentState: "readonly",
        originalPlaceholder: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      // Adjust rules for your project
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_|^e$|^error$|^event$",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off", // Keep console for Electron debugging
      "prefer-const": "warn",
      "no-var": "warn",

      // Allow duplicate keys/methods during refactoring
      "no-dupe-keys": "warn",
      "no-dupe-class-members": "warn",

      // Common issues in your codebase
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unreachable": "warn",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "chrome-portable/**",
      "libs/**", // Your external libraries
      "*.min.js",
      "simple-chrome-setup.js", // Temporarily ignore setup files
      "test-chrome-simple.js",
      "css-migration.js", // Migration script
    ],
  },
];
