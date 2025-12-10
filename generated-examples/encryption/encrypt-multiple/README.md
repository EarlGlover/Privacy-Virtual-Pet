# FHE Encrypt Multiple Values Example

**Category**: Encryption Patterns
**Difficulty**: Beginner
**Chapter**: encryption-patterns
**Concepts**: Multiple encrypted values, struct encryption, batch operations, state management

## Overview

This example demonstrates how to encrypt and manage multiple values simultaneously in a smart contract. Learn patterns for handling encrypted structs, batch operations, and managing complex encrypted state.

## What You'll Learn

- ✅ Storing multiple encrypted values in a struct
- ✅ Batch encryption of multiple inputs
- ✅ Managing encrypted state across multiple variables
- ✅ Reading multiple encrypted values efficiently
- ✅ Updating encrypted structs
- ✅ Testing multi-value encrypted contracts

## Smart Contract

### EncryptedProfile.sol

A contract that stores encrypted user profile data including age, score, and balance.

**Key Features**:
- `setProfile(uint8 age, uint32 score, uint32 balance)` - Set all values at once
- `updateAge(uint8 newAge)` - Update individual encrypted field
- `updateScore(uint32 newScore)` - Update individual encrypted field
- `getProfile()` - Retrieve all encrypted values
- `getDecryptedProfile()` - Decrypt entire profile for authorized users

## How It Works

### Multiple Value Encryption Flow

```
User Inputs (plaintext)
  age=25, score=100, balance=1000
       ↓
TFHE.asEuint8(25), TFHE.asEuint32(100), TFHE.asEuint32(1000)
       ↓
Store in encrypted struct
       ↓
Contract can compute on all values independently
```

### Encrypted Struct Pattern

```solidity
struct EncryptedProfile {
    euint8 age;        // Encrypted age
    euint32 score;     // Encrypted score
    euint32 balance;   // Encrypted balance
}
```

## Encrypted Operations Used

| Operation | TFHE Function | Purpose |
|-----------|---------------|---------|
| Encrypt uint8 | `TFHE.asEuint8(value)` | Convert plaintext to encrypted 8-bit |
| Encrypt uint32 | `TFHE.asEuint32(value)` | Convert plaintext to encrypted 32-bit |
| Batch Set | Multiple assignments | Set all fields at once |
| Individual Update | Single field assignment | Update one field independently |
| Decryption | `TFHE.decrypt(value)` | Decrypt for authorized users |

## Quick Start

### Installation

```bash
npm install
```

### Compilation

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Expected Output

```
EncryptedProfile
  Deployment and Initialization
    ✓ should deploy successfully
    ✓ should initialize with zeros
  Setting Profile
    ✓ should set complete profile
    ✓ should encrypt all values correctly
  Updating Individual Fields
    ✓ should update age independently
    ✓ should update score independently
    ✓ should update balance independently
  Retrieving Values
    ✓ should retrieve encrypted profile
    ✓ should decrypt complete profile
  Batch Operations
    ✓ should handle multiple users
    ✓ should support concurrent updates

11 passing
```

## Code Structure

```
├── contracts/
│   └── EncryptedProfile.sol      Smart contract
├── test/
│   └── EncryptedProfile.test.ts  Test suite
├── scripts/
│   └── deploy.ts                 Deployment script
├── hardhat.config.ts             Configuration
├── package.json                  Dependencies
└── README.md                     This file
```

## Key Concepts

### Encrypted Struct Pattern

Store multiple encrypted values in a single struct:

```solidity
struct EncryptedProfile {
    euint8 age;
    euint32 score;
    euint32 balance;
}

mapping(address => EncryptedProfile) public profiles;
```

### Batch Encryption

Encrypt multiple values in one transaction:

```solidity
function setProfile(uint8 age, uint32 score, uint32 balance) external {
    profiles[msg.sender] = EncryptedProfile({
        age: TFHE.asEuint8(age),
        score: TFHE.asEuint32(score),
        balance: TFHE.asEuint32(balance)
    });
}
```

### Individual Field Updates

Update encrypted fields independently:

```solidity
function updateAge(uint8 newAge) external {
    profiles[msg.sender].age = TFHE.asEuint8(newAge);
}
```

### Batch Decryption

Decrypt multiple values for authorized users:

```solidity
function getDecryptedProfile() external view returns (
    uint8 age,
    uint32 score,
    uint32 balance
) {
    EncryptedProfile memory profile = profiles[msg.sender];
    return (
        TFHE.decrypt(profile.age),
        TFHE.decrypt(profile.score),
        TFHE.decrypt(profile.balance)
    );
}
```

## Common Patterns

### Pattern 1: Encrypted User Data

```solidity
struct UserData {
    euint32 value1;
    euint32 value2;
    euint8 value3;
}

mapping(address => UserData) private userData;
```

### Pattern 2: Batch Initialize

