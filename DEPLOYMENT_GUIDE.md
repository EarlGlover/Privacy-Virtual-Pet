# Privacy Virtual Pet - Deployment and Automation Guide

---

## 🚀 Deployment Overview

This guide covers:
- Hardhat deployment scripts
- Network configuration
- Contract verification
- Frontend deployment
- Production considerations

---

## 📝 Deployment Scripts

### Script Structure

**File**: `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
    console.log("=== Privacy Virtual Pet Deployment ===\n");

    // 1. Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // 2. Deploy contract
    const PrivacyVirtualPet = await ethers.getContractFactory("PrivacyVirtualPet");
    const contract = await PrivacyVirtualPet.deploy();

    await contract.deploymentTransaction().wait(1);

    // 3. Get deployed address
    const contractAddress = await contract.getAddress();
    console.log("\n✅ Contract deployed to:", contractAddress);

    // 4. Save deployment info
    saveDeploymentInfo(contractAddress, hre.network.name);

    // 5. Output deployment summary
    console.log("\n=== Deployment Summary ===");
    console.log("Network:", hre.network.name);
    console.log("Contract:", contractAddress);
    console.log("Deployer:", deployer.address);
    console.log("\nUpdate your frontend with:");
    console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);
}

function saveDeploymentInfo(address, network) {
    const fs = require("fs");
    const deploymentInfo = {
        network,
        address,
        timestamp: new Date().toISOString(),
    };

    const filePath = `deployments/${network}-deployment.json`;
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${filePath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## 🔧 Hardhat Configuration

### Network Setup

**File**: `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    networks: {
        // Local Development
        hardhat: {
            chainId: 1337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },

        // Zama Network
        zama: {
            url: "https://devnet.zama.ai",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 8009,
        },

        // Sepolia Testnet
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155111,
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};
```

---

### Environment Configuration

**File**: `.env` (create locally, don't commit)

```env
# NEVER COMMIT THIS FILE!
# Use testnet keys with minimal funds only

# Your wallet private key (for testnet only)
PRIVATE_KEY=your_testnet_private_key_here

# Network RPC endpoints (optional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ZAMA_RPC_URL=https://devnet.zama.ai

# Contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Deployment configuration
DEPLOYMENT_NETWORK=sepolia
GAS_PRICE_STANDARD=30000000000
```

---

## 🌐 Deploying to Different Networks

### 1. Local Development (Hardhat)

**Start local node**:
```bash
npx hardhat node
```

This starts a local Ethereum network with 20 pre-funded accounts.

**Deploy in another terminal**:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Benefits**:
- Instant confirmation
- No real funds needed
- Full control over blockchain state
- Easy debugging

---

### 2. Zama Devnet (FHE Testing)

**Prerequisites**:
- PRIVATE_KEY environment variable set
- Testnet ETH available

**Deploy**:
```bash
npm run deploy
# or
npx hardhat run scripts/deploy.js --network zama
```

**Expected output**:
```
=== Privacy Virtual Pet Deployment ===

Deploying with account: 0x...
Account balance: 5000000000000000000

✅ Contract deployed to: 0x...

=== Deployment Summary ===
Network: zama
Contract: 0x...
Deployer: 0x...
```

---

### 3. Sepolia Testnet (Public Testing)

**Prerequisites**:
1. Create Infura account (https://infura.io)
2. Get Sepolia testnet key
3. Fund wallet from faucet

**Fund your wallet**:
```bash
# Visit Sepolia faucet: https://sepolia-faucet.pk910.de/
# Paste your address
# Receive test ETH
```

**Deploy**:
```bash
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
export PRIVATE_KEY="your_private_key"

npx hardhat run scripts/deploy.js --network sepolia
```

---

## ✅ Post-Deployment Steps

### 1. Verify Deployment

```javascript
// Verify contract exists
const tx = await ethers.provider.getTransaction(txHash);
console.log("Transaction:", tx);

// Call a function to test
const hasPet = await contract.hasPet(deployerAddress);
console.log("Contract working:", hasPet === false);
```

---

### 2. Update Frontend

After deployment, update your frontend with the contract address:

**File**: `frontend/app.js`

```javascript
// Update this with your deployed address
const CONTRACT_ADDRESS = "0x...";  // From deployment output

const CONTRACT_ABI = [
    // Your contract ABI here
];
```

**Get ABI**:
```bash
# From artifacts after compilation
cat artifacts/contracts/PrivacyVirtualPet.sol/PrivacyVirtualPet.json | jq '.abi'
```

---

### 3. Verify on Block Explorer

For Sepolia:
1. Visit: https://sepolia.etherscan.io
2. Search for contract address
3. Click "Verify and Publish" if not auto-verified
4. Upload source code

---

## 🔐 Security in Deployment

### Private Key Management

**❌ NEVER**:
- Hardcode private keys in code
- Commit `.env` files
- Share private keys via email/chat
- Use mainnet keys for testing

**✅ ALWAYS**:
- Use environment variables
- Use testnet-only keys
- Keep minimal balance
- Rotate keys regularly
- Use hardware wallets for mainnet

---

### Network Safety

**Testnet Only**:
```javascript
// Verify you're on testnet before deploying
async function verifyNetwork() {
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);

    if (network.name === "unknown") {
        throw new Error("Unknown network - please configure RPC URL");
    }

    if (network.chainId === 1) {
        throw new Error("MAINNET DETECTED! Use testnet only!");
    }
}

