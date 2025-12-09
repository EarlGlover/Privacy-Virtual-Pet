# Privacy Virtual Pet - Developer Guide

---

## 🎯 Purpose

This guide helps developers:
- Understand the codebase structure and patterns
- Contribute improvements and new features
- Create similar FHE applications
- Extend functionality responsibly

---

## 📖 Code Organization

### Directory Layout

```
privacy-virtual-pet/
├── contracts/                     # Smart contracts
│   ├── PrivacyVirtualPet.sol     # Main FHE implementation (180 lines)
│   ├── PrivacyVirtualPetV07.sol  # Version variant
│   └── SimplePrivacyVirtualPet.sol # Educational version
├── test/                          # Test suites
│   └── [test files]
├── scripts/                       # Deployment and utility scripts
│   └── deploy.js                  # Deployment script
├── frontend/                      # Web interface
│   ├── index.html                 # Main page (290 lines)
│   ├── app.js                     # Application logic (450+ lines)
│   └── [assets]
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Dependencies and scripts
└── [documentation files]
```

---

## 🏗️ Architecture Patterns

### Pattern 1: Encrypted State

**File**: `contracts/PrivacyVirtualPet.sol` (Lines 11-18)

```solidity
struct Pet {
    euint32 happiness;      // Encrypted 32-bit integer
    euint32 health;         // Encrypted 32-bit integer
    euint32 energy;         // Encrypted 32-bit integer
    euint8 petType;         // Encrypted 8-bit integer
    euint32 lastInteraction;// Encrypted timestamp
    ebool isEncrypted;      // Encrypted boolean
}
```

**Why**:
- Stores sensitive data in encrypted form
- Operations on encrypted values don't expose data
- Only owner can decrypt with access control

**Extension Point**:
Add more encrypted fields for additional mechanics:
```solidity
struct PetExtended {
    // ... existing fields ...
    euint32 experience;     // Pet level/experience
    euint32 hunger;         // Separate hunger stat
    euint32 cleanliness;    // Hygiene tracking
}
```

---

### Pattern 2: Access Control

**File**: `contracts/PrivacyVirtualPet.sol` (Lines 29-32)

```solidity
modifier onlyPetOwner() {
    require(hasPet[msg.sender], "You don't have a pet yet");
    _;
}
```

**Usage**:
```solidity
function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32) {
    // Only owner reaches here
    uint32 happiness = TFHE.decrypt(pet.happiness);
    return (happiness, health, energy);
}
```

**Why**:
- Ensures only owner can decrypt/modify their pet
- Prevents unauthorized access
- Central enforcement point

**Extension**:
Implement shared access for multi-player:
```solidity
modifier allowedAccess(address pet_owner) {
    require(
        msg.sender == pet_owner || hasPermission[pet_owner][msg.sender],
        "No access"
    );
    _;
}
```

---

### Pattern 3: Encrypted Operations

**File**: `contracts/PrivacyVirtualPet.sol` (Lines 51-71)

```solidity
function feedPet(bool _feed) external onlyPetOwner {
    Pet storage pet = pets[msg.sender];

    // Encrypted addition
    euint32 happinessBonus = TFHE.asEuint32(10);
    pet.happiness = TFHE.add(pet.happiness, happinessBonus);

    // Encrypted min for capping
    pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));

    pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

    emit PetAction(msg.sender, "feed", _feed);
}
```

**Key Operations**:
- `TFHE.asEuint32(value)` - Convert plaintext to encrypted
- `TFHE.add(a, b)` - Encrypted addition
- `TFHE.sub(a, b)` - Encrypted subtraction
- `TFHE.min(a, b)` - Encrypted minimum
- `TFHE.max(a, b)` - Encrypted maximum
- `TFHE.decrypt(value)` - Decrypt (owner only)

**Common Mistakes**:
```solidity
// ❌ WRONG: Can't use encrypted in condition
if (pet.happiness > 50) { }  // This won't compile

// ❌ WRONG: Can't do arithmetic without TFHE
pet.happiness = pet.happiness + 10;  // Error

// ✅ CORRECT: Use TFHE operations
pet.happiness = TFHE.add(pet.happiness, TFHE.asEuint32(10));
```

---

### Pattern 4: Time-Based Mechanics

**File**: `contracts/PrivacyVirtualPet.sol` (Lines 174-195)

