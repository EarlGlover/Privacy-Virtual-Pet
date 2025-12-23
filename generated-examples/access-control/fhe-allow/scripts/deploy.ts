import { ethers } from "hardhat";

/**
 * @chapter access-control
 * Deployment script for AccessControlExample contract
 *
 * This script deploys the AccessControlExample contract to the specified network.
 * Demonstrates deployment of access control pattern with FHE.allow().
 */
async function main() {
  console.log("Deploying AccessControlExample contract...");

  // Get the contract factory
  const AccessControlExample = await ethers.getContractFactory("AccessControlExample");

  // Deploy the contract
  const contract = await AccessControlExample.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("AccessControlExample deployed to:", address);
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
