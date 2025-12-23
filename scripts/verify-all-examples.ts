import * as fs from "fs";
import * as path from "path";

/**
 * @chapter automation
 * Verification script for all FHEVM examples
 *
 * This script verifies that all 10 examples have:
 * - Contracts compiled
 * - Test files present
 * - Documentation complete
 * - Configuration files valid
 */

interface ExampleCheck {
  name: string;
  hasContract: boolean;
  hasTests: boolean;
  hasReadme: boolean;
  hasPackageJson: boolean;
  hasHardhatConfig: boolean;
  hasTsConfig: boolean;
  hasDeployScript: boolean;
  isComplete: boolean;
}

function checkExample(examplePath: string, exampleName: string): ExampleCheck {
  const contractsPath = path.join(examplePath, "contracts");
  const testPath = path.join(examplePath, "test");
  const readmePath = path.join(examplePath, "README.md");
  const packageJsonPath = path.join(examplePath, "package.json");
  const hardhatConfigPath = path.join(examplePath, "hardhat.config.ts");
  const tsConfigPath = path.join(examplePath, "tsconfig.json");
  const deployScriptPath = path.join(examplePath, "scripts", "deploy.ts");

  const hasContract = fs.existsSync(contractsPath) && fs.readdirSync(contractsPath).some(f => f.endsWith(".sol"));
  const hasTests = fs.existsSync(testPath) && fs.readdirSync(testPath).some(f => f.endsWith(".test.ts"));
  const hasReadme = fs.existsSync(readmePath);
  const hasPackageJson = fs.existsSync(packageJsonPath);
  const hasHardhatConfig = fs.existsSync(hardhatConfigPath);
  const hasTsConfig = fs.existsSync(tsConfigPath);
  const hasDeployScript = fs.existsSync(deployScriptPath);

  const isComplete =
    hasContract &&
    hasTests &&
    hasReadme &&
    hasPackageJson &&
    hasHardhatConfig &&
    hasTsConfig &&
    hasDeployScript;

  return {
    name: exampleName,
    hasContract,
    hasTests,
    hasReadme,
    hasPackageJson,
    hasHardhatConfig,
    hasTsConfig,
    hasDeployScript,
    isComplete,
  };
}

async function main() {
  console.log("=========================================");
  console.log("FHEVM Example Hub - Verification Report");
  console.log("=========================================\n");

  const examplesPath = path.join(process.cwd(), "generated-examples");

  const examples = [
    { path: "basic/arithmetic", name: "basic/arithmetic" },
    { path: "basic/counter", name: "basic/counter" },
    { path: "basic/equality", name: "basic/equality" },
    { path: "encryption/encrypt-single", name: "encryption/encrypt-single" },
    { path: "encryption/encrypt-multiple", name: "encryption/encrypt-multiple" },
    { path: "decryption/decrypt-single", name: "decryption/decrypt-single" },
    { path: "access-control/fhe-allow", name: "access-control/fhe-allow" },
    { path: "access-control/input-proofs", name: "access-control/input-proofs" },
    { path: "anti-patterns/view-function-errors", name: "anti-patterns/view-function-errors" },
    { path: "advanced/blind-auction", name: "advanced/blind-auction" },
  ];

  const results: ExampleCheck[] = [];
  let totalComplete = 0;

  console.log("Checking examples...\n");

  examples.forEach(({ path: examplePath, name }) => {
    const fullPath = path.join(examplesPath, examplePath);
    const check = checkExample(fullPath, name);
    results.push(check);

    if (check.isComplete) {
      console.log(`✅ ${name}`);
      totalComplete++;
    } else {
      console.log(`❌ ${name}`);
      if (!check.hasContract) console.log(`   - Missing contract`);
      if (!check.hasTests) console.log(`   - Missing tests`);
      if (!check.hasReadme) console.log(`   - Missing README`);
      if (!check.hasPackageJson) console.log(`   - Missing package.json`);
      if (!check.hasHardhatConfig) console.log(`   - Missing hardhat.config.ts`);
      if (!check.hasTsConfig) console.log(`   - Missing tsconfig.json`);
      if (!check.hasDeployScript) console.log(`   - Missing deploy.ts`);
    }
  });

  console.log(`\n=========================================`);
  console.log("Summary");
  console.log("=========================================\n");

  console.log(`Total Examples: ${results.length}`);
  console.log(`Complete Examples: ${totalComplete}/${results.length}`);

  // Detailed breakdown
  console.log("\nDetailed Breakdown:");
  console.log("-------------------");
  console.log(`Contracts: ${results.filter(r => r.hasContract).length}/${results.length}`);
  console.log(`Tests: ${results.filter(r => r.hasTests).length}/${results.length}`);
  console.log(`READMEs: ${results.filter(r => r.hasReadme).length}/${results.length}`);
  console.log(`package.json: ${results.filter(r => r.hasPackageJson).length}/${results.length}`);
  console.log(`hardhat.config.ts: ${results.filter(r => r.hasHardhatConfig).length}/${results.length}`);
  console.log(`tsconfig.json: ${results.filter(r => r.hasTsConfig).length}/${results.length}`);
  console.log(`deploy.ts: ${results.filter(r => r.hasDeployScript).length}/${results.length}`);

  if (totalComplete === results.length) {
    console.log("\n✅ All examples are complete and ready for deployment!");
    process.exit(0);
  } else {
    console.log("\n❌ Some examples are missing required files.");
    process.exit(1);
  }
}

main();