```solidity
function applyTimeDecay() external onlyPetOwner {
    Pet storage pet = pets[msg.sender];
    uint32 currentTime = uint32(block.timestamp);
    uint32 lastInteraction = TFHE.decrypt(pet.lastInteraction);

    uint32 timeDiff = currentTime - lastInteraction;
    uint32 hoursElapsed = timeDiff / 3600;

    if (hoursElapsed > 0) {
        euint32 decay = TFHE.asEuint32(hoursElapsed * 2);
        pet.happiness = TFHE.sub(pet.happiness, decay);
        pet.energy = TFHE.sub(pet.energy, decay);
        pet.happiness = TFHE.max(pet.happiness, TFHE.asEuint32(0));
        pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));
        pet.lastInteraction = TFHE.asEuint32(currentTime);
    }
}
```

**Key Concepts**:
- Decryption of timestamp allowed (non-sensitive)
- Calculation in plaintext (time difference)
- Encrypted operation (apply decay)
- Floor at zero (prevent negative values)

**Extension**:
Different decay rates per stat:
```solidity
uint32 happinessDecayRate = 1;  // 1 point per hour
uint32 energyDecayRate = 2;      // 2 points per hour

pet.happiness = TFHE.sub(pet.happiness, TFHE.asEuint32(hoursElapsed * happinessDecayRate));
pet.energy = TFHE.sub(pet.energy, TFHE.asEuint32(hoursElapsed * energyDecayRate));
```

---

## 🔧 Modifying the Contracts

### Add a New Pet Stat

**Step 1**: Extend Pet struct in `contracts/PrivacyVirtualPet.sol`

```solidity
struct Pet {
    // ... existing fields ...
    euint32 hunger;         // NEW: Hunger level (0-100)
}
```

**Step 2**: Initialize in `createPet()`

```solidity
pets[msg.sender] = Pet({
    // ... existing initializations ...
    hunger: TFHE.asEuint32(50),  // NEW: Start at 50%
});
```

**Step 3**: Add action function

```solidity
function eatFood() external onlyPetOwner {
    Pet storage pet = pets[msg.sender];
    pet.hunger = TFHE.min(pet.hunger, TFHE.asEuint32(0));
    pet.energy = TFHE.sub(pet.energy, TFHE.asEuint32(5));
    pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));
    emit PetAction(msg.sender, "eat", true);
}
```

**Step 4**: Add getter function

```solidity
function getPetHunger() external view onlyPetOwner returns (uint32) {
    return TFHE.decrypt(pets[msg.sender].hunger);
}
```

**Step 5**: Update frontend

```javascript
async function loadPetData() {
    const [happiness, health, energy] = await contract.getPetStats();
    const hunger = await contract.getPetHunger();

    document.getElementById('hunger').textContent = hunger.toString();
}
```

### Add a New Interaction Type

**Step 1**: Create function

```solidity
function playGame() external onlyPetOwner {
    Pet storage pet = pets[msg.sender];

    // Random-like outcome (encrypted)
    // In real implementation, would need input randomness
    euint32 happinessGain = TFHE.asEuint32(8);

    pet.happiness = TFHE.add(pet.happiness, happinessGain);
    pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));

    // Playing requires energy
    pet.energy = TFHE.sub(pet.energy, TFHE.asEuint32(15));
    pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));

    pet.lastInteraction = TFHE.asEuint32(uint32(block.timestamp));

    emit PetAction(msg.sender, "play_game", true);
}
```

**Step 2**: Add to frontend

```javascript
async function playGame() {
    try {
        showStatus('Playing game with your pet...');
        const tx = await contract.playGame();
        await tx.wait();
        showStatus('Game played! 🎮');
        setTimeout(() => loadPetData(), 2000);
    } catch (error) {
        showStatus('Game failed: ' + error.message);
    }
}
```

---

## 🧪 Testing Patterns

### Test Structure

**File**: `test/PrivacyVirtualPet.test.js`

