import { ethers } from "hardhat";

/**
 * @chapter encryption-patterns
 * Deployment script for EncryptedValue contract
 *
 * This script deploys the EncryptedValue contract to the specified network.
 * Demonstrates deployment of basic encrypted value storage contract.
 */
async function main() {
  console.log("Deploying EncryptedValue contract...");

  // Get the contract factory
  const EncryptedValue = await ethers.getContractFactory("EncryptedValue");

  // Deploy the contract
  const contract = await EncryptedValue.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("EncryptedValue deployed to:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer address:", (await ethers.getSigners())[0].address);

  return address;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
