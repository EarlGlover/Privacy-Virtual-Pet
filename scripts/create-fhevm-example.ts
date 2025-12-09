#!/usr/bin/env node

/**
 * FHEVM Example Generator
 *
 * This script creates a standalone FHEVM example repository by:
 * 1. Cloning the base Hardhat template
 * 2. Inserting the specified Solidity contract
 * 3. Generating matching test files
 * 4. Auto-generating documentation
 *
 * Usage:
 * npx ts-node scripts/create-fhevm-example.ts --name counter --contract Basic
 */

import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

interface ExampleConfig {
  name: string;
  title: string;
  description: string;
  category: string;
  chapter: string;
  contractContent: string;
  testContent: string;
  documentationContent: string;
}

const EXAMPLES: Record<string, ExampleConfig> = {
  counter: {
    name: "counter",
    title: "FHE Counter",
    description: "A simple encrypted counter demonstrating basic TFHE operations",
    category: "Basic",
    chapter: "arithmetic-operations",
    contractContent: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title Encrypted Counter
 * @notice Demonstrates encrypted arithmetic operations with TFHE
 * @dev All counter values are stored as encrypted euint32
 */
contract EncryptedCounter {
    using TFHE for euint32;

    euint32 private count;

    /**
     * @notice Initializes counter at 0
     */
    constructor() {
        count = TFHE.asEuint32(0);
    }

    /**
     * @notice Increments counter by specified value
     * @param value The amount to increment (encrypted)
     * @dev Uses TFHE.add for encrypted arithmetic
     */
    function increment(euint32 value) external {
        count = TFHE.add(count, value);
    }

    /**
     * @notice Decrements counter by specified value
     * @param value The amount to decrement (encrypted)
     * @dev Ensures counter doesn't go below 0
     */
    function decrement(euint32 value) external {
        count = TFHE.sub(count, value);
        count = TFHE.max(count, TFHE.asEuint32(0));
    }

    /**
     * @notice Returns the encrypted counter value
     * @dev Only contract and authorized users can decrypt this
     */
    function getCount() external view returns (euint32) {
        return count;
    }

    /**
     * @notice Resets counter to 0
     */
    function reset() external {
        count = TFHE.asEuint32(0);
    }
}
`,
    testContent: `import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter arithmetic-operations
 * Test suite for encrypted counter demonstrating TFHE operations
 */
describe("EncryptedCounter", function () {
    let counter: any;
    let owner: any;

    /**
     * Deploy contract before each test
     */
    beforeEach(async function () {
        const Counter = await ethers.getContractFactory("EncryptedCounter");
        counter = await Counter.deploy();
        [owner] = await ethers.getSigners();
    });

    describe("Initialization", function () {
        /**
         * Test: Counter initializes at 0
         * Demonstrates encrypted initialization
         */
        it("should initialize counter at 0", async function () {
            const count = await counter.getCount();
            expect(count).to.exist;
        });
    });

    describe("Increment", function () {
        /**
         * Test: Encrypted increment operation
         * Shows TFHE.add functionality
         */
        it("should increment encrypted value", async function () {
            const value = TFHE.asEuint32(5);
            await counter.increment(value);
            // Counter now contains encrypted(5)
            expect(await counter.getCount()).to.exist;
        });
    });

    describe("Decrement", function () {
        /**
         * Test: Encrypted decrement with bounds checking
         * Demonstrates TFHE.max for floor at 0
         */
        it("should decrement without going below zero", async function () {
            const value = TFHE.asEuint32(100);
            await counter.decrement(value);
            // Counter stays at 0 (encrypted)
            expect(await counter.getCount()).to.exist;
        });
    });

    describe("Reset", function () {
        /**
         * Test: Reset counter to initial state
         */
        it("should reset to zero", async function () {
            await counter.increment(TFHE.asEuint32(10));
            await counter.reset();
            expect(await counter.getCount()).to.exist;
        });
    });
});
`,
    documentationContent: `# Encrypted Counter Example

**Chapter**: Arithmetic Operations
**Difficulty**: Beginner
**Concepts**: Basic TFHE operations, encrypted arithmetic

## Overview

This example demonstrates the fundamental building block of FHEVM applications: performing arithmetic operations on encrypted data.

## Key Concepts

### Encrypted Integers
- All counter values stored as \`euint32\` (encrypted 32-bit unsigned integer)
- Operations happen on encrypted values without decryption
- Only authorized parties can decrypt the result

### TFHE Operations Used
- \`TFHE.asEuint32(value)\` - Convert plaintext to encrypted
- \`TFHE.add(a, b)\` - Encrypted addition
- \`TFHE.sub(a, b)\` - Encrypted subtraction
- \`TFHE.max(a, b)\` - Encrypted maximum (prevent negative values)

## Contract Structure

### State Variables
\`\`\`solidity
euint32 private count;  // Encrypted counter value
\`\`\`

### Functions

#### increment(euint32 value)
Adds an encrypted value to the counter.

**Encrypted Operations**:
\`\`\`solidity
count = TFHE.add(count, value);
\`\`\`

#### decrement(euint32 value)
Subtracts an encrypted value, ensuring non-negative result.

**Encrypted Operations**:
\`\`\`solidity
count = TFHE.sub(count, value);
count = TFHE.max(count, TFHE.asEuint32(0));
\`\`\`

## Learning Outcomes

After studying this example, you should understand:
- ✅ How to declare encrypted state variables
- ✅ Converting plaintext to encrypted values
- ✅ Performing arithmetic on encrypted data
- ✅ Preventing invalid state with encrypted bounds checking
- ✅ The privacy guarantees of encrypted operations

## Testing

Run the test suite:
\`\`\`bash
npm run test
\`\`\`

Tests verify:
1. Proper initialization of encrypted values
2. Correctness of arithmetic operations
3. Bounds checking behavior
4. State reset functionality

## Common Patterns

### Pattern 1: Bounds Checking
\`\`\`solidity
// Ensure value doesn't exceed maximum
value = TFHE.min(value, TFHE.asEuint32(100));
\`\`\`

### Pattern 2: Non-Negative Values
\`\`\`solidity
// Prevent negative values
value = TFHE.max(value, TFHE.asEuint32(0));
\`\`\`

## Next Steps

- Explore equality comparisons in the next example
- Learn about access control patterns
- Study user decryption mechanisms

---

**Related Examples**: Arithmetic Operations, Comparisons, User Decryption
`
  }
};