```javascript
const { expect } = require("chai");

describe("PrivacyVirtualPet", function () {
    let contract;
    let owner;

    // Setup before each test
    beforeEach(async function () {
        const PetContract = await ethers.getContractFactory("PrivacyVirtualPet");
        contract = await PetContract.deploy();
        [owner] = await ethers.getSigners();
    });

    // Test creation
    describe("Pet Creation", function () {
        it("should create a pet successfully", async function () {
            await contract.createPet(0);  // Cat type
            expect(await contract.hasPet(owner.address)).to.equal(true);
        });

        it("should prevent double creation", async function () {
            await contract.createPet(0);
            await expect(
                contract.createPet(1)
            ).to.be.revertedWith("You already have a pet");
        });
    });

    // Test operations
    describe("Pet Operations", function () {
        beforeEach(async function () {
            await contract.createPet(0);  // Create pet first
        });

        it("should increase happiness when feeding", async function () {
            const [before] = await contract.getPetStats();
            await contract.feedPet(true);
            const [after] = await contract.getPetStats();
            expect(after).to.be.gt(before);
        });
    });
});
```

### Testing FHE Operations

```javascript
it("should properly cap stats at maximum", async function () {
    await contract.createPet(0);

    // Feed pet multiple times until max
    for (let i = 0; i < 20; i++) {
        await contract.feedPet(true);
    }

    const [happiness] = await contract.getPetStats();
    // Happiness should not exceed 100
    expect(happiness).to.be.lte(100);
});
```

---

## 🖥️ Frontend Development

### JavaScript Patterns

**File**: `frontend/app.js`

**Class Structure**:
```javascript
class PrivacyVirtualPetApp {
    constructor() {
        this.fhevm = null;
        this.provider = null;
        this.signer = null;
        this.contract = null;
    }

    async init() {
        // Initialize FHEVM
        // Setup event listeners
        // Load initial state
    }
}

// Global instance
let app;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    app = new PrivacyVirtualPetApp();
    await app.init();
});
```

### Adding New UI Elements

**HTML** (`index.html`):
```html
<div class="stats">
    <div>Hunger: <span id="hunger">--</span>/100</div>
</div>

<button onclick="eatFood()">🍗 Eat</button>
```

**JavaScript** (`app.js`):
```javascript
async function eatFood() {
    try {
        showStatus('Feeding pet...');
        const tx = await app.contract.eatFood();
        await tx.wait();
        showStatus('Meal served! 🍽️');
        setTimeout(() => app.loadPetData(), 1000);
    } catch (error) {
        showStatus('Error: ' + error.message);
    }
}
```

### Error Handling

```javascript
async function performAction(action, handler) {
    try {
        // Validate state
        if (!app.contract) {
            showStatus('Please connect wallet first');
            return;
        }

        // Show loading
        showStatus(`Performing ${action}...`);

        // Execute
        const tx = await handler();

        // Wait for confirmation
        showStatus('Waiting for confirmation...');
        const receipt = await tx.wait();

        // Success
        showStatus(`${action} successful! ✅`);

        // Reload data
        await app.loadPetData();

    } catch (error) {
        // Handle specific errors
        if (error.message.includes("You don't have a pet")) {
            showStatus('No pet found. Create one first!');
        } else if (error.message.includes("user rejected")) {
            showStatus('Transaction cancelled');
        } else {
            showStatus('Error: ' + error.message);
            console.error(error);
        }
    }
}
```

---

## 📊 Code Style Guide

### Solidity Style

```solidity
// GOOD: Clear names and documentation
function feedPet(bool _feed) external onlyPetOwner {
    require(_feed, "Invalid action");

    Pet storage pet = pets[msg.sender];

    // Increase happiness and health
    euint32 happinessBonus = TFHE.asEuint32(10);
    pet.happiness = TFHE.add(pet.happiness, happinessBonus);
}

// BAD: Unclear names
function fp(bool f) external {
    Pet storage p = pets[msg.sender];
    p.h = TFHE.add(p.h, TFHE.asEuint32(10));
}
```

### JavaScript Style

```javascript
// GOOD: Clear variable names
async function feedPet() {
    const currentStats = await contract.getPetStats();
    const feedTx = await contract.feedPet(true);
    await feedTx.wait();
}

// BAD: Unclear abbreviations
async function f() {
    const s = await c.getStats();
    const t = await c.f(true);
    await t.w();
}
```

---

## 🔐 Security Best Practices

### Smart Contract Security

**1. Input Validation**
```solidity
function setPetType(uint8 _petType) external onlyPetOwner {
    require(_petType <= 3, "Invalid pet type");  // ✅ Validate
    // ...
}
```

**2. Prevent Integer Overflow**
```solidity
// ✅ CORRECT: Use TFHE min/max
pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));

// ❌ WRONG: Could overflow encrypted value
pet.happiness = TFHE.add(pet.happiness, TFHE.asEuint32(999999));
```

