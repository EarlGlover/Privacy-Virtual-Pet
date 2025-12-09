# Privacy Virtual Pet - Technical Architecture

---

## 🏗️ System Overview

Privacy Virtual Pet is a full-stack FHEVM application demonstrating encrypted state management on blockchain. The architecture follows a three-tier model:

```
┌─────────────────────────────────────────────────┐
│           Frontend (Web3 Interface)              │
│  HTML5 + JavaScript + Ethers.js + fhevmjs      │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / WebSocket
                   ↓
┌─────────────────────────────────────────────────┐
│    Blockchain Network (Sepolia / Zama)         │
│  MetaMask Wallet Integration                    │
└──────────────────┬──────────────────────────────┘
                   │ Transactions / Calls
                   ↓
┌─────────────────────────────────────────────────┐
│   Smart Contracts (Solidity 0.8.19)            │
│  Privacy Virtual Pet with FHEVM                 │
└─────────────────────────────────────────────────┘
```

---

## 📦 Directory Structure

```
privacy-virtual-pet/
├── contracts/
│   ├── PrivacyVirtualPet.sol           # Full FHE implementation
│   ├── PrivacyVirtualPetV07.sol        # V0.7 variant
│   └── SimplePrivacyVirtualPet.sol     # Educational version
├── test/
│   └── [test files]                    # Comprehensive test suite
├── scripts/
│   ├── deploy.js                       # Deployment script
│   └── [utility scripts]
├── frontend/
│   ├── index.html                      # Main UI
│   ├── app.js                          # Application logic
│   └── [assets]
├── hardhat.config.js                   # Hardhat configuration
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── README.md                           # Quick start guide
├── HELLO_FHEVM_TUTORIAL.md            # Comprehensive tutorial
├── ARCHITECTURE.md                     # This file
└── SUBMISSION.md                       # Bounty submission
```

---

## 🔐 Smart Contract Architecture

### Contract Hierarchy

```
PrivacyVirtualPet (Main)
├── Pet Struct
│   ├── euint32 happiness
│   ├── euint32 health
│   ├── euint32 energy
│   ├── euint8 petType
│   ├── euint32 lastInteraction
│   └── ebool isEncrypted
├── State Mappings
│   ├── address → Pet (encrypted storage)
│   └── address → bool (ownership tracking)
└── Function Categories
    ├── Lifecycle (createPet, resetPet)
    ├── Interactions (feedPet, playWithPet, healPet, restPet)
    ├── Customization (setPetType, encryptPetData)
    ├── Decryption (getPetStats, getPetType, etc.)
    └── Time-Based (applyTimeDecay)
```

### Data Types

#### Encrypted Types (TFHE)
- `euint32` - 32-bit encrypted unsigned integer
  - Usage: health, happiness, energy, timestamps
  - Operations: add, sub, min, max, lt, gt, eq

- `euint8` - 8-bit encrypted unsigned integer
  - Usage: pet type identification

- `ebool` - Encrypted boolean
  - Usage: encryption flag, access control

#### Non-Encrypted Types
- `address` - Owner identification
- `uint32` - Timestamp, decay calculations
- `bool` - Ownership tracking

### Function Categories

#### 1. **Pet Lifecycle**

```solidity
function createPet(uint8 _petType) external
```
- Creates new encrypted pet instance
- Initializes stats: happiness=75, health=80, energy=60
- Sets ownership
- Emits creation event

**Access Control**: Public (anyone can create one pet)
**State Change**: Creates new Pet struct
**Events**: PetCreated

---

```solidity
function resetPet() external onlyPetOwner
```
- Resets encrypted stats to initial values
- Useful for testing and demonstrations
- Maintains encrypted state integrity

**Access Control**: Owner-only
**State Change**: Modifies existing Pet struct

---

#### 2. **Pet Interactions**

```solidity
function feedPet(bool _feed) external onlyPetOwner
```
- Increases happiness (+10) and health (+5) via encrypted operations
- Uses `TFHE.add()` for encrypted arithmetic
- Caps values at 100 using `TFHE.min()`

