import { ethers } from "hardhat";

/**
 * @chapter basic-operations
 * Deployment script for EncryptedComparison contract
 *
 * This script deploys the EncryptedComparison contract to the specified network.
 */
async function main() {
  console.log("Deploying EncryptedComparison contract...");

  // Get the contract factory
  const EncryptedComparison = await ethers.getContractFactory("EncryptedComparison");

  // Deploy the contract
  const contract = await EncryptedComparison.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("EncryptedComparison deployed to:", address);
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
