# Hello FHEVM: Building Your First Confidential Application 🔐

Welcome to the world of **Fully Homomorphic Encryption (FHE)** on blockchain! This comprehensive tutorial will guide you through building your first confidential application - a Privacy Virtual Pet game where all pet data remains encrypted on-chain.

## 🎯 What You'll Learn

By the end of this tutorial, you'll understand:
- How to write FHE-enabled smart contracts using FHEVM
- How to handle encrypted inputs and outputs in your confidential application
- How to build a complete frontend that interacts with FHE contracts
- How to deploy and test confidential applications on Zama's infrastructure

## 📋 Prerequisites

This tutorial assumes you have:
- ✅ Basic Solidity knowledge (can write simple smart contracts)
- ✅ Familiarity with Ethereum development tools (Hardhat, MetaMask)
- ✅ Basic JavaScript/HTML/CSS skills
- ❌ **NO** cryptography or advanced math background needed!

## 🏗️ What We're Building

We'll create a **Privacy Virtual Pet** - a blockchain game where:
- Pet stats (health, happiness, energy) are **encrypted on-chain**
- Only the pet owner can see true values
- All computations happen on encrypted data
- Complete privacy is maintained while enabling gameplay

## 🚀 Tutorial Overview

### Part 1: Understanding FHE Basics
### Part 2: Setting Up FHEVM Development Environment
### Part 3: Writing Your First FHE Smart Contract
### Part 4: Building the Frontend Interface
### Part 5: Deployment and Testing
### Part 6: Advanced FHE Patterns

---

## Part 1: Understanding FHE Basics 🧠

### What is Fully Homomorphic Encryption?

**FHE** allows computations to be performed on encrypted data without decrypting it first. In blockchain terms:

- **Traditional contracts**: Data is visible to everyone
- **FHE contracts**: Data stays encrypted, but contracts can still compute with it

### Real-World Example

Imagine a traditional health tracking app vs our FHE pet:

**Traditional Approach:**
```solidity
mapping(address => uint256) public petHealth; // Everyone can see: Alice's pet has 75 health
```

**FHE Approach:**
```solidity
mapping(address => euint32) private petHealth; // Encrypted: "zK8mX9p..." (only Alice knows it's 75)
```

### Key FHE Concepts

1. **Encrypted Types**: `euint32`, `ebool`, `eaddress` instead of `uint32`, `bool`, `address`
2. **Encrypted Operations**: `TFHE.add()`, `TFHE.sub()` instead of `+`, `-`
3. **Access Control**: Only authorized users can decrypt their data

---

## Part 2: Setting Up FHEVM Development Environment ⚙️

### Step 1: Initialize Your Project

```bash
mkdir privacy-virtual-pet
cd privacy-virtual-pet
npm init -y
```

### Step 2: Install FHEVM Dependencies

```bash
npm install --save-dev hardhat
npm install fhevm@^0.5.0
npm install @fhevm/hardhat-plugin@0.0.1-3
npm install @nomicfoundation/hardhat-toolbox@^5.0.0
```

### Step 3: Configure Hardhat

Create `hardhat.config.js`:

```javascript
require('@nomicfoundation/hardhat-toolbox');
require('@fhevm/hardhat-plugin');

module.exports = {
  solidity: \"0.8.24\",
  networks: {
    zama: {
      url: \"https://devnet.zama.ai/\",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Step 4: Project Structure

```
privacy-virtual-pet/
├── contracts/
│   └── PrivacyVirtualPet.sol
├── scripts/
│   └── deploy.js
├── frontend/
│   ├── index.html
│   └── app.js
└── hardhat.config.js
```

---

## Part 3: Writing Your First FHE Smart Contract 📝

### Step 1: Basic Contract Structure

Create `contracts/PrivacyVirtualPet.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import \"fhevm/lib/TFHE.sol\";
import \"fhevm/gateway/GatewayCaller.sol\";

