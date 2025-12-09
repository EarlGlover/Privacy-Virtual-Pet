const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Privacy Virtual Pet contract...");

  // Choose contract version based on environment
  const contractName = process.env.USE_V07 === "true" ? "PrivacyVirtualPetV07" : "PrivacyVirtualPet";
  console.log(`Using contract: ${contractName}`);

  // Get the contract factory
  const PrivacyVirtualPet = await ethers.getContractFactory(contractName);

  // Deploy the contract
  console.log("Deploying contract...");
  const contract = await PrivacyVirtualPet.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("PrivacyVirtualPet deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("Deployment completed!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("");
  console.log("Update your app.js file with this contract address:");
  console.log(`this.contractAddress = '${contractAddress}';`);

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });