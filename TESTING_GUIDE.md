# Privacy Virtual Pet - Testing and Validation Guide

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [Frontend Testing](#frontend-testing)
5. [Network Testing](#network-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

---

## 🧪 Testing Overview

### Testing Strategy

The Privacy Virtual Pet project uses a comprehensive testing approach:

```
┌─────────────────────────────────────┐
│  Unit Tests (Smart Contracts)       │
│  - Individual function behavior     │
│  - Encrypted operations             │
│  - Access control                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Integration Tests                  │
│  - Contract interaction             │
│  - State transitions                │
│  - Event emission                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Frontend Tests                     │
│  - Wallet connection                │
│  - Contract calls                   │
│  - UI updates                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Network Tests (Testnet)            │
│  - Real deployment                  │
│  - Live interactions                │
│  - Transaction verification         │
└─────────────────────────────────────┘
```

---

## 🧬 Unit Testing

### Running Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/PrivacyVirtualPet.test.js

# Run specific test suite
npx hardhat test --grep "Pet Creation"

# Run with detailed output
npx hardhat test --verbose

# Run with gas reporting
REPORT_GAS=true npm run test
```

### Test Structure

**File**: `test/PrivacyVirtualPet.test.js`

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivacyVirtualPet", function () {
    let contract;
    let owner;
    let addr1;

    // Setup
    beforeEach(async function () {
        const PetContract = await ethers.getContractFactory("PrivacyVirtualPet");
        contract = await PetContract.deploy();
        [owner, addr1] = await ethers.getSigners();
    });

    // Tests here
});
```

---

### Test Categories

#### 1. **Deployment Tests**

```javascript
describe("Deployment", function () {
    it("should deploy successfully", async function () {
        expect(contract.address).to.not.equal(0);
    });

    it("should initialize with no pets", async function () {
        expect(await contract.hasPet(owner.address)).to.equal(false);
    });
});
```

---

#### 2. **Pet Creation Tests**

```javascript
describe("Pet Creation", function () {
    it("should create a pet with initial stats", async function () {
        await contract.createPet(0);  // Cat type

        expect(await contract.hasPet(owner.address)).to.equal(true);
    });

    it("should initialize encrypted stats correctly", async function () {
        await contract.createPet(0);

        // Stats should be encrypted but decryptable
        const [happiness, health, energy] = await contract.getPetStats();
        expect(happiness).to.equal(75);
        expect(health).to.equal(80);
        expect(energy).to.equal(60);
    });

    it("should reject invalid pet types", async function () {
        await expect(
            contract.createPet(5)  // Invalid type
        ).to.be.revertedWith("Invalid pet type");
    });

    it("should prevent duplicate pets", async function () {
        await contract.createPet(0);

        await expect(
            contract.createPet(1)
        ).to.be.revertedWith("You already have a pet");
    });

    it("should emit PetCreated event", async function () {
        await expect(contract.createPet(0))
            .to.emit(contract, "PetCreated")
            .withArgs(owner.address, 0);
    });
});
```

---

#### 3. **Pet Interaction Tests**

**Feed Function**:
```javascript
describe("Feed Pet", function () {
    beforeEach(async function () {
        await contract.createPet(0);
    });

    it("should increase happiness when feeding", async function () {
        const [happinessBefore] = await contract.getPetStats();

        await contract.feedPet(true);

        const [happinessAfter] = await contract.getPetStats();
        expect(happinessAfter).to.equal(happinessBefore + 10);
    });

    it("should increase health when feeding", async function () {
        const [, healthBefore] = await contract.getPetStats();

        await contract.feedPet(true);

        const [, healthAfter] = await contract.getPetStats();
        expect(healthAfter).to.equal(healthBefore + 5);
    });

    it("should cap happiness at 100", async function () {
        // Set happiness to 95
        await contract.feedPet(true);  // +10 = 85
        await contract.feedPet(true);  // +10 = 95

        // Feed again - should cap at 100
        await contract.feedPet(true);  // +10 = cap at 100

        const [happiness] = await contract.getPetStats();
        expect(happiness).to.equal(100);
    });

    it("should emit PetAction event", async function () {
        await expect(contract.feedPet(true))
            .to.emit(contract, "PetAction")
            .withArgs(owner.address, "feed", true);
    });

    it("should revert without pet", async function () {
        await expect(
            addr1.call({
                to: contract.address,
                data: contract.interface.encodeFunctionData('feedPet', [true])
            })
        ).to.be.reverted;
    });
});
```

**Play Function**:
```javascript
describe("Play With Pet", function () {
    beforeEach(async function () {
        await contract.createPet(0);
    });

    it("should increase happiness more than feeding", async function () {
        const [happinessBefore] = await contract.getPetStats();

        await contract.playWithPet(true);

        const [happinessAfter] = await contract.getPetStats();
        expect(happinessAfter - happinessBefore).to.equal(15);
    });

    it("should decrease energy when playing", async function () {
        const [, , energyBefore] = await contract.getPetStats();

        await contract.playWithPet(true);

        const [, , energyAfter] = await contract.getPetStats();
        expect(energyBefore - energyAfter).to.equal(10);
    });

    it("should not decrease energy below zero", async function () {
        // Deplete energy first
        for (let i = 0; i < 10; i++) {
            await contract.playWithPet(true);
        }

        const [, , energyAfter] = await contract.getPetStats();
        expect(energyAfter).to.be.gte(0);
    });
});
```

---

#### 4. **Access Control Tests**

```javascript
describe("Access Control", function () {
    beforeEach(async function () {
        await contract.connect(owner).createPet(0);
    });

    it("should prevent non-owner from accessing pet", async function () {
        await expect(
            contract.connect(addr1).getPetStats()
        ).to.be.revertedWith("You don't have a pet yet");
    });

    it("should prevent non-owner from feeding pet", async function () {
        await expect(
            contract.connect(addr1).feedPet(true)
        ).to.be.revertedWith("You don't have a pet yet");
    });

    it("should allow only pet owner to decrypt", async function () {
        // Owner can decrypt
        const [happiness] = await contract.connect(owner).getPetStats();
        expect(happiness).to.be.a("number");

        // Non-owner cannot
        await expect(
            contract.connect(addr1).getPetStats()
        ).to.be.revertedWith("You don't have a pet yet");
    });
});
```

---

#### 5. **Time-Based Mechanics Tests**

```javascript
describe("Time Decay", function () {
    beforeEach(async function () {
        await contract.createPet(0);
    });

    it("should apply decay after time passes", async function () {
        const [happinessBefore] = await contract.getPetStats();

        // Advance time by 1 hour
        await ethers.provider.send("hardhat_mine", ["0x0E10"]);  // ~4096 blocks

        await contract.applyTimeDecay();

        const [happinessAfter] = await contract.getPetStats();
        // Should have decayed (2 points per hour)
        expect(happinessAfter).to.be.lt(happinessBefore);
    });

    it("should not decay without time passing", async function () {
        const [happinessBefore] = await contract.getPetStats();

        // Don't advance time, just apply decay
        await contract.applyTimeDecay();

        const [happinessAfter] = await contract.getPetStats();
        expect(happinessAfter).to.equal(happinessBefore);
    });

    it("should not decay stats below zero", async function () {
        // Advance time significantly
        await ethers.provider.send("hardhat_mine", ["0x5B8D"]);  // Many blocks

        await contract.applyTimeDecay();

        const [happiness, health, energy] = await contract.getPetStats();
        expect(happiness).to.be.gte(0);
        expect(health).to.be.gte(0);
        expect(energy).to.be.gte(0);
    });
});
```

---

#### 6. **Customization Tests**

```javascript
describe("Pet Customization", function () {
    beforeEach(async function () {
        await contract.createPet(0);  // Start as cat
    });

    it("should change pet type", async function () {
        await contract.setPetType(1);  // Change to dog

        const petType = await contract.getPetType();
        expect(petType).to.equal(1);
    });

    it("should reject invalid pet types", async function () {
        await expect(
            contract.setPetType(5)
        ).to.be.revertedWith("Invalid pet type");
    });

    it("should toggle encryption flag", async function () {
        let isEncrypted = await contract.isPetEncrypted();
        expect(isEncrypted).to.equal(true);  // Initially encrypted

        await contract.encryptPetData(false);
        isEncrypted = await contract.isPetEncrypted();
        expect(isEncrypted).to.equal(false);
    });
});
```

---

### Test Utilities

#### Helper Functions

```javascript
// Get pet stats with named return values
async function getStats() {
    const [happiness, health, energy] = await contract.getPetStats();
    return { happiness, health, energy };
}

// Perform action and check result
async function performActionAndCheck(action, expectedChange) {
    const before = await getStats();
    await action();
    const after = await getStats();
    return { before, after, expectedChange };
}

// Example usage
const result = await performActionAndCheck(
    () => contract.feedPet(true),
    { happiness: +10, health: +5 }
);
```

---

## 🔗 Integration Testing

### Cross-Function Tests

```javascript
describe("Complex Interactions", function () {
    beforeEach(async function () {
        await contract.createPet(0);
    });

    it("should handle multiple actions in sequence", async function () {
        const before = await getStats();

        // Multiple actions
        await contract.feedPet(true);
        await contract.playWithPet(true);
        await contract.healPet(true);

        const after = await getStats();

        // Verify combined effects
        expect(after.happiness).to.be.gt(before.happiness);
        expect(after.health).to.be.gt(before.health);
        expect(after.energy).to.be.lt(before.energy);  // From play
    });

    it("should maintain consistency after reset", async function () {
        await contract.feedPet(true);
        const modified = await getStats();

        await contract.resetPet();
        const reset = await getStats();

        expect(reset.happiness).to.equal(75);
        expect(reset.health).to.equal(80);
        expect(reset.energy).to.equal(60);
    });
});
```

---

## 🖥️ Frontend Testing

### Manual Testing Checklist

#### Wallet Connection
- [ ] MetaMask extension installed
- [ ] Can click "Connect Wallet"
- [ ] Address displayed correctly
- [ ] Network switching works
- [ ] Disconnection works

#### Pet Creation
- [ ] Can create pet with all types
- [ ] Pet avatar displays correctly
- [ ] Stats show initial values
- [ ] Cannot create duplicate pets
- [ ] Error messages appear

#### Pet Interactions
- [ ] Feed button works
- [ ] Play button works
- [ ] Heal button works
- [ ] Rest button works
- [ ] Stats update after actions
- [ ] Loading states display

#### UI/UX
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] All buttons are clickable
- [ ] No console errors
- [ ] Proper error messages

### Automated Frontend Testing

```javascript
// Example: Puppeteer test
const puppeteer = require('puppeteer');

describe('Frontend Integration', function() {
    let browser;
    let page;

    before(async function() {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
    });

    after(async function() {
        await browser.close();
    });

    it('should load page', async function() {
        const title = await page.title();
        expect(title).to.include('Privacy Virtual Pet');
    });

    it('should show connect button', async function() {
        const button = await page.$('#connect-wallet');
        expect(button).to.exist;
    });
});
```

---

## 🌐 Network Testing

### Sepolia Testnet Testing

#### Prerequisites
1. MetaMask installed
2. Sepolia network added
3. Testnet ETH funded (get from faucet)

#### Test Procedure

**1. Deploy to Testnet**
```bash
npm run deploy
# Note the contract address
```

**2. Update Frontend**
```javascript
const CONTRACT_ADDRESS = "0x...";  // From deployment
```

**3. Test on Live Network**
- Open application in browser
- Connect MetaMask to Sepolia
- Create pet
- Perform actions
- Check transactions on Etherscan

**4. Verify Transactions**
- Visit: https://sepolia.etherscan.io
- Search for contract address
- Verify contract code (if needed)
- Check transaction details

---

## ⚡ Performance Testing

### Gas Usage Reporting

```bash
# Enable gas reporting
REPORT_GAS=true npm run test
```

Output example:
```
  ·────────────────────────────────────┐
  ·  Gas Used  ·  Avg Gas per Call   ·
  ├────────────────────────────────────┤
  ·  createPet        ·  154,235       ·
  ·  feedPet          ·  98,432        ·
  ·  playWithPet      ·  107,654       ·
  ·  getPetStats      ·  28,456        ·
  └────────────────────────────────────┘
```

### Load Testing

```javascript
describe("Load Testing", function () {
    it("should handle multiple pet operations", async function () {
        this.timeout(60000);  // Increase timeout

        await contract.createPet(0);

        // Perform 50 operations
        for (let i = 0; i < 50; i++) {
            const action = i % 4;
            switch(action) {
                case 0: await contract.feedPet(true); break;
                case 1: await contract.playWithPet(true); break;
                case 2: await contract.healPet(true); break;
                case 3: await contract.restPet(true); break;
            }
        }

        const [h, he, en] = await contract.getPetStats();
        expect(h).to.exist;
    });
});
```

---

## 🔒 Security Testing

### Input Validation Tests

```javascript
describe("Security - Input Validation", function () {
    beforeEach(async function () {
        await contract.createPet(0);
    });

    it("should reject invalid pet types in createPet", async function () {
        // Test boundary values
        await expect(contract.createPet(4)).to.be.reverted;
        await expect(contract.createPet(255)).to.be.reverted;
        await expect(contract.createPet(-1)).to.be.reverted;
    });

    it("should reject invalid parameters", async function () {
        // Test with invalid inputs
        await expect(contract.feedPet(false)).to.be.reverted;
    });
});
```

### Access Control Tests

```javascript
describe("Security - Access Control", function () {
    beforeEach(async function () {
        await contract.connect(owner).createPet(0);
    });

    it("should prevent unauthorized pet modification", async function () {
        // addr1 cannot modify owner's pet
        await expect(
            contract.connect(addr1).feedPet(true)
        ).to.be.reverted;
    });

    it("should prevent unauthorized decryption", async function () {
        // addr1 cannot decrypt owner's pet stats
        await expect(
            contract.connect(addr1).getPetStats()
        ).to.be.reverted;
    });

    it("should enforce owner-only reset", async function () {
        await expect(
            contract.connect(addr1).resetPet()
        ).to.be.reverted;
    });
});
```

---

## 📊 Test Coverage

### Generate Coverage Report

```bash
# Install coverage tool
npm install --save-dev hardhat-coverage

# Generate report
npx hardhat coverage
```

Output example:
```
File                        |  % Stmts | % Branch | % Funcs | % Lines |
├─────────────────────────────────────────────────────────────────┤
├─ PrivacyVirtualPet.sol    |    100   |   85     |   100   |   100   |
├─ SimpleVersion.sol        |    95    |   80     |   90    |   95    |
└─────────────────────────────────────────────────────────────────┤
```

**Goal**: Aim for >90% code coverage

---

## 🐛 Debugging Failed Tests

### Debugging Strategies

**1. Add Console Logs**
```javascript
it("should feed pet", async function () {
    console.log("Before:", await contract.getPetStats());
    await contract.feedPet(true);
    console.log("After:", await contract.getPetStats());
});
```

**2. Use Hardhat Debugger**
```bash
npx hardhat test --grep "test name" --verbose
```

**3. Check Contract State**
```javascript
it("debug test", async function () {
    await contract.createPet(0);

    // Print contract address
    console.log("Contract:", contract.address);

    // Check pet exists
    const hasPet = await contract.hasPet(owner.address);
    console.log("Has pet:", hasPet);

    // Get stats with error handling
    try {
        const stats = await contract.getPetStats();
        console.log("Stats:", stats);
    } catch (error) {
        console.error("Error:", error.message);
    }
});
```

---

## ✅ Pre-Deployment Checklist

Before deploying to testnet, verify:

- [ ] All tests pass locally
- [ ] No console errors or warnings
- [ ] Code compiles without errors
- [ ] Gas usage is reasonable
- [ ] Access controls properly enforced
- [ ] Input validation present
- [ ] Events emitted correctly
- [ ] Error messages are clear
- [ ] No hardcoded addresses
- [ ] Private key not committed
- [ ] .env in .gitignore

---

## 📈 Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Compile contracts
        run: npm run compile

      - name: Run tests
        run: npm run test

      - name: Generate coverage
        run: npx hardhat coverage
```

---

**Comprehensive testing ensures reliability, security, and confidence in your FHE application.** ✅
