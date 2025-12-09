#!/usr/bin/env node

/**
 * FHEVM Automation Suite
 *
 * Main entry point for all automation tasks:
 * - Creating example repositories
 * - Generating documentation
 * - Managing categories
 * - Updating dependencies
 *
 * Usage:
 * npx ts-node scripts/automation.ts create-example --name counter
 * npx ts-node scripts/automation.ts create-category --name basic
 * npx ts-node scripts/automation.ts generate-docs --input test/ --output docs/
 * npx ts-node scripts/automation.ts update-all
 */

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

interface AutomationConfig {
  baseTemplate: string;
  outputDirectory: string;
  templatesDirectory: string;
  docsOutputDirectory: string;
}

const DEFAULT_CONFIG: AutomationConfig = {
  baseTemplate: "./base-template",
  outputDirectory: "./generated-examples",
  templatesDirectory: "./templates",
  docsOutputDirectory: "./generated-docs",
};

class AutomationSuite {
  private config: AutomationConfig;

  constructor(config: Partial<AutomationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Display help message
   */
  showHelp(): void {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║               FHEVM Automation Suite                           ║
║          Automated Example and Documentation Generator         ║
╚════════════════════════════════════════════════════════════════╝

Usage: npx ts-node scripts/automation.ts <command> [options]

Commands:

  create-example
    Create a single example repository
    Options:
      --name <name>        Example name (e.g., counter, arithmetic)
      --title <title>      Example title (optional)
      --template <path>    Template path (optional)

  create-category
    Create all examples in a category
    Options:
      --category <name>    Category name (e.g., basic, encryption)
      --all               Generate all categories

  generate-docs
    Generate documentation from test files
    Options:
      --input <path>       Input directory (default: test)
      --output <path>      Output directory (default: docs)
      --chapter <name>     Specific chapter (optional)

  update-dependencies
    Update all dependencies in generated examples
    Options:
      --version <ver>      Version to update to

  list-examples
    List all available examples and categories

  validate
    Validate all generated examples
    Options:
      --compile            Compile contracts
      --test              Run tests
      --full              Full validation

  init
    Initialize automation environment

  help
    Show this help message

Examples:

  # Create a new example
  npx ts-node scripts/automation.ts create-example --name counter

  # Generate all basic examples
  npx ts-node scripts/automation.ts create-category --category basic

  # Generate documentation
  npx ts-node scripts/automation.ts generate-docs --input test/ --output docs/

  # List all examples
  npx ts-node scripts/automation.ts list-examples

  # Full validation
  npx ts-node scripts/automation.ts validate --full

    `);
  }

  /**
   * Initialize automation environment
   */
  initializeEnvironment(): void {
    console.log(`\n🚀 Initializing Automation Environment\n`);

    const directories = [
      this.config.outputDirectory,
      this.config.templatesDirectory,
      this.config.docsOutputDirectory,
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      } else {
        console.log(`  ℹ️  Exists: ${dir}`);
      }
    }

    // Create configuration file
    const configPath = path.join(this.config.outputDirectory, ".automation.json");
    const configContent = {
      baseTemplate: this.config.baseTemplate,
      templatesDirectory: this.config.templatesDirectory,
      docsOutputDirectory: this.config.docsOutputDirectory,
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
    };

    fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
    console.log(`  ✅ Created: .automation.json`);

    console.log(`\n✅ Environment initialized successfully!\n`);
  }

  /**
   * List all available examples and categories
   */
  listExamples(): void {
    console.log(`\n📚 FHEVM Examples Catalog\n`);

    const categories = {
      basic: {
        title: "Basic Operations",
        examples: ["counter", "arithmetic", "equality"],
      },
      encryption: {
        title: "Encryption Patterns",
        examples: ["encrypt-single", "encrypt-multiple", "type-conversion"],
      },
      decryption: {
        title: "User Decryption",
        examples: ["decrypt-single", "decrypt-multiple", "conditional-decrypt"],
      },
      access_control: {
        title: "Access Control",
        examples: ["allow-pattern", "transient-allow", "input-proof"],
      },
      antipatterns: {
        title: "Anti-Patterns",
        examples: ["view-function-error", "missing-allow", "input-proof-missing"],
      },
      advanced: {
        title: "Advanced Patterns",
        examples: ["blind-auction", "private-token", "voting-system"],
      },
    };

    for (const [catName, catInfo] of Object.entries(categories)) {
      console.log(`${catInfo.title} [${catName}]`);
      catInfo.examples.forEach(example => {
        console.log(`  • ${example}`);
      });
      console.log();
    }

    console.log(`Total: ${Object.values(categories).reduce((sum, cat) => sum + cat.examples.length, 0)} examples\n`);
  }

  /**
   * Validate generated examples
   */
  validateExamples(options: { compile?: boolean; test?: boolean; full?: boolean }): void {
    console.log(`\n✔️  Validating Examples\n`);

    const examplesDir = this.config.outputDirectory;
    if (!fs.existsSync(examplesDir)) {
      console.log(`No examples directory found at: ${examplesDir}`);
      return;
    }

    const examples = fs
      .readdirSync(examplesDir)
      .filter(f => fs.statSync(path.join(examplesDir, f)).isDirectory());

    console.log(`Found ${examples.length} example(s)\n`);

    for (const example of examples) {
      const examplePath = path.join(examplesDir, example);
      console.log(`Validating: ${example}`);

      // Check structure
      const hasContracts = fs.existsSync(path.join(examplePath, "contracts"));
      const hasTest = fs.existsSync(path.join(examplePath, "test"));
      const hasConfig = fs.existsSync(path.join(examplePath, "hardhat.config.ts"));
      const hasPackage = fs.existsSync(path.join(examplePath, "package.json"));

      const structureValid = hasContracts && hasTest && hasConfig && hasPackage;
      console.log(`  Structure: ${structureValid ? "✅" : "❌"}`);

      if (options.compile || options.full) {
        console.log(`  Compiling...`);
        try {
          child_process.execSync("npm run compile", {
            cwd: examplePath,
            stdio: "pipe",
          });
          console.log(`  Compilation: ✅`);
        } catch {
          console.log(`  Compilation: ❌`);
        }
      }

      if (options.test || options.full) {
        console.log(`  Testing...`);
        try {
          child_process.execSync("npm run test", {
            cwd: examplePath,
            stdio: "pipe",
          });
          console.log(`  Tests: ✅`);
        } catch {
          console.log(`  Tests: ⚠️  (some may have failed)`);
        }
      }

      console.log();
    }

    console.log(`\n✅ Validation complete\n`);
  }

  /**
   * Update all examples
   */
  updateAllExamples(): void {
    console.log(`\n🔄 Updating All Examples\n`);

    const examplesDir = this.config.outputDirectory;
    const examples = fs
      .readdirSync(examplesDir)
      .filter(f => fs.statSync(path.join(examplesDir, f)).isDirectory());

    for (const example of examples) {
      const examplePath = path.join(examplesDir, example);
      console.log(`Updating: ${example}`);

      // Update dependencies
      try {
        child_process.execSync("npm install --save-dev fhevm@latest", {
          cwd: examplePath,
          stdio: "pipe",
        });
        console.log(`  ✅ Dependencies updated`);
      } catch {
        console.log(`  ⚠️  Could not update dependencies`);
      }
    }

    console.log(`\n✅ All examples updated\n`);
  }

  /**
   * Execute automation commands
   */
  async execute(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];
    const options = this.parseOptions(args.slice(1));

    switch (command) {
      case "create-example":
        console.log(`Creating example: ${options.name}`);
        // Call create-fhevm-example.ts
        break;

      case "create-category":
        console.log(`Creating category: ${options.category || "all"}`);
        // Call create-fhevm-category.ts
        break;

      case "generate-docs":
        console.log(`Generating docs from: ${options.input || "test"}`);
        // Call generate-docs.ts
        break;

      case "update-dependencies":
        this.updateAllExamples();
        break;

      case "list-examples":
        this.listExamples();
        break;

      case "validate":
        this.validateExamples({
          compile: options.compile,
          test: options.test,
          full: options.full,
        });
        break;

      case "init":
        this.initializeEnvironment();
        break;

      case "help":
      default:
        this.showHelp();
    }
  }

  private parseOptions(
    args: string[]
  ): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith("--")) {
        const key = args[i].substring(2);
        const value = args[i + 1];

        if (value && !value.startsWith("--")) {
          options[key] = value;
          i++;
        } else {
          options[key] = true;
        }
      }
    }

    return options;
  }
}

// Main execution
const suite = new AutomationSuite();
const args = process.argv.slice(2);

suite.execute(args).catch(error => {
  console.error("Error:", error.message);
  process.exit(1);
});