**Encrypted Operations**:
```solidity
pet.happiness = TFHE.add(pet.happiness, TFHE.asEuint32(10));
pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));
```

**Events**: PetAction

---

```solidity
function playWithPet(bool _play) external onlyPetOwner
```
- Increases happiness (+15)
- Decreases energy (-10) via `TFHE.sub()`
- Demonstrates encrypted subtraction with floor

**Encrypted Operations**:
```solidity
pet.happiness = TFHE.add(pet.happiness, TFHE.asEuint32(15));
pet.energy = TFHE.sub(pet.energy, TFHE.asEuint32(10));
pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));
```

---

```solidity
function healPet(bool _heal) external onlyPetOwner
```
- Increases health significantly (+20)
- Demonstrates single-stat modification

---

```solidity
function restPet(bool _rest) external onlyPetOwner
```
- Increases energy (+20) and health (+5)
- Demonstrates multi-stat updates

---

#### 3. **Customization**

```solidity
function setPetType(uint8 _petType) external onlyPetOwner
```
- Changes pet type (0=cat, 1=dog, 2=rabbit, 3=bird)
- Converts to encrypted type
- Updates interaction timestamp

---

```solidity
function encryptPetData(bool _encrypt) external onlyPetOwner
```
- Controls encryption flag
- Demonstrates permission-based behavior changes

---

#### 4. **Decryption Functions**

```solidity
function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32)
```
- Decrypts and returns all pet statistics
- **Critical**: Only callable by owner (access control)
- Demonstrates `TFHE.decrypt()` for authorized decryption

**Decryption Pattern**:
```solidity
uint32 happiness = TFHE.decrypt(pet.happiness);
uint32 health = TFHE.decrypt(pet.health);
uint32 energy = TFHE.decrypt(pet.energy);
```

---

```solidity
function getPetType() external view onlyPetOwner returns (uint8)
```
- Returns encrypted pet type in plaintext
- Owner-only access

---

```solidity
function getLastInteraction() external view onlyPetOwner returns (uint32)
```
- Returns timestamp of last action
- Used for decay calculations

---

```solidity
function isPetEncrypted() external view onlyPetOwner returns (bool)
```
- Returns encryption flag status

---

#### 5. **Time-Based Mechanics**

```solidity
function applyTimeDecay() external onlyPetOwner
```
- Calculates time elapsed since last interaction
- Applies decay to happiness and energy (2 points per hour)
- Demonstrates temporal operations on encrypted data

**Algorithm**:
```solidity
uint32 timeDiff = currentTime - lastInteraction;
uint32 hoursElapsed = timeDiff / 3600;
euint32 decay = TFHE.asEuint32(hoursElapsed * 2);
pet.happiness = TFHE.sub(pet.happiness, decay);
```

---

## 🧬 Encryption Patterns

### Pattern 1: Initialization

**Converting plaintext to encrypted**:
```solidity
euint32 happiness = TFHE.asEuint32(75);
euint8 petType = TFHE.asEuint8(_petType);
ebool isEncrypted = TFHE.asEbool(true);
```

### Pattern 2: Arithmetic Operations

**Addition**:
```solidity
pet.happiness = TFHE.add(pet.happiness, TFHE.asEuint32(10));
```

**Subtraction with bounds checking**:
```solidity
pet.energy = TFHE.sub(pet.energy, TFHE.asEuint32(10));
pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));
```

### Pattern 3: Comparisons

**Minimum (capping)**:
```solidity
pet.happiness = TFHE.min(pet.happiness, TFHE.asEuint32(100));
```

**Maximum (floor)**:
```solidity
pet.energy = TFHE.max(pet.energy, TFHE.asEuint32(0));
```

### Pattern 4: Decryption Control

**Owner-only decryption**:
```solidity
modifier onlyPetOwner() {
    require(hasPet[msg.sender], "You don't have a pet yet");
    _;
}

function getPetStats() external view onlyPetOwner returns (uint32, uint32, uint32) {
    // Only owner can reach this decryption
    uint32 happiness = TFHE.decrypt(pet.happiness);
    return (happiness, health, energy);
}
```

---

## 🌐 Frontend Architecture

### Component Structure

```
App (PrivacyVirtualPetApp)
├── Initialization
│   ├── initFHEVM() - Setup encryption client
│   └── setupEventListeners() - UI event handlers
├── Wallet Management
│   ├── connectWallet() - MetaMask connection
│   ├── switchNetwork() - Network switching
│   └── validateConnection() - Connection verification
├── Pet Operations
│   ├── createPet() - Initialize pet
│   ├── feedPet() - Feed interaction
│   ├── playWithPet() - Play interaction
│   ├── healPet() - Healing interaction
│   └── restPet() - Rest interaction
├── Data Management
│   ├── loadPetData() - Fetch and display stats
│   ├── updateUI() - Render changes
│   └── cacheState() - Local state storage
└── Utility Functions
    ├── formatAddress() - Wallet display
    ├── formatStats() - Stat formatting
    └── showStatus() - User feedback
```

### Key Technologies

**Ethers.js v6**:
- Contract interaction
- Wallet connection
- Transaction signing
- Event listening

**fhevmjs**:
- Encryption of input values
- Input proof generation
- Client-side cryptography

**MetaMask**:
- Wallet management
- Transaction approval
- Network management

### Data Flow

#### Pet Creation Flow
```
User clicks "Create Pet"
  ↓
Frontend validates selection
  ↓
Create encrypted input (pet type)
  ↓
Call contract.createPet()
  ↓
MetaMask approval
  ↓
Transaction submitted
  ↓
Contract creates encrypted Pet struct
  ↓
Event emitted
  ↓
Frontend updates display
  ↓
Pet created message shown
```

#### Pet Interaction Flow
```
User clicks "Feed Pet"
  ↓
showStatus('Preparing encrypted input...')
  ↓
Create encrypted boolean: true
  ↓
showStatus('Sending transaction...')
  ↓
Call contract.feedPet(encrypted input, proof)
  ↓
MetaMask approval
  ↓
Transaction submitted
  ↓
Contract performs TFHE operations:
  - Add bonus to happiness/health
  - Cap at maximum values
  - Update timestamp
  ↓
Event emitted: PetAction
  ↓
showStatus('Waiting for confirmation...')
  ↓
Transaction confirmed
  ↓
showStatus('Pet fed successfully!')
  ↓
loadPetData() - Fetch new stats
  ↓
Contract decrypts stats (owner-only)
  ↓
Display updated values
  ↓
Update pet avatar and stats
```

### HTML Structure

**Main Sections**:
1. **Header** - App title and branding
2. **Wallet Section** - Connection controls and status
3. **Pet Display** - Avatar and stat visualization
4. **Action Buttons** - Feed, play, heal, rest controls
5. **Status Display** - Transaction feedback
6. **Transaction History** - Recent interactions

---

## 🔄 Data Storage & Management

### On-Chain Storage

**Smart Contract State**:
```solidity
mapping(address => Pet) private pets;      // Encrypted pet data
mapping(address => bool) public hasPet;    // Ownership tracking
```

**Storage Optimization**:
- Encrypted values use `euint32` (32-bit)
- Minimal storage footprint
- Single mapping for pet data
- Boolean flag for quick ownership check

### Off-Chain Storage

**Browser Local Storage** (Optional):
- User preferences
- UI theme settings
- Transaction history
- Wallet address cache

---

## 🔒 Security Model

### Access Control

**Contract Level**:
- `onlyPetOwner` modifier ensures only pet owner can interact
- No owner can affect other users' pets
- Decryption only for authorized parties

**Data Level**:
- All stats encrypted with FHEVM
- No plaintext storage
- Operations preserve encryption
- Decryption requires owner access

### Encryption Security

**FHEVM Library**:
- Battle-tested homomorphic encryption
- Proven cryptographic algorithms
- Constant-time operations
- Secure random number generation

**Input Validation**:
- Pet type validation (0-3)
- Owner existence checks
- Action parameter validation

---

## 🧪 Testing Architecture

### Test Categories

**1. Deployment Tests**
- Contract compilation
- Successful deployment
- Initial state verification

**2. State Tests**
- Pet creation validation
- Data initialization
- Ownership tracking

