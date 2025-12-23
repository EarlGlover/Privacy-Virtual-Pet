import { ethers } from "hardhat";

/**
 * @chapter basic-operations
 * Deployment script for EncryptedArithmetic contract
 *
 * This script deploys the EncryptedArithmetic contract to the specified network.
 * It demonstrates basic deployment patterns for FHEVM contracts.
 */
async function main() {
  console.log("Deploying EncryptedArithmetic contract...");

  // Get the contract factory
  const EncryptedArithmetic = await ethers.getContractFactory("EncryptedArithmetic");

  // Deploy the contract
  const contract = await EncryptedArithmetic.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("EncryptedArithmetic deployed to:", address);
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