await verifyNetwork();
```

---

## 📦 Frontend Deployment

### Build Process

```bash
# Minify and optimize
npm run build

# Test local build
npm start

# Check bundle size
npm run analyze
```

### Deploy to Vercel

**Option 1: CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Option 2: GitHub Integration**
1. Push code to GitHub
2. Connect GitHub to Vercel
3. Auto-deploys on push

### Deploy to GitHub Pages

```bash
# Configure package.json
"homepage": "https://username.github.io/repo-name"

# Build and deploy
npm run build
git add build/
git commit -m "Deploy"
git push
```

---

## 🔄 Continuous Deployment

### GitHub Actions Pipeline

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test

      - name: Build contracts
        run: npm run compile

      - name: Deploy to testnet
        run: npx hardhat run scripts/deploy.js --network zama
        env:
          PRIVATE_KEY: ${{ secrets.TESTNET_PRIVATE_KEY }}

      - name: Build frontend
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 Testing Before Deployment

### Pre-Deployment Checklist

```bash
# 1. Clean build
npm run clean
npm run compile

# 2. Run tests
npm run test

# 3. Check code quality
npm run lint

# 4. Generate coverage
npm run coverage

# 5. Build frontend
npm run build

# 6. Local deployment test
npx hardhat run scripts/deploy.js --network hardhat

# 7. Check gas usage
REPORT_GAS=true npm run test
```

---

## 📊 Monitoring Deployments

### Track Deployments

Keep a deployment log:

```javascript
// deployments/deployment-log.json
{
  "deployments": [
    {
      "network": "zama",
      "address": "0x...",
      "timestamp": "2025-12-10T10:30:00Z",
      "deployer": "0x...",
      "txHash": "0x...",
      "blockNumber": 12345,
      "status": "verified"
    }
  ]
}
```

### Verify Contract Health

```javascript
async function verifyDeployment(contractAddress, network) {
    const provider = ethers.getDefaultProvider(network);

    // Check contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error("Contract not found at address");
    }

    console.log("✅ Contract exists");

    // Get creation transaction
    // (requires block explorer API or txHash)

    // Call test function
    const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        provider
    );

    try {
        // Call non-mutating function
        await contract.hasPet("0x0000000000000000000000000000000000000000");
        console.log("✅ Contract is callable");
    } catch (error) {
        console.error("❌ Contract error:", error.message);
    }
}
```

---

## 🚨 Troubleshooting Deployments

### Common Issues

**Issue: Insufficient Gas**
```
Error: insufficient funds for gas * price + value
```
**Solution**: Fund wallet from faucet

**Issue: Network Timeout**
```
Error: connection timeout
```
**Solution**: Check RPC URL, try different provider

**Issue: Invalid Private Key**
```
Error: invalid private key
```
**Solution**: Ensure PRIVATE_KEY environment variable is set

**Issue: Contract Already Deployed**
```
Error: address already in use
```
**Solution**: Use different deployer account or new network

---

## 🔄 Contract Upgrades

### Strategy for New Versions

**Create new version file**:
```javascript
// contracts/PrivacyVirtualPetV2.sol
contract PrivacyVirtualPetV2 {
    // Enhanced version with new features
}
```

**Deploy new version**:
```bash
# Deploy new contract
npx hardhat run scripts/deploy.js --network zama

# Keep old address for migration
# Users can upgrade in two ways:
# 1. Migrate their pets to new contract
# 2. Use adapter pattern
```

**Adapter pattern** (minimal migration):
```solidity
contract PrivacyVirtualPetV2 {
    PrivacyVirtualPet oldContract = PrivacyVirtualPet(OLD_ADDRESS);

    function migrateFromV1() external {
        // Read from V1, initialize in V2
        require(oldContract.hasPet(msg.sender), "No pet in V1");
        // Create new pet with V1 data
    }
}
```

---

## 📈 Gas Optimization for Deployment

### Before Deploying

**Analyze gas usage**:
```bash
REPORT_GAS=true npm run test
```

**Optimize Solidity**:
```solidity
// ✅ Efficient: packed storage
struct Pet {
    euint32 happiness;    // 32 bits
    euint32 health;       // 32 bits
    euint8 petType;       // 8 bits
    bool isEncrypted;     // 1 bit
}

// ❌ Inefficient: spread storage
mapping(address => euint32) happiness;
mapping(address => euint32) health;
mapping(address => euint8) petType;
```

---

## ✨ Production Deployment Checklist

Before going to production:

- [ ] All tests pass
- [ ] Code audited/reviewed
- [ ] Gas usage optimized
- [ ] Error handling comprehensive
- [ ] Frontrun protection considered
- [ ] Access controls enforced
- [ ] Events properly emitted
- [ ] No console.log in production
- [ ] Private keys secure
- [ ] RPC endpoints reliable
- [ ] Monitoring set up
- [ ] Rollback plan prepared
- [ ] Documentation updated
- [ ] Team trained

---

## 🎯 Deployment Milestones

```
Development (Local)
    ↓
Testing (Hardhat Network)
    ↓
Integration Testing (Local Testnet)
    ↓
Staging (Sepolia Testnet)
    ↓
Production (Sepolia Live / Mainnet)
```

---

**Successfully deploying ensures your FHE application reaches users securely and reliably.** 🚀✅
