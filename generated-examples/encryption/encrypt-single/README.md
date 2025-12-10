# FHE Encrypt Single Value Example

**Category**: Encryption Patterns
**Difficulty**: Beginner
**Chapter**: encryption-patterns
**Concepts**: Value encryption, plaintext to encrypted conversion, encrypted state variables

## Overview

This example demonstrates how to encrypt a single plaintext value and store it as encrypted state in a smart contract. Learn the fundamental pattern of converting user input to encrypted form and maintaining encrypted state throughout the contract lifecycle.

## What You'll Learn

- ✅ Converting plaintext values to encrypted (euint32) types
- ✅ Storing encrypted values in state variables
- ✅ Retrieving encrypted state without revealing values
- ✅ Using TFHE.asEuint32() to create encrypted values
- ✅ Testing encrypted state management

## Smart Contract

### EncryptedValue.sol

A contract that stores a single encrypted value with the ability to set, retrieve (encrypted), and decrypt it.

**Key Features**:
- `setValue(uint32 plainValue)` - Convert plaintext to encrypted and store
- `setValueFromEncrypted(euint32 encryptedValue)` - Store pre-encrypted value
- `getValue()` - Retrieve encrypted value (does not expose plaintext)
- `getDecryptedValue()` - Decrypt value for authorized users
- `updateValue(uint32 newValue)` - Replace with new encrypted value

## How It Works

### Encryption Flow

```
User Input (plaintext)
       ↓
TFHE.asEuint32(plainValue)  ← Encrypt the value
       ↓
euint32 encrypted value
       ↓
Store in contract state
       ↓
Contract can read/compute with encrypted value
```

### Traditional Approach (Unencrypted)
```solidity
uint32 public myValue = 42;  // Everyone sees: myValue = 42
```

### FHEVM Approach (Encrypted)
```solidity
euint32 private myValue;     // Encrypted, nobody sees the value
myValue = TFHE.asEuint32(42); // Encrypt and store
```

## Encrypted Operations Used

| Operation | TFHE Function | Purpose |
|-----------|---------------|---------|
| Encryption | `TFHE.asEuint32(value)` | Convert plaintext to encrypted |
| Retrieval | Return `euint32` variable | Get encrypted value without decryption |
| Decryption | `TFHE.decrypt(value)` | Only owner can see plaintext |
| Comparison | `TFHE.eq(a, b)` | Compare encrypted values |
| Conditional | `TFHE.cmux(condition, a, b)` | Branch on encrypted values |

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
EncryptedValue
  Deployment and Initialization
    ✓ should deploy successfully
    ✓ should initialize with encrypted zero
  Setting Values
    ✓ should set plaintext value
    ✓ should set encrypted value
  Retrieving Values
    ✓ should retrieve encrypted value
    ✓ should decrypt value
    ✓ should update value
  State Management
    ✓ should maintain encrypted state
    ✓ should preserve privacy

9 passing
```

## Code Structure

```
├── contracts/
│   └── EncryptedValue.sol        Smart contract
├── test/
│   └── EncryptedValue.test.ts    Test suite
├── scripts/
│   └── deploy.ts                 Deployment script
├── hardhat.config.ts             Configuration
├── package.json                  Dependencies
└── README.md                     This file
```

## Project Files

### File Locations

To run this example correctly, ensure files are placed in these directories:

- **Contract** → `contracts/EncryptedValue.sol`
- **Tests** → `test/EncryptedValue.test.ts`
- **Deploy** → `scripts/deploy.ts`

### contracts/EncryptedValue.sol

Complete smart contract implementing single encrypted value storage.

### test/EncryptedValue.test.ts

Comprehensive test suite covering:
- Deployment and initialization
- Setting plaintext values
- Setting encrypted values
- Retrieving encrypted state
- Decryption and privacy preservation
- Value updates
- State consistency

## Key Concepts

### Plaintext to Encrypted Conversion

The most fundamental FHE pattern - converting user input to encrypted form:

```solidity
// Plaintext value from user
uint32 plainValue = 42;

// Convert to encrypted
euint32 encrypted = TFHE.asEuint32(plainValue);

// Store in state
myValue = encrypted;
```

### Encrypted State Privacy

Once encrypted, the value is completely private:

```
myValue = encrypted(42)
// On-chain, nobody can determine:
// - Is it 42?
// - Is it even a number?
// - How large is it?
// - What pattern does it follow?
```

### Retrieval Without Decryption

You can return encrypted values without exposing them:

```solidity
function getValue() external view returns (euint32) {
    return myValue;  // Return encrypted value
}

// Caller gets back encrypted data
// Still can't see the plaintext value (42)
```

### Decryption with Access Control

Only authorized parties can decrypt:

```solidity
function getDecryptedValue() external view returns (uint32) {
    // In production, check access control here
    return TFHE.decrypt(myValue);
}

