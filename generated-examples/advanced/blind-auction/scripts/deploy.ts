import { ethers } from "hardhat";

/**
 * @chapter advanced-patterns
 * Deployment script for BlindAuction contract
 *
 * This script deploys the BlindAuction contract to the specified network.
 * Demonstrates deployment of production-grade privacy-preserving auction contract.
 */
async function main() {
  console.log("Deploying BlindAuction contract...");

  // Get the contract factory
  const BlindAuction = await ethers.getContractFactory("BlindAuction");

  // Deploy the contract
  // Parameters: auctionEndTime (block timestamp when auction ends)
  const signer = (await ethers.getSigners())[0];
  const currentBlock = await ethers.provider.getBlock("latest");
  const auctionEndTime = currentBlock!.timestamp + 3600; // 1 hour from now

  const contract = await BlindAuction.deploy(auctionEndTime);

  // Wait for deployment to complete
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();

  console.log("BlindAuction deployed to:", address);
  console.log("Auction end time:", new Date(auctionEndTime * 1000).toISOString());
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer address:", signer.address);

  return address;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
