import { ethers } from "hardhat";

/**
 * @chapter basic-operations
 * Deployment script for EncryptedCounter contract
 *
 * This script deploys the EncryptedCounter contract to the specified network.
 */
async function main() {
  console.log("Deploying EncryptedCounter contract...");

  // Get the contract factory
  const EncryptedCounter = await ethers.getContractFactory("EncryptedCounter");

  // Deploy the contract
  const contract = await EncryptedCounter.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("EncryptedCounter deployed to:", address);
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
