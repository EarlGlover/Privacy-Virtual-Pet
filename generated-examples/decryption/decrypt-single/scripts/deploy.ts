import { ethers } from "hardhat";

/**
 * @chapter user-decryption
 * Deployment script for SecretValue contract
 *
 * This script deploys the SecretValue contract to the specified network.
 * Demonstrates deployment of access-controlled decryption contract.
 */
async function main() {
  console.log("Deploying SecretValue contract...");

  // Get the contract factory
  const SecretValue = await ethers.getContractFactory("SecretValue");

  // Deploy the contract
  const contract = await SecretValue.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("SecretValue deployed to:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer address:", (await ethers.getSigners())[0].address);
  console.log("Contract owner: (same as deployer by default)");

  return address;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
