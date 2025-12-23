import { ethers } from "hardhat";

/**
 * @chapter anti-patterns
 * Deployment script for AntiPatterns contract
 *
 * This script deploys the AntiPatterns contract to the specified network.
 * Educational contract demonstrating common mistakes and correct patterns.
 */
async function main() {
  console.log("Deploying AntiPatterns contract...");

  // Get the contract factory
  const AntiPatterns = await ethers.getContractFactory("AntiPatterns");

  // Deploy the contract
  const contract = await AntiPatterns.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("AntiPatterns deployed to:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer address:", (await ethers.getSigners())[0].address);
  console.log("\nNote: This contract demonstrates anti-patterns for educational purposes.");

  return address;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
