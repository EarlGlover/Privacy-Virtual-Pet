import { ethers } from "hardhat";

/**
 * Deploy script for Example contract
 *
 * Usage:
 * npx hardhat run scripts/deploy.ts --network hardhat
 * npx hardhat run scripts/deploy.ts --network localhost
 * npx hardhat run scripts/deploy.ts --network zama
 */

async function main() {
    console.log("=== FHEVM Example Deployment ===\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    const Example = await ethers.getContractFactory("Example");
    console.log("Deploying Example contract...");
    const example = await Example.deploy();

    // Wait for deployment
    await example.deploymentTransaction()?.wait(1);

    const contractAddress = await example.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    // Output deployment info
    console.log("\n=== Deployment Summary ===");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Contract Address:", contractAddress);
    console.log("Deployer:", deployer.address);

    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
        contractAddress,
        deployer: deployer.address,
        network: (await ethers.provider.getNetwork()).name,
        timestamp: new Date().toISOString(),
    };

    const deploymentPath = `./deployments/${(await ethers.provider.getNetwork()).name}-deployment.json`;
    fs.mkdirSync("./deployments", { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n✅ Deployment info saved to:", deploymentPath);
}

main()
    .then(() => {
        console.log("\n✅ Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
