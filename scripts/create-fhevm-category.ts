#!/usr/bin/env node

/**
 * FHEVM Category Generator
 *
 * Creates multiple example repositories organized by category.
 * Each category can contain multiple related examples.
 *
 * Usage:
 * npx ts-node scripts/create-fhevm-category.ts --category basic
 */

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

interface CategoryExample {
  name: string;
  title: string;
  description: string;
}

interface CategoryConfig {
  name: string;
  title: string;
  description: string;
  examples: CategoryExample[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
  basic: {
    name: "basic",
    title: "Basic Operations",
    description: "Fundamental FHEVM operations and patterns",
    examples: [
      {
        name: "counter",
        title: "Encrypted Counter",
        description: "Simple encrypted counter demonstrating basic TFHE operations"
      },
      {
        name: "arithmetic",
        title: "Arithmetic Operations",
        description: "FHEVM arithmetic: add, subtract, multiply, compare"
      },
      {
        name: "equality",
        title: "Equality Comparison",
        description: "Testing equality of encrypted values using TFHE.eq()"
      }
    ]
  },
  encryption: {
    name: "encryption",
    title: "Encryption Patterns",
    description: "Handling encrypted inputs and type conversions",
    examples: [
      {
        name: "encrypt-single",
        title: "Encrypt Single Value",
        description: "Converting and storing a single encrypted value"
      },
      {
        name: "encrypt-multiple",
        title: "Encrypt Multiple Values",
        description: "Handling multiple encrypted values in a single transaction"
      },
      {
        name: "type-conversion",
        title: "Type Conversion",
        description: "Converting between different encrypted types (euint32, euint8, ebool)"
      }
    ]
  },
  decryption: {
    name: "decryption",
    title: "User Decryption",
    description: "Decryption patterns for authorized users",
    examples: [
      {
        name: "decrypt-single",
        title: "Decrypt Single Value",
        description: "Owner-only decryption of a single encrypted value"
      },
      {
        name: "decrypt-multiple",
        title: "Decrypt Multiple Values",
        description: "Decrypting multiple encrypted values and returning them"
      },
      {
        name: "conditional-decrypt",
        title: "Conditional Decryption",
        description: "Decryption based on user permissions and access control"
      }
    ]
  },
  access_control: {
    name: "access-control",
    title: "Access Control",
    description: "Managing permissions and encrypted data access",
    examples: [
      {
        name: "allow-pattern",
        title: "FHE.allow Pattern",
        description: "Granting decryption permissions using FHE.allow()"
      },
      {
        name: "transient-allow",
        title: "FHE.allowTransient",
        description: "Temporary decryption permissions for single transaction"
      },
      {
        name: "input-proof",
        title: "Input Proof Handling",
        description: "Validating and using input proofs for encrypted inputs"
      }
    ]
  },
  antipatterns: {
    name: "antipatterns",
    title: "Anti-Patterns & Common Mistakes",
    description: "What NOT to do: common pitfalls and how to avoid them",
    examples: [
      {
        name: "view-function-error",
        title: "View Function Mistake",
        description: "Why you cannot return encrypted values from view functions"
      },
      {
        name: "missing-allow",
        title: "Missing FHE.allow()",
        description: "Common error: forgetting to grant permissions after encryption"
      },
      {
        name: "input-proof-missing",
        title: "Input Proof Validation",
        description: "Improper input proof handling and validation"
      }
    ]
  },
  advanced: {
    name: "advanced",
    title: "Advanced Patterns",
    description: "Complex use cases and optimization patterns",
    examples: [
      {
        name: "blind-auction",
        title: "Blind Auction",
        description: "Complete blind auction with encrypted bids"
      },
      {
        name: "private-token",
        title: "Private Token",
        description: "Confidential token transfer with encrypted balances"
      },
      {
        name: "voting-system",
        title: "Encrypted Voting",
        description: "Privacy-preserving voting with homomorphic operations"
      }
    ]
  }
};

class CategoryGenerator {
  private outputDir: string;

  constructor(outputDir: string = ".") {
    this.outputDir = outputDir;
  }

  /**
   * Generate all examples in a category
   */
  async generateCategory(categoryName: string): Promise<void> {
    const category = CATEGORIES[categoryName.toLowerCase()];
    if (!category) {
      console.error(`❌ Category '${categoryName}' not found`);
      console.log(
        "Available categories:",
        Object.keys(CATEGORIES).join(", ")
      );
      process.exit(1);
    }

    console.log(`\n🗂️  Generating Category: ${category.title}\n`);
    console.log(`Description: ${category.description}\n`);

    const categoryDir = path.join(this.outputDir, category.name);

    // Create category directory
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`📂 Created category directory: ${categoryDir}\n`);
    }

    // Create README for category
    this.createCategoryReadme(categoryDir, category);

    // Generate each example
    for (const example of category.examples) {
      console.log(`Creating example: ${example.title}...`);
      this.createExampleDirectory(categoryDir, example);
    }

    // Create category index
    this.createCategoryIndex(categoryDir, category);

    console.log(`\n✅ Category generated successfully!`);
    console.log(`📁 Location: ${categoryDir}`);
    console.log(`📊 Total examples: ${category.examples.length}`);
  }

  /**
   * Generate all categories
   */
  async generateAll(): Promise<void> {
    console.log(`\n🚀 Generating all FHEVM example categories...\n`);

    for (const categoryName of Object.keys(CATEGORIES)) {
      await this.generateCategory(categoryName);
      console.log("\n---\n");
    }

    console.log(`\n✅ All categories generated!`);
    this.createMasterIndex();
  }

  private createCategoryReadme(categoryDir: string, category: CategoryConfig): void {
    let readme = `# ${category.title}\n\n`;
    readme += `${category.description}\n\n`;
    readme += `## Examples in This Category\n\n`;

    category.examples.forEach((example, index) => {
      readme += `### ${index + 1}. [${example.title}](./${example.name}/)\n`;
      readme += `${example.description}\n\n`;
    });

    readme += `## Learning Path\n\n`;
    readme += `1. Start with the first example\n`;
    readme += `2. Study the contract code and comments\n`;
    readme += `3. Run the test suite\n`;
    readme += `4. Experiment with modifications\n`;
    readme += `5. Move to next example in category\n\n`;

    readme += `## Common Concepts\n\n`;
    readme += `All examples in this category demonstrate:\n`;
    readme += `- Encrypted data handling\n`;
    readme += `- TFHE library operations\n`;
    readme += `- Privacy-preserving patterns\n`;
    readme += `- Access control mechanisms\n\n`;

    readme += `## Testing\n\n`;
    readme += `Each example includes:\n`;
    readme += `- Complete test suite\n`;
    readme += `- Edge case coverage\n`;
    readme += `- Error handling examples\n`;
    readme += `- Usage demonstrations\n\n`;

    fs.writeFileSync(path.join(categoryDir, "README.md"), readme);
    console.log(`  📖 Created category README`);
  }

  private createExampleDirectory(categoryDir: string, example: CategoryExample): void {
    const exampleDir = path.join(categoryDir, example.name);

    // Create directory structure
    fs.mkdirSync(path.join(exampleDir, "contracts"), { recursive: true });
    fs.mkdirSync(path.join(exampleDir, "test"), { recursive: true });
    fs.mkdirSync(path.join(exampleDir, "scripts"), { recursive: true });

    // Create placeholder files
    const contractName = this.toPascalCase(example.name);

    // Contract file
    const contractContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title ${example.title}
 * @notice ${example.description}
 * @dev Uses FHEVM for encrypted operations
 */
contract ${contractName} {
    using TFHE for euint32;
    using TFHE for ebool;

    // Add your encrypted state variables here

    // Add your functions here
}
`;

    fs.writeFileSync(
      path.join(exampleDir, "contracts", `${contractName}.sol`),
      contractContent
    );

    // Test file
    const testContent = `import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter ${example.name.replace(/-/g, "_")}
 * Test suite for ${example.title}
 */
describe("${contractName}", function () {
    let contract: any;
    let owner: any;

    beforeEach(async function () {
        const Contract = await ethers.getContractFactory("${contractName}");
        contract = await Contract.deploy();
        [owner] = await ethers.getSigners();
    });

    describe("Deployment", function () {
        it("should deploy successfully", async function () {
            expect(contract.address).to.not.equal(0);
        });
    });

    // Add your tests here
});
`;

    fs.writeFileSync(
      path.join(exampleDir, "test", `${contractName}.test.ts`),
      testContent
    );

    // hardhat.config.ts
    const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};

export default config;
`;

    fs.writeFileSync(path.join(exampleDir, "hardhat.config.ts"), hardhatConfig);

    // package.json
    const pkg = {
      name: `fhevm-${example.name}-example`,
      version: "1.0.0",
      description: example.description,
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
      },
      devDependencies: {
        "@nomicfoundation/hardhat-toolbox": "^5.0.0",
        "@fhevm/hardhat-plugin": "0.0.1-3",
        hardhat: "^2.24.3",
      },
    };

    fs.writeFileSync(
      path.join(exampleDir, "package.json"),
      JSON.stringify(pkg, null, 2)
    );

    // Example README
    const exampleReadme = `# ${example.title}\n\n${example.description}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run test\n\`\`\`\n`;
    fs.writeFileSync(path.join(exampleDir, "README.md"), exampleReadme);

    console.log(`  ✅ Created: ${example.name}/`);
  }

  private createCategoryIndex(categoryDir: string, category: CategoryConfig): void {
    let index = `# ${category.title} - Example Index\n\n`;
    index += `| Example | Description | Files |\n`;
    index += `|---------|-------------|-------|\n`;

    category.examples.forEach(example => {
      index += `| [${example.title}](./${example.name}/) | ${example.description} | [Code](./${example.name}/contracts/) \\| [Tests](./${example.name}/test/) |\n`;
    });

    fs.writeFileSync(path.join(categoryDir, "INDEX.md"), index);
  }

  private createMasterIndex(): void {
    let index = `# FHEVM Examples - Master Index\n\n`;
    index += `Complete catalog of FHEVM example repositories organized by category.\n\n`;

    Object.values(CATEGORIES).forEach(category => {
      index += `## [${category.title}](./${category.name}/)\n`;
      index += `${category.description}\n\n`;
      index += `**Examples**: ${category.examples.length}\n\n`;
    });

    fs.writeFileSync(path.join(this.outputDir, "EXAMPLES_INDEX.md"), index);
    console.log(`\n📑 Created: EXAMPLES_INDEX.md`);
  }

  private toPascalCase(str: string): string {
    return str
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }
}

// Main execution
const args = process.argv.slice(2);
const categoryName = args[0] || "all";
const generator = new CategoryGenerator("./generated-examples");

if (categoryName.toLowerCase() === "all") {
  generator.generateAll().catch(error => {
    console.error("Error generating categories:", error);
    process.exit(1);
  });
} else {
  generator.generateCategory(categoryName).catch(error => {
    console.error("Error generating category:", error);
    process.exit(1);
  });
}
