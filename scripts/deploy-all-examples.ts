import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";

/**
 * @chapter automation
 * Master deployment script for all FHEVM examples
 *
 * This script deploys all 10 examples to a specified network
 * and logs their addresses for reference.
 */

interface DeploymentResult {
  example: string;
  contract: string;
  address: string;
  network: string;
  timestamp: string;
}

const deploymentResults: DeploymentResult[] = [];

async function deployExample(contractName: string, exampleName: string, ...args: any[]): Promise<DeploymentResult> {
  try {
    console.log(`\nDeploying ${exampleName}...`);

    const Factory = await ethers.getContractFactory(contractName);
    const contract = await Factory.deploy(...args);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const network = (await ethers.provider.getNetwork()).name;

    const result: DeploymentResult = {
      example: exampleName,
      contract: contractName,
      address: address,
      network: network,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ ${exampleName} deployed to: ${address}`);
    deploymentResults.push(result);

    return result;
  } catch (error) {
    console.error(`❌ Failed to deploy ${exampleName}:`, error);
    throw error;
  }
}

async function main() {
  console.log("=====================================");
  console.log("FHEVM Example Hub - Master Deployment");
  console.log("=====================================\n");

  const signer = (await ethers.getSigners())[0];
  console.log("Deployer:", signer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("");

  try {
    // Basic Examples
    await deployExample("EncryptedArithmetic", "basic/arithmetic");
    await deployExample("EncryptedCounter", "basic/counter");
    await deployExample("EncryptedComparison", "basic/equality");

    // Encryption Examples
    await deployExample("EncryptedValue", "encryption/encrypt-single");
    await deployExample("EncryptedProfile", "encryption/encrypt-multiple");

    // Decryption Example
    await deployExample("SecretValue", "decryption/decrypt-single");

    // Access Control Examples
    await deployExample("AccessControlExample", "access-control/fhe-allow");
    await deployExample("InputProofExample", "access-control/input-proofs");

    // Anti-Patterns Example
    await deployExample("AntiPatterns", "anti-patterns/view-function-errors");

    // Advanced Example
    const currentBlock = await ethers.provider.getBlock("latest");
    const auctionEndTime = currentBlock!.timestamp + 3600;
    await deployExample("BlindAuction", "advanced/blind-auction", auctionEndTime);

    // Summary
    console.log("\n=====================================");
    console.log("Deployment Summary");
    console.log("=====================================\n");

    console.log(`✅ Successfully deployed ${deploymentResults.length} examples\n`);

    // Display results
    console.log("Deployment Results:");
    console.log("-------------------");
    deploymentResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.example}`);
      console.log(`   Contract: ${result.contract}`);
      console.log(`   Address: ${result.address}`);
    });

    // Save results to file
    const outputPath = path.join(process.cwd(), "deployment-results.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentResults, null, 2));
    console.log(`\n✅ Results saved to: ${outputPath}`);
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ All deployments completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