```solidity
function initialize(uint32 v1, uint32 v2, uint8 v3) external {
    userData[msg.sender] = UserData({
        value1: TFHE.asEuint32(v1),
        value2: TFHE.asEuint32(v2),
        value3: TFHE.asEuint8(v3)
    });
}
```

### Pattern 3: Partial Updates

```solidity
// Only update one field, preserve others
function updateValue1(uint32 newValue) external {
    userData[msg.sender].value1 = TFHE.asEuint32(newValue);
}
```

### Pattern 4: Computed Fields

```solidity
// Derive new encrypted value from existing fields
function computeTotal() external view returns (euint32) {
    UserData memory data = userData[msg.sender];
    return TFHE.add(data.value1, data.value2);
}
```

## Testing Guide

The test suite demonstrates:

1. **Initialization** - Multiple values start at zero
2. **Batch Set** - All values set in one transaction
3. **Individual Updates** - Each field can be updated independently
4. **Retrieval** - Can get encrypted profile
5. **Decryption** - Can decrypt all values
6. **Multi-User** - Different users have separate encrypted data
7. **State Consistency** - Updates preserve other fields

### Run Specific Test

```bash
npm run test -- --grep "Batch"
```

## Security Considerations

### Type Safety

Different encrypted types for different ranges:

```solidity
euint8 age;      // 0-255 (small range)
euint32 score;   // 0-4,294,967,295 (large range)
```

### Access Control

Each user can only decrypt their own data:

```solidity
function getDecryptedProfile() external view returns (...) {
    // Returns msg.sender's profile
    EncryptedProfile memory profile = profiles[msg.sender];
    // ...
}
```

### Gas Optimization

Update only necessary fields:

```solidity
// ✅ Good: Update one field
function updateAge(uint8 newAge) external {
    profiles[msg.sender].age = TFHE.asEuint8(newAge);
}

// ❌ Bad: Rewriting entire struct for one field
function updateAge(uint8 newAge) external {
    EncryptedProfile memory profile = profiles[msg.sender];
    profiles[msg.sender] = EncryptedProfile({
        age: TFHE.asEuint8(newAge),
        score: profile.score,
        balance: profile.balance
    });
}
```

## Practical Example

### Scenario: Gaming Profile

```solidity
struct GameProfile {
    euint32 healthPoints;
    euint32 manaPoints;
    euint8 level;
    euint32 experience;
    euint32 gold;
}

mapping(address => GameProfile) public players;

function createCharacter(
    uint32 hp,
    uint32 mp,
    uint8 lvl,
    uint32 exp,
    uint32 gold
) external {
    players[msg.sender] = GameProfile({
        healthPoints: TFHE.asEuint32(hp),
        manaPoints: TFHE.asEuint32(mp),
        level: TFHE.asEuint8(lvl),
        experience: TFHE.asEuint32(exp),
        gold: TFHE.asEuint32(gold)
    });
}

function gainExperience(uint32 amount) external {
    GameProfile storage player = players[msg.sender];
    player.experience = TFHE.add(player.experience, TFHE.asEuint32(amount));
}
```

## Next Steps

After mastering this example:

1. **Array of Encrypted Values** - Learn to manage encrypted arrays
2. **Encrypted Mapping** - Use mappings with encrypted keys/values
3. **Complex Computations** - Perform calculations across multiple encrypted fields
4. **Access Control** - Implement granular permission systems

## Troubleshooting

### Type Mismatch Errors

Cannot mix different encrypted types:

```solidity
// ❌ Error: Cannot add euint8 and euint32 directly
euint8 age;
euint32 score;
// result = TFHE.add(age, score);  // Type mismatch

// ✅ Solution: Cast to same type
euint32 ageAs32 = TFHE.asEuint32(age);
result = TFHE.add(ageAs32, score);
```

### Storage vs Memory

Be careful with struct storage:

```solidity
// ✅ Correct: Direct storage modification
profiles[msg.sender].age = TFHE.asEuint8(newAge);

// ⚠️ Warning: Memory copy (doesn't persist)
EncryptedProfile memory profile = profiles[msg.sender];
profile.age = TFHE.asEuint8(newAge);
// Changes to 'profile' are NOT saved to storage
```

### Initialization

All encrypted fields should be explicitly initialized:

```solidity
// ✅ Good: Explicit initialization
profiles[msg.sender] = EncryptedProfile({
    age: TFHE.asEuint8(0),
    score: TFHE.asEuint32(0),
    balance: TFHE.asEuint32(0)
});
```

## Resources

- **FHEVM Docs**: https://docs.zama.ai
- **Zama Community**: https://www.zama.ai/community
- **GitHub Examples**: https://github.com/zama-ai/fhevm

## Related Examples

- Encrypt Single Value - Learn basic encryption
- Access Control - Manage decryption permissions
- Advanced Patterns - Complex multi-value operations

---

**Ready to encrypt complex data structures!** 🔐

This example is part of the FHEVM Example Hub - a comprehensive collection of encrypted smart contract patterns.
