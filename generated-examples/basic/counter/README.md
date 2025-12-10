# FHE Counter Example

**Category**: Basic Operations
**Difficulty**: Beginner
**Chapter**: arithmetic-operations
**Concepts**: Encrypted arithmetic, TFHE operations, counter patterns

## Overview

This example demonstrates how to build an encrypted counter using FHEVM, showcasing the fundamental building block of privacy-preserving smart contracts. Learn how to perform arithmetic operations on encrypted data without exposing the values.

## What You'll Learn

- ✅ Creating encrypted state variables
- ✅ Performing arithmetic on encrypted data
- ✅ Converting between plaintext and encrypted values
- ✅ Maintaining data privacy while enabling computations
- ✅ Testing encrypted smart contracts

## Smart Contract

### EncryptedCounter.sol

An encrypted counter that stores its value as an encrypted `euint32`. Unlike a traditional counter that anyone can view, this counter's value remains encrypted even when performing arithmetic operations.

**Key Features**:
- `increment()` - Add an encrypted value to the counter
- `decrement()` - Subtract an encrypted value from the counter
- `getCount()` - Retrieve the encrypted counter value
- `reset()` - Reset counter to zero

## How It Works

### Traditional Counter
```solidity
uint256 public count = 0;  // Everyone can see: count = 42
```

### Encrypted Counter
```solidity
euint32 private count;     // Encrypted: nobody knows the value
// Smart contract can still do: count = count + 10
// Result remains encrypted
```

## Encrypted Operations Used

| Operation | TFHE Function | Purpose |
|-----------|---------------|---------|
| Addition | `TFHE.add(a, b)` | Add encrypted values |
| Subtraction | `TFHE.sub(a, b)` | Subtract encrypted values |
| Maximum | `TFHE.max(a, b)` | Prevent negative values |
| Conversion | `TFHE.asEuint32(value)` | Convert plaintext to encrypted |
| Decryption | `TFHE.decrypt(value)` | Only owner can decrypt |

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
EncryptedCounter
  Initialization
    ✓ should initialize counter at 0
  Increment
    ✓ should increment encrypted value
    ✓ should cap at maximum
  Decrement
    ✓ should decrement without going below zero
  Reset
    ✓ should reset to zero

5 passing
```

## Code Structure

```
├── contracts/
│   └── EncryptedCounter.sol        Smart contract
├── test/
│   └── EncryptedCounter.test.ts    Test suite
├── scripts/
│   └── deploy.ts                   Deployment script
├── hardhat.config.ts               Configuration
├── package.json                    Dependencies
└── README.md                       This file
```

## Project Files

### File Locations

To run this example correctly, ensure files are placed in these directories:

- **Contract** → `contracts/EncryptedCounter.sol`
- **Tests** → `test/EncryptedCounter.test.ts`
- **Deploy** → `scripts/deploy.ts`

### contracts/EncryptedCounter.sol

Complete smart contract implementing the encrypted counter.

### test/EncryptedCounter.test.ts

Comprehensive test suite covering:
- Initialization
- Increment operations
- Decrement operations
- Edge cases (negative values, maximum bounds)
- Reset functionality

## Key Concepts

### Encrypted Arithmetic

Operations on encrypted data produce encrypted results:

```
encrypted(5) + encrypted(3) = encrypted(8)
// Neither the input values nor result are visible
```

### Privacy Guarantee

Even though the contract performs math on your counter:
- Nobody can see the counter's value
- Nobody can predict the operations
- Only the counter's owner can decrypt the result

### Practical Example

```solidity
euint32 count = TFHE.asEuint32(0);     // count = encrypted(0)

// Increment by 10
count = TFHE.add(count, TFHE.asEuint32(10));
// count = encrypted(10), but nobody knows this

// Increment by 5
count = TFHE.add(count, TFHE.asEuint32(5));
// count = encrypted(15), still private

// Only owner can decrypt to see count = 15
uint32 decryptedValue = TFHE.decrypt(count);  // Returns 15
```

## Common Patterns

### Bounds Checking

Prevent counter from exceeding maximum:

```solidity
count = TFHE.add(count, increment);
count = TFHE.min(count, TFHE.asEuint32(100));  // Cap at 100
```

### Preventing Negative Values

Keep counter at minimum of zero:

```solidity
count = TFHE.sub(count, decrement);
count = TFHE.max(count, TFHE.asEuint32(0));  // Floor at 0
```

## Testing Guide

The test suite demonstrates:

1. **Initialization Test** - Counter starts at 0
2. **Increment Test** - Value increases correctly
3. **Decrement Test** - Value decreases (with bounds)
4. **Edge Cases** - What happens at boundaries
5. **Reset Test** - Can return to zero

### Run Specific Test

```bash
npm run test -- --grep "Increment"
```

## Next Steps

After mastering this example:

1. **Add Features** - Try adding a `multiply()` function
2. **Explore Comparisons** - Learn `FHE.eq()`, `FHE.lt()`, `FHE.gt()`
3. **Study Decryption** - Understand access control with `FHE.allow()`
4. **Learn Conditionals** - Use encrypted comparisons for branching

## Troubleshooting

### Compilation Errors

Ensure FHEVM plugin is installed:
```bash
npm install @fhevm/hardhat-plugin
```

### Test Failures

1. Check Solidity version (0.8.19)
2. Verify FHEVM library imports
3. Check hardhat config is correct

### Encrypted Operation Errors

- Cannot use `>`, `<`, `==` directly on encrypted values
- Use `TFHE.gt()`, `TFHE.lt()`, `TFHE.eq()` instead
- Cannot use `if` on encrypted conditions (always decrypt first)

## Resources

- **FHEVM Docs**: https://docs.zama.ai
- **Zama Community**: https://www.zama.ai/community
- **GitHub Examples**: https://github.com/zama-ai/fhevm

## Related Examples

- Basic Arithmetic - Learn all TFHE operations
- Equality Comparison - Compare encrypted values
- Access Control - Manage decryption permissions

---

**Ready to build private smart contracts!** 🔐

This example is part of the FHEVM Example Hub - a comprehensive collection of encrypted smart contract patterns.
