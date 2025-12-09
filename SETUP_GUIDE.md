# Privacy Virtual Pet - Setup and Installation Guide

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Start](#quick-start)
3. [Development Setup](#development-setup)
4. [Testing Your Setup](#testing-your-setup)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## 💻 System Requirements

### Minimum Requirements

**Operating System**:
- macOS 10.14+
- Windows 10+ (with WSL2 recommended)
- Linux (Ubuntu 18.04+)

**Software**:
- Node.js: >= 18.0.0
- npm: >= 8.0.0
- Git: Latest stable version

**Browser** (for frontend):
- Chrome/Firefox/Edge (modern versions)
- MetaMask browser extension installed

**Wallet**:
- MetaMask account created
- Testnet ETH for gas fees (free from faucets)

### Recommended Development Environment

**IDEs**:
- Visual Studio Code (recommended)
  - Solidity extension: Hardhat Solidity (Juan Blanco)
  - JavaScript extension: ES7+ Code Snippets
- IntelliJ IDEA / WebStorm

**Tools**:
- Git GUI (GitHub Desktop, GitKraken)
- Node Version Manager (nvm for Unix, nvm-windows for Windows)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node.js

**macOS** (using Homebrew):
```bash
brew install node
```

**Windows** (using Chocolatey):
```powershell
choco install nodejs
```

**Or download** from https://nodejs.org/ (LTS version)

### Step 2: Verify Installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 8.x.x or higher
```

### Step 3: Clone Repository

```bash
git clone <repository-url>
cd privacy-virtual-pet
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Verify Compilation

```bash
npm run compile
```

You should see:
```
✓ 3 contract files compiled successfully
```

**Congratulations!** Your development environment is ready.

---

## 🔧 Development Setup (Detailed)

### Part 1: Environment Configuration

#### Step 1: Create .env File

Create a `.env` file in the project root:

```bash
touch .env
```

#### Step 2: Add Network Configuration

Add your network credentials:

```env
# Private key for transaction signing (use testnet only!)
# IMPORTANT: Never commit this file or share your private key!
PRIVATE_KEY=your_private_key_here

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_api_key_here

# Network RPC endpoints (optional - uses defaults if not provided)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ZAMA_RPC_URL=https://devnet.zama.ai
```

#### Step 3: Secure Your .env

```bash
# Add to .gitignore to prevent accidental commits
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

**⚠️ SECURITY WARNING**: Never commit `.env` files. Always use testnet keys and minimal amounts.

---

### Part 2: Contract Development

#### Step 1: Contract Structure

Create new contract files in `contracts/` directory:

```
contracts/
├── PrivacyVirtualPet.sol           # Main contract
├── PrivacyVirtualPetV07.sol        # Variant versions
└── SimplePrivacyVirtualPet.sol     # Educational version
```

#### Step 2: Write Your Contract

Example structure:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

contract MyFHEContract {
    using TFHE for euint32;

    // Your contract code here
}
```

#### Step 3: Compile Contracts

```bash
# Full compilation
npm run compile

# Or use Hardhat directly
npx hardhat compile

# Clean compile (remove old artifacts)
npx hardhat clean && npx hardhat compile
```

Expected output:
```
Compiling 3 Solidity files
✓ Contracts compiled successfully
Generated 3 artifacts in artifacts/
```

---

### Part 3: Testing Setup

#### Step 1: Create Test File

Create tests in `test/` directory:

```javascript
// test/MyContract.test.js
const { expect } = require("chai");

describe("MyFHEContract", function () {
    let contract;
    let owner;

    beforeEach(async function () {
        const MyContract = await ethers.getContractFactory("MyFHEContract");
        contract = await MyContract.deploy();
        [owner] = await ethers.getSigners();
    });

    it("should initialize correctly", async function () {
        // Your test here
    });
});
```

#### Step 2: Run Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/MyContract.test.js

# Run with gas reporting
REPORT_GAS=true npm run test

# Run in verbose mode
npm run test -- --verbose
```

---

### Part 4: Frontend Integration

#### Step 1: Setup HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Virtual Pet</title>
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.13.0/dist/ethers.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/fhevmjs@latest/bundle.min.js"></script>
</head>
<body>
    <!-- Your content here -->
    <script src="app.js"></script>
</body>
</html>
```

#### Step 2: Setup JavaScript

```javascript
// app.js
class PrivacyVirtualPetApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
    }

    async init() {
        await this.connectWallet();
    }

    async connectWallet() {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        const address = await this.signer.getAddress();
        console.log("Connected:", address);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PrivacyVirtualPetApp();
    await app.init();
});
```

#### Step 3: Serve Frontend

**Option 1: Using http-server** (already configured):
```bash
npm start
```

**Option 2: Using Python**:
```bash
python -m http.server 8000
```

**Option 3: Using Node.js**:
```bash
npx http-server . -p 3000
```

Then visit: http://localhost:3000 (or 8000/8080)

---

### Part 5: Network Configuration

#### Connect to Sepolia (Testnet)

1. Open MetaMask
2. Click network dropdown
3. Select "Sepolia Test Network"
4. Ensure you have testnet ETH (get from [Sepolia Faucet](https://sepolia-faucet.pk910.de/))

#### Connect to Zama Network

Add Zama network to MetaMask:

**Network Details**:
- Name: Zama Devnet
- RPC URL: https://devnet.zama.ai
- Chain ID: 8009
- Currency: ETH

**MetaMask Steps**:
1. Open MetaMask
2. Click network dropdown
3. "Add network"
4. Enter details above
5. Click "Add network"

---

## ✅ Testing Your Setup

### Verification Checklist

Run these commands to verify your setup:

```bash
# Check Node.js installation
node --version

# Check npm installation
npm --version

# Check git installation
git --version

# Navigate to project
cd privacy-virtual-pet

# Check dependencies are installed
npm list hardhat

# Verify contract compilation
npm run compile

# Run basic tests
npm run test
```

### Manual Testing

#### 1. Compile Test
```bash
npm run compile
```
Expected: All contracts compile without errors

#### 2. Deployment Test (Local)
```bash
npx hardhat run scripts/deploy.js --network hardhat
```
Expected: Contract deploys successfully, address printed

#### 3. Test Suite Execution
```bash
npm run test
```
Expected: All tests pass

#### 4. Frontend Test (Local)
```bash
npm start
```
Expected: Server runs on localhost:3000

---

## 🌐 Deployment

### Deploy to Hardhat (Local Development)

```bash
# Start Hardhat node (keeps running)
npx hardhat node

# In another terminal, deploy to it
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Zama Devnet

```bash
# Set your private key (NEVER commit this!)
export PRIVATE_KEY=your_private_key_here

# Run deployment
npm run deploy
```

Expected output:
```
Deploying Privacy Virtual Pet contract...
Contract deployed to: 0x...
Update your frontend with: contractAddress = "0x..."
```

### Deploy to Sepolia Testnet

```bash
# Make sure you have testnet ETH in your wallet

# Set private key
export PRIVATE_KEY=your_private_key_here

# Update hardhat.config.js with:
# sepolia: {
#   url: "https://sepolia.infura.io/v3/YOUR_KEY",
#   accounts: [process.env.PRIVATE_KEY]
# }

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
```

### Update Frontend with New Address

After deployment, update `app.js`:

```javascript
const CONTRACT_ADDRESS = "0x..."; // Your deployed address
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'hardhat'"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Insufficient gas fee"

**Solution**:
1. Check testnet ETH balance
2. Get free testnet ETH from faucet:
   - Sepolia: https://sepolia-faucet.pk910.de/
   - Zama: Ask in Discord community

### Issue: "MetaMask connection fails"

**Solution**:
1. Ensure MetaMask extension is installed
2. Check if already connected to site
3. Check network is set to testnet
4. Refresh page
5. Clear browser cache if needed

### Issue: "Contract compilation fails"

**Solution**:
```bash
# Clean and recompile
npx hardhat clean
npm run compile

# Check Solidity version in hardhat.config.js
# Should match import statements in contracts
```

### Issue: "Tests fail with encryption errors"

**Solution**:
1. Ensure FHEVM plugin is properly installed:
   ```bash
   npm install @fhevm/hardhat-plugin
   ```
2. Verify hardhat.config.js includes the plugin
3. Try running tests on fresh environment:
   ```bash
   npm run test -- --no-compile
   ```

### Issue: "Frontend can't connect to contract"

**Solution**:
1. Verify contract address in `app.js`
2. Check contract ABI matches deployed contract
3. Ensure connected wallet is on correct network
4. Check browser console for errors
5. Verify contract exists at address (check block explorer)

### Issue: "Cannot decrypted pet stats"

**Solution**:
1. Ensure you're the pet owner
2. Check network is Sepolia or Zama
3. Verify pet exists (getPetStats should not revert)
4. Check if `onlyPetOwner` modifier is blocking access

### Issue: "High gas costs"

**Notes**:
- FHE operations are expensive (100-200k gas typical)
- This is normal for encrypted state management
- Optimization comes from batching operations
- Consider gas optimization patterns for production

### Issue: "Port already in use"

**Solution**:
```bash
# Use different port
npm start -- --port 3001

# Or kill process using the port
# macOS/Linux:
lsof -ti:3000 | xargs kill

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Next Steps

After setup completion:

1. **Read HELLO_FHEVM_TUTORIAL.md**
   - Understand FHE concepts
   - Learn contract patterns

2. **Explore Contract Code**
   - Study PrivacyVirtualPet.sol
   - Understand TFHE operations
   - Review test examples

3. **Deploy Your Own Version**
   - Modify contract
   - Run tests
   - Deploy to testnet

4. **Build Your Application**
   - Create new contracts
   - Write frontend integration
   - Deploy and demonstrate

---

## 🔗 Useful Resources

### Official Documentation
- Zama FHEVM Docs: https://docs.zama.ai
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org/v6/
- Solidity Docs: https://docs.soliditylang.org/

### Community & Support
- Zama Discord: https://discord.com/invite/zama
- GitHub Issues: Report bugs and request features
- Community Forum: Get help from other developers
- Zama Twitter: @zama for announcements

### Testnet Faucets
- Sepolia: https://sepolia-faucet.pk910.de/
- Zama: Ask in community Discord

### Block Explorers
- Sepolia Etherscan: https://sepolia.etherscan.io
- Contract Verification: Needed for public transparency

---

## ✨ Common Next Steps

**After successful setup**:

1. Deploy contract to testnet
2. Create a pet in the live application
3. Perform interactions (feed, play, heal, rest)
4. Observe encrypted values in contract
5. Verify decryption works only for owner
6. Read code comments for learning
7. Modify contract and redeploy
8. Build your own FHE application

---

**Your setup is complete! Start building with FHE today.** 🔐✨