// Only authorized users can see plaintext
// Others get decryption error or restricted access
```

## Common Patterns

### Pattern 1: Convert and Store

Store a plaintext value as encrypted:

```solidity
function setValue(uint32 plainValue) external {
    euint32 encrypted = TFHE.asEuint32(plainValue);
    myValue = encrypted;
}
```

### Pattern 2: Store Pre-Encrypted Values

Accept already-encrypted values from the user:

```solidity
function setValueFromEncrypted(euint32 encryptedValue) external {
    myValue = encryptedValue;
}
```

### Pattern 3: Update With Validation

Update value with checks on encrypted data:

```solidity
function updateValue(uint32 newValue) external {
    euint32 encrypted = TFHE.asEuint32(newValue);

    // Emit event for transparency
    emit ValueUpdated(msg.sender, newValue);

    myValue = encrypted;
}
```

### Pattern 4: Batch Operations

Set multiple values in one transaction:

```solidity
function setMultipleValues(uint32 val1, uint32 val2) external {
    valueA = TFHE.asEuint32(val1);
    valueB = TFHE.asEuint32(val2);
}
```

## Testing Guide

The test suite demonstrates:

1. **Initialization Test** - Contract starts with encrypted zero
2. **Plaintext Set Test** - Can set plaintext and it becomes encrypted
3. **Encrypted Set Test** - Can accept pre-encrypted values
4. **Retrieval Test** - Encrypted value can be retrieved
5. **Decryption Test** - Authorized users can decrypt
6. **Update Test** - Values can be replaced
7. **Privacy Test** - Encryption maintains privacy
8. **State Consistency Test** - Multiple operations maintain state

### Run Specific Test

```bash
npm run test -- --grep "Setting"
```

## Encryption vs Hashing

**Important distinction**: Encryption ≠ Hashing

| Aspect | Encryption | Hashing |
|--------|-----------|---------|
| Reversible | ✅ Yes (with key) | ❌ No |
| Homomorphic | ✅ Yes (FHE) | ❌ No |
| Purpose | Privacy | Integrity |
| FHEVM Usage | ✅ euint32, euint8, ebool | ❌ Not used |

## Security Considerations

### Encryption Strength

- FHE provides semantic security
- Encrypted values are indistinguishable
- Even seeing multiple operations doesn't reveal values

### Key Management

- Keys are managed by FHEVM
- Contract never exposes raw keys
- Decryption is access-controlled

### Implementation Notes

- Always convert plaintext at contract boundary
- Keep decryption operations minimal
- Use access control for decryption functions
- Log encryption/decryption events for audit

## Practical Example

### Scenario: Private Token Balance

```solidity
pragma solidity ^0.8.19;
import "fhevm/lib/TFHE.sol";

contract PrivateBalance {
    mapping(address => euint32) public balances;

    function deposit(uint32 amount) external {
        euint32 encrypted = TFHE.asEuint32(amount);
        balances[msg.sender] = encrypted;
        emit Deposited(msg.sender, amount);
    }

    function getBalance(address user) external view returns (euint32) {
        return balances[user];  // Returns encrypted
    }

    function getMyBalance() external view returns (uint32) {
        return TFHE.decrypt(balances[msg.sender]);  // Owner only
    }
}
```

## Next Steps

After mastering this example:

1. **Learn Encrypted Arithmetic** - Use TFHE.add(), TFHE.sub() on encrypted values
2. **Study Comparisons** - Compare encrypted values with TFHE.eq(), TFHE.lt()
3. **Explore Conditionals** - Branch on encrypted comparisons
4. **Advanced Patterns** - Learn secret sharing and threshold schemes

## Troubleshooting

### Compilation Errors

Ensure FHEVM plugin is installed:
```bash
npm install @fhevm/hardhat-plugin
```

### Encryption Type Mismatch

Cannot mix encrypted types:
```solidity
euint32 val32;
euint8 val8;
// val32 = TFHE.add(val32, val8);  // ❌ Error

// Solution: cast to same type first
val32 = TFHE.add(val32, TFHE.asEuint32(val8));  // ✅ Correct
```

### Decryption Errors

Check that decryption is authorized:
```solidity
function getDecrypted() external view returns (uint32) {
    // Check access control
    require(msg.sender == owner, "Not authorized");
    return TFHE.decrypt(myValue);  // ✅ Secure
}
```

## Resources

- **FHEVM Docs**: https://docs.zama.ai
- **Zama Community**: https://www.zama.ai/community
- **GitHub Examples**: https://github.com/zama-ai/fhevm

## Related Examples

- Basic Counter - Perform arithmetic on encrypted values
- Equality Comparison - Compare encrypted values
- Access Control - Manage decryption permissions
- Encryption Patterns - Multiple value encryption

---

**Ready to encrypt your data!** 🔐

This example is part of the FHEVM Example Hub - a comprehensive collection of encrypted smart contract patterns.
