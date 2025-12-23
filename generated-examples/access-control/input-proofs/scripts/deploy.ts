import { ethers } from "hardhat";

/**
 * @chapter access-control
 * Deployment script for InputProofExample contract
 *
 * This script deploys the InputProofExample contract to the specified network.
 * Demonstrates deployment of input proof validation contract.
 */
async function main() {
  console.log("Deploying InputProofExample contract...");

  // Get the contract factory
  const InputProofExample = await ethers.getContractFactory("InputProofExample");

  // Deploy the contract
  const contract = await InputProofExample.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("InputProofExample deployed to:", address);
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