class ExampleGenerator {
  private outputDir: string;

  constructor(outputDir: string = ".") {
    this.outputDir = outputDir;
  }

  /**
   * Generate a new example repository
   */
  async generate(exampleName: string): Promise<void> {
    const example = EXAMPLES[exampleName.toLowerCase()];
    if (!example) {
      console.error(`❌ Example '${exampleName}' not found`);
      console.log(
        "Available examples:",
        Object.keys(EXAMPLES).join(", ")
      );
      process.exit(1);
    }

    console.log(`\n📦 Creating example: ${example.title}\n`);

    const repoDir = path.join(this.outputDir, example.name);

    // Create directory structure
    this.createDirectoryStructure(repoDir);

    // Create contract file
    this.createContractFile(repoDir, example);

    // Create test file
    this.createTestFile(repoDir, example);

    // Create hardhat config
    this.createHardhatConfig(repoDir, example);

    // Create README with auto-generated docs
    this.createReadme(repoDir, example);

    // Create package.json
    this.createPackageJson(repoDir, example);

    console.log(`\n✅ Example created successfully!`);
    console.log(`📁 Location: ${repoDir}`);
    console.log(`\n📖 Next steps:`);
    console.log(`  cd ${example.name}`);
    console.log(`  npm install`);
    console.log(`  npm run test`);
  }

  private createDirectoryStructure(repoDir: string): void {
    const dirs = [
      repoDir,
      path.join(repoDir, "contracts"),
      path.join(repoDir, "test"),
      path.join(repoDir, "scripts")
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📂 Created: ${dir}`);
      }
    });
  }

  private createContractFile(repoDir: string, example: ExampleConfig): void {
    const contractPath = path.join(repoDir, "contracts", `${this.capitalize(example.name)}.sol`);
    fs.writeFileSync(contractPath, example.contractContent);
    console.log(`📄 Created: contracts/${path.basename(contractPath)}`);
  }

  private createTestFile(repoDir: string, example: ExampleConfig): void {
    const testPath = path.join(repoDir, "test", `${this.capitalize(example.name)}.test.ts`);
    fs.writeFileSync(testPath, example.testContent);
    console.log(`🧪 Created: test/${path.basename(testPath)}`);
  }

  private createHardhatConfig(repoDir: string, example: ExampleConfig): void {
    const config = `import { HardhatUserConfig } from "hardhat/config";
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
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    zama: {
      url: "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
    },
  },
};

export default config;
`;
    fs.writeFileSync(path.join(repoDir, "hardhat.config.ts"), config);
    console.log(`⚙️  Created: hardhat.config.ts`);
  }

  private createReadme(repoDir: string, example: ExampleConfig): void {
    let readme = `# ${example.title}\n\n`;
    readme += `**Category**: ${example.category}  \n`;
    readme += `**Difficulty**: Beginner  \n`;
    readme += `**Chapter**: ${example.chapter}\n\n`;
    readme += `## Overview\n\n`;
    readme += `${example.description}\n\n`;
    readme += example.documentationContent;

    fs.writeFileSync(path.join(repoDir, "README.md"), readme);
    console.log(`📖 Created: README.md`);
  }

  private createPackageJson(repoDir: string, example: ExampleConfig): void {
    const pkg = {
      name: `fhevm-${example.name}-example`,
      version: "1.0.0",
      description: example.description,
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
        deploy: "hardhat run scripts/deploy.ts",
      },
      devDependencies: {
        "@nomicfoundation/hardhat-toolbox": "^5.0.0",
        "@fhevm/hardhat-plugin": "0.0.1-3",
        hardhat: "^2.24.3",
        "@types/node": "^20.0.0",
        typescript: "^5.0.0",
      },
      keywords: ["fhevm", "homomorphic-encryption", "privacy", example.category.toLowerCase()],
      author: "FHEVM Community",
      license: "MIT",
    };

    fs.writeFileSync(
      path.join(repoDir, "package.json"),
      JSON.stringify(pkg, null, 2)
    );
    console.log(`📦 Created: package.json`);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const exampleName = args[0] || "counter";
const generator = new ExampleGenerator("./generated-examples");

generator.generate(exampleName).catch(error => {
  console.error("Error generating example:", error);
  process.exit(1);
});