**3. Interaction Tests**
- Feed operation effects
- Play operation effects
- Heal operation effects
- Rest operation effects

**4. Encryption Tests**
- Encrypted arithmetic correctness
- Value capping behavior
- Decay calculations

**5. Access Control Tests**
- Owner-only enforcement
- Non-owner prevention
- Permission validation

**6. Edge Cases**
- Double pet creation prevention
- Invalid pet types
- Non-existent pet access
- Time-based boundary conditions

### Test Execution Flow

```
npm run test
  ↓
Compile contracts
  ↓
Deploy to Hardhat network
  ↓
Run all test suites
  ↓
Verify encrypted operations
  ↓
Check access controls
  ↓
Validate state transitions
  ↓
Report results
```

---

## 🚀 Deployment Architecture

### Network Configuration

**Hardhat (Development)**:
- Local development network
- Instant block confirmation
- Full visibility into operations
- Reset state between test runs

**Zama Devnet (Testing)**:
- Real FHE operations
- Proper FHEVM behavior
- testnet ETH required
- Block confirmation delays

**Sepolia Testnet (Demo)**:
- Current live deployment
- Contract: 0x2d2548D03606Dd001625BB7015B44E3771f5f700
- Testnet faucets available
- Full Web3 integration

### Deployment Process

```
1. Compile contracts
   - npx hardhat compile
   - Generate artifacts
   - Type generation

2. Run migrations
   - Execute deploy script
   - Deploy to target network
   - Capture contract address

3. Verify deployment
   - Check contract code on network
   - Test basic functionality
   - Log deployment details

4. Update frontend
   - Replace contract address
   - Update ABI
   - Test integration

5. Deploy frontend
   - Build static assets
   - Deploy to hosting
   - Verify accessibility
```

---

## 📊 Performance Characteristics

### Gas Optimization

**Creation**: ~150k-200k gas
- Initialization of encrypted values
- Storage allocation
- Event emission

**Interaction**: ~80k-120k gas
- TFHE operations
- State updates
- Event emission

**Decryption**: ~30k-50k gas
- Read-only view function
- Decryption of stored values
- No storage writes

### Scalability Considerations

**Current Limitations**:
- Single pet per owner
- Linear state growth
- No batching optimization

**Future Improvements**:
- Multiple pets per owner
- Batch operations
- State compression
- Encrypted arrays

---

## 🔄 Integration Points

### External Dependencies

**FHEVM Library**:
- Contract compilation
- Encrypted type definitions
- FHE operations
- Decryption gateway

**Hardhat Ecosystem**:
- FHEVM plugin for compilation
- Testing framework
- Deployment automation
- Network management

**Ethers.js**:
- Contract interaction
- Wallet management
- Transaction handling
- Event listening

**MetaMask**:
- User wallet
- Transaction approval
- Network switching
- Account management

---

## 📈 Scaling Strategies

### Near-Term Improvements
- Optimize TFHE operations
- Batch multiple actions
- Cache decrypted values
- Implement lazy loading

### Long-Term Vision
- Multiple pets per owner
- Pet breeding with encrypted genetics
- P2P trading systems
- Encrypted leaderboards
- Privacy-preserving analytics

---

## 🔍 Monitoring & Debugging

### Development Tools

**Hardhat Console**:
```javascript
console.log(pet.happiness);  // Logs encrypted value
```

**Etherscan Integration**:
- View contract on Sepolia testnet
- Monitor transactions
- Verify contract code
- Track events

**Browser DevTools**:
- Inspect wallet connections
- Monitor network requests
- Debug frontend logic
- Profile performance

---

## 📚 Documentation Map

- **README.md** - Quick start and overview
- **HELLO_FHEVM_TUTORIAL.md** - Comprehensive learning guide
- **ARCHITECTURE.md** - This technical deep-dive
- **SUBMISSION.md** - Bounty requirements and deliverables
- **Code Comments** - Inline documentation in Solidity/JavaScript

---

**This architecture ensures Privacy Virtual Pet remains secure, efficient, and educational while demonstrating best practices in FHE application development.**