**3. Access Control**
```solidity
// ✅ CORRECT: Owner-only operations
function getPetStats() external view onlyPetOwner returns (...) {
    return TFHE.decrypt(pet.happiness);
}

// ❌ WRONG: No access control
function getPetStats() external view returns (...) {
    return TFHE.decrypt(pet.happiness);  // Anyone can decrypt!
}
```

### Frontend Security

**1. Secure Wallet Connection**
```javascript
// ✅ CORRECT: Check provider exists
if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
}

// ❌ WRONG: Assume MetaMask exists
const provider = new ethers.BrowserProvider(window.ethereum);
```

**2. Transaction Validation**
```javascript
// ✅ CORRECT: Check before sending
if (!this.signer) {
    showStatus("Please connect wallet");
    return;
}

// ❌ WRONG: Assume signer is ready
const tx = await contract.feedPet(true);
```

**3. Private Key Handling**
```
// ✅ CORRECT: Use .env file
PRIVATE_KEY=your_key_here
// .gitignore includes .env

// ❌ WRONG: Hardcode keys
const privateKey = "0x...";  // Exposed!
```

---

## 🚀 Performance Optimization

### Gas Optimization

**Current Baseline**:
- Pet creation: ~150k gas
- Interaction: ~80k-120k gas
- Decryption: ~30k gas

**Optimization Strategies**:

1. **Batch Operations**
```solidity
// Instead of multiple transactions
function multipleActions(
    bool feed,
    bool play,
    bool heal
) external onlyPetOwner {
    // Combine operations in one transaction
}
```

2. **State Efficiency**
```solidity
// ❌ High storage cost
mapping(address => uint32) happiness;
mapping(address => uint32) health;
mapping(address => uint32) energy;

// ✅ Packed storage
struct Pet {
    euint32 happiness;
    euint32 health;
    euint32 energy;
}
mapping(address => Pet) pets;
```

---

## 📚 Contributing Guidelines

### Code Review Checklist

Before submitting:
1. ✅ Code compiles without errors
2. ✅ All tests pass
3. ✅ New tests added for new functionality
4. ✅ Comments explain complex logic
5. ✅ No hardcoded addresses or keys
6. ✅ Error messages are clear
7. ✅ Variable names are descriptive

### Commit Message Format

```
[TYPE] Brief description (50 chars max)

Detailed explanation if needed
- What changed
- Why it changed
- Any important notes

Fixes: #issue_number (if applicable)
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `style`

**Examples**:
```
feat: Add hunger stat to pet mechanics
fix: Prevent integer overflow in stat calculations
docs: Update architecture guide for new features
test: Add comprehensive encryption operation tests
```

---

## 🎓 Learning Resources

### Understand TFHE

1. Read HELLO_FHEVM_TUTORIAL.md for concepts
2. Study Zama documentation: https://docs.zama.ai
3. Review example patterns in this codebase
4. Experiment with small modifications

### Improve Your Skills

1. **Solidity**: Master encrypted types and operations
2. **Web3.js**: Handle contract interaction
3. **Testing**: Write comprehensive test suites
4. **Frontend**: Build responsive user interfaces
5. **DevOps**: Deploy and manage smart contracts

---

## 🐛 Debugging Tips

### Contract Debugging

```javascript
// Add detailed logging
console.log("Owner:", owner.address);
console.log("Has Pet:", await contract.hasPet(owner.address));

// Use hardhat's debug
npx hardhat test --grep "test name"

// Print contract state
console.log(await contract.getPetStats());
```

### Frontend Debugging

```javascript
// Browser DevTools
console.log("Signer:", await this.signer.getAddress());
console.log("Contract:", this.contract.address);

// Check transaction status
const receipt = await tx.wait();
console.log("Status:", receipt.status);

// Monitor events
contract.on("PetAction", (owner, action, value) => {
    console.log(`Pet action: ${action}`);
});
```

---

## 🔗 Related Files

- **SUBMISSION.md** - Competition requirements and deliverables
- **ARCHITECTURE.md** - Technical architecture deep-dive
- **SETUP_GUIDE.md** - Installation and configuration
- **HELLO_FHEVM_TUTORIAL.md** - Learning guide with examples

---

**Happy coding and welcome to the FHE developer community!** 🔐✨