contract PrivacyVirtualPet is GatewayCaller {
    // Encrypted pet stats - only owner can decrypt
    struct Pet {
        euint32 happiness;  // Encrypted happiness (0-100)
        euint32 health;     // Encrypted health (0-100)
        euint32 energy;     // Encrypted energy (0-100)
        uint8 petType;      // Public pet type (0=cat, 1=dog, etc)
        bool exists;        // Public existence flag
    }

    // Mapping from owner to their pet
    mapping(address => Pet) private pets;

    // Events for transparency (values remain encrypted)
    event PetCreated(address indexed owner, uint8 petType);
    event PetAction(address indexed owner, string action);

    constructor() {
        TFHE.setFHEVM(FHEVMConfig.defaultConfig());
    }
}
```

### Step 2: Creating Encrypted Pet Data

```solidity
function createPet(uint8 _petType) external {
    require(!pets[msg.sender].exists, \"Pet already exists\");
    require(_petType < 4, \"Invalid pet type\");

    // Create encrypted initial stats (all start at 75)
    euint32 initialHappiness = TFHE.asEuint32(75);
    euint32 initialHealth = TFHE.asEuint32(80);
    euint32 initialEnergy = TFHE.asEuint32(60);

    // Store encrypted pet data
    pets[msg.sender] = Pet({
        happiness: initialHappiness,
        health: initialHealth,
        energy: initialEnergy,
        petType: _petType,
        exists: true
    });

    // Allow owner to decrypt their own data
    TFHE.allow(initialHappiness, msg.sender);
    TFHE.allow(initialHealth, msg.sender);
    TFHE.allow(initialEnergy, msg.sender);

    emit PetCreated(msg.sender, _petType);
}
```

### Step 3: Encrypted Computations

```solidity
function feedPet(einput encryptedFeed, bytes calldata inputProof) external {
    require(pets[msg.sender].exists, \"No pet found\");

    // Convert encrypted input to euint32
    ebool shouldFeed = TFHE.asEbool(encryptedFeed, inputProof);

    Pet storage pet = pets[msg.sender];

    // Encrypted computation: if shouldFeed, add 10 to happiness (max 100)
    euint32 happinessIncrease = TFHE.select(shouldFeed, TFHE.asEuint32(10), TFHE.asEuint32(0));
    euint32 newHappiness = TFHE.add(pet.happiness, happinessIncrease);

    // Cap at 100 using encrypted comparison
    ebool exceedsMax = TFHE.gt(newHappiness, TFHE.asEuint32(100));
    pet.happiness = TFHE.select(exceedsMax, TFHE.asEuint32(100), newHappiness);

    // Update permissions
    TFHE.allow(pet.happiness, msg.sender);

    emit PetAction(msg.sender, \"feed\");
}
```

### Step 4: Decryption Functions

```solidity
function getPetStats() external view returns (uint32, uint32, uint32) {
    require(pets[msg.sender].exists, \"No pet found\");

    Pet storage pet = pets[msg.sender];

    // Only the owner can decrypt their pet's stats
    return (
        TFHE.decrypt(pet.happiness),
        TFHE.decrypt(pet.health),
        TFHE.decrypt(pet.energy)
    );
}
```

---

## Part 4: Building the Frontend Interface 🖥️

### Step 1: HTML Structure

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Privacy Virtual Pet - Hello FHEVM</title>
    <script src=\"https://cdn.jsdelivr.net/npm/fhevmjs@latest/bundle.min.js\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/ethers@6.13.0/dist/ethers.umd.min.js\"></script>
</head>
<body>
    <div class=\"container\">
        <h1>🐾 Privacy Virtual Pet</h1>
        <p>Your First FHEVM Application - Pet stats are encrypted on-chain!</p>

        <div id=\"wallet-section\">
            <button id=\"connect-wallet\">Connect Wallet</button>
            <div id=\"wallet-info\" class=\"hidden\">
                <p>Connected: <span id=\"wallet-address\"></span></p>
            </div>
        </div>

        <div id=\"pet-section\" class=\"hidden\">
            <h2>Your Virtual Pet</h2>
            <div id=\"pet-display\">
                <div class=\"pet-avatar\" id=\"pet-avatar\">🐱</div>
                <div class=\"pet-stats\">
                    <div>Happiness: <span id=\"happiness\">--</span>/100</div>
                    <div>Health: <span id=\"health\">--</span>/100</div>
                    <div>Energy: <span id=\"energy\">--</span>/100</div>
                </div>
            </div>

            <div class=\"actions\">
                <button onclick=\"feedPet()\">🍎 Feed Pet</button>
                <button onclick=\"playWithPet()\">🎾 Play</button>
                <button onclick=\"healPet()\">💊 Heal</button>
            </div>
        </div>

        <div id=\"status\"></div>
    </div>

    <script src=\"app.js\"></script>
</body>
</html>
```

### Step 2: JavaScript FHE Integration

Create `frontend/app.js`:

```javascript
class PrivacyVirtualPetApp {
    constructor() {
        this.fhevm = null;
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = \"YOUR_DEPLOYED_CONTRACT_ADDRESS\";
        this.contractABI = [/* Your contract ABI */];
    }

    async init() {
        await this.initFHEVM();
        this.setupEventListeners();
    }

    async initFHEVM() {
        // Initialize FHEVM client for encryption
        this.fhevm = await fhevmjs.createInstance({
            chainId: 9000, // Zama devnet
            publicKeyId: \"YOUR_PUBLIC_KEY_ID\"
        });
    }

    async connectWallet() {
        try {
            // Connect to MetaMask
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Initialize contract
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

            // Update UI
            const address = await this.signer.getAddress();
            document.getElementById('wallet-address').textContent =
                `${address.substring(0, 6)}...${address.substring(38)}`;

            document.getElementById('wallet-section').classList.add('connected');
            document.getElementById('pet-section').classList.remove('hidden');

            // Load pet data
            await this.loadPetData();

        } catch (error) {
            console.error('Wallet connection failed:', error);
        }
    }
}
```

### Step 3: Encrypted Input Handling

```javascript
async feedPet() {
    try {
        this.showStatus('Preparing encrypted input...');

        // Create encrypted input (true = feed the pet)
        const encryptedInput = this.fhevm.encrypt_bool(true);

        this.showStatus('Feeding pet... Please confirm transaction');

        // Send transaction with encrypted input
        const tx = await this.contract.feedPet(
            encryptedInput.handles[0],
            encryptedInput.inputProof
        );

        this.showStatus('Transaction submitted, waiting for confirmation...');
        await tx.wait();

        this.showStatus('Pet fed successfully! 🎉');

        // Reload pet data after action
        setTimeout(() => this.loadPetData(), 2000);

    } catch (error) {
        console.error('Feed pet failed:', error);
        this.showStatus('Failed to feed pet: ' + error.message);
    }
}

async loadPetData() {
    try {
        // Call contract to get decrypted stats (only owner can decrypt)
        const [happiness, health, energy] = await this.contract.getPetStats();

        // Update UI with decrypted values
        document.getElementById('happiness').textContent = happiness.toString();
        document.getElementById('health').textContent = health.toString();
        document.getElementById('energy').textContent = energy.toString();

    } catch (error) {
        console.error('Failed to load pet data:', error);
        // Handle case where user doesn't have a pet yet
        if (error.message.includes('No pet found')) {
            await this.createPet();
        }
    }
}
```

---

## Part 5: Deployment and Testing 🚀

### Step 1: Deploy Contract

Create `scripts/deploy.js`:

```javascript
const { ethers } = require(\"hardhat\");

async function main() {
    console.log(\"Deploying Privacy Virtual Pet contract...\");

    const PrivacyVirtualPet = await ethers.getContractFactory(\"PrivacyVirtualPet\");
    const contract = await PrivacyVirtualPet.deploy();

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`Contract deployed to: ${contractAddress}`);

    // Update frontend with contract address
    console.log(`Update your frontend app.js with: contractAddress = \"${contractAddress}\"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### Step 2: Deploy to Zama Devnet

```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network zama

# Note the contract address and update frontend/app.js
```

### Step 3: Test Your Application

1. **Start local server**:
   ```bash
   cd frontend
   python -m http.server 8000
   ```

2. **Open browser**: Navigate to `http://localhost:8000`

3. **Connect MetaMask**: Make sure you're on Zama devnet

4. **Test FHE functionality**:
   - Create a pet (encrypted stats initialized)
   - Feed pet (encrypted computation)
   - View stats (only you can decrypt)

---

## Part 6: Advanced FHE Patterns 🎓

### Pattern 1: Encrypted Comparisons

```solidity
function isHappy() external view returns (bool) {
    require(pets[msg.sender].exists, \"No pet found\");

    Pet storage pet = pets[msg.sender];

    // Encrypted comparison: happiness > 70
    ebool isHappyEncrypted = TFHE.gt(pet.happiness, TFHE.asEuint32(70));

    // Only owner can decrypt the result
    return TFHE.decrypt(isHappyEncrypted);
}
```

### Pattern 2: Conditional Encrypted Operations

```solidity
function autoHeal() external {
    require(pets[msg.sender].exists, \"No pet found\");

    Pet storage pet = pets[msg.sender];

    // If health < 30, heal to 50, otherwise no change
    ebool needsHealing = TFHE.lt(pet.health, TFHE.asEuint32(30));
    pet.health = TFHE.select(needsHealing, TFHE.asEuint32(50), pet.health);

    TFHE.allow(pet.health, msg.sender);
}
```

### Pattern 3: Encrypted Random Events

```solidity
function randomEvent(einput encryptedSeed, bytes calldata inputProof) external {
    require(pets[msg.sender].exists, \"No pet found\");

    euint32 seed = TFHE.asEuint32(encryptedSeed, inputProof);
    Pet storage pet = pets[msg.sender];

    // Generate encrypted random number 0-2
    euint32 randomValue = TFHE.rem(seed, TFHE.asEuint32(3));

    // Different outcomes based on encrypted random value
    ebool isZero = TFHE.eq(randomValue, TFHE.asEuint32(0));
    ebool isOne = TFHE.eq(randomValue, TFHE.asEuint32(1));

    // Apply different effects based on random outcome
    euint32 happinessChange = TFHE.select(isZero, TFHE.asEuint32(10),
                             TFHE.select(isOne, TFHE.asEuint32(5), TFHE.asEuint32(0)));

    pet.happiness = TFHE.add(pet.happiness, happinessChange);
    TFHE.allow(pet.happiness, msg.sender);
}
```

---

## 🎉 Congratulations!

You've successfully built your first FHEVM confidential application! You now understand:

✅ **FHE Fundamentals**: How encryption works on blockchain
✅ **FHEVM Development**: Writing contracts with encrypted data
✅ **Frontend Integration**: Handling encrypted inputs/outputs
✅ **Privacy Patterns**: Common FHE development patterns

## 🚀 Next Steps

1. **Experiment**: Add new encrypted features to your pet
2. **Optimize**: Learn gas optimization techniques for FHE
3. **Scale**: Build multi-user FHE applications
4. **Contribute**: Join the FHEVM community and contribute to the ecosystem

## 📚 Additional Resources

- **FHEVM Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **Example Code Repository**: [GitHub - Privacy Virtual Pet](https://github.com/EarlGlover/PrivacyVirtualPetV07)
- **Community Discord**: Join the Zama community
- **FHE.org**: Learn more about homomorphic encryption

## ❓ Troubleshooting

### Common Issues:

**Q: Contract deployment fails**
A: Ensure you're using compatible FHEVM version and correct network configuration

**Q: Encrypted operations revert**
A: Check that you're using `TFHE.allow()` for permission management

**Q: Frontend can't decrypt values**
A: Verify the user is the owner and has proper access permissions

**Q: Gas costs too high**
A: FHE operations are expensive - optimize by batching operations

---

**Welcome to the future of privacy-preserving blockchain applications! 🔐✨**

*Start building confidential applications today with FHEVM*