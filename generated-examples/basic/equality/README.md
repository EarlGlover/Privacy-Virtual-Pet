# Encrypted Comparison - Equality and Comparison Operations

This example demonstrates how to perform comparison operations on encrypted data using FHEVM.

## Overview

The `EncryptedComparison` contract shows all comparison operations available in FHEVM, including equality checks, greater/less than comparisons, range checks, and conditional logic using encrypted values.

## Features

- ✅ **Equality** (`TFHE.eq`) - Check if two encrypted values are equal
- ✅ **Inequality** (`TFHE.ne`) - Check if two encrypted values are not equal
- ✅ **Greater Than** (`TFHE.gt`, `TFHE.gte`) - Compare encrypted values
- ✅ **Less Than** (`TFHE.lt`, `TFHE.lte`) - Compare encrypted values
- ✅ **Range Checks** - Combine comparisons for range validation
- ✅ **Conditional Selection** (`TFHE.select`) - Encrypted if-then-else logic
- ✅ **Logical Operations** (`TFHE.and`, `TFHE.or`) - Combine conditions

## Key Functions

```solidity
// Basic comparisons
function isEqual() external returns (ebool)
function isNotEqual() external returns (ebool)
function isGreaterThan() external returns (ebool)
function isLessThan() external returns (ebool)

// Range operations
function isInRange(euint32 value, uint32 min, uint32 max) external returns (ebool)
function isOutsideRange(euint32 value, uint32 min, uint32 max) external returns (ebool)

// Conditional logic
function selectValue(ebool condition, uint32 trueValue, uint32 falseValue) external pure returns (euint32)
function conditionalIncrement(uint32 threshold, uint32 increment) external
```

## Usage Example

```typescript
const comparison = await ethers.deployContract("EncryptedComparison");

// Set values to compare
await comparison.setValues(50, 100);

// Check equality: 50 == 100? -> false
await comparison.isEqual();
console.log(await comparison.getDecryptedResult()); // false

// Check less than: 50 < 100? -> true
await comparison.isLessThan();
console.log(await comparison.getDecryptedResult()); // true

// Range check: is 75 in [0, 100]? -> true
await comparison.isInRange(encryptedValue, 0, 100);

// Conditional increment: if value < 100, add 25
await comparison.conditionalIncrement(100, 25);
```

## Learning Points

### 1. Encrypted Boolean Results
All comparisons return `ebool` (encrypted boolean), not `bool`. Results stay encrypted until explicitly decrypted.

### 2. Combining Conditions
Use `TFHE.and()` and `TFHE.or()` to combine multiple encrypted boolean conditions:
```solidity
ebool inRange = TFHE.and(
    TFHE.gte(value, min),
    TFHE.lte(value, max)
);
```

### 3. Conditional Logic
Use `TFHE.select()` for encrypted if-then-else:
```solidity
// If condition is true, use valueA, else use valueB
euint32 result = TFHE.select(condition, valueA, valueB);
```

## Testing

Run tests:
```bash
npm test
```

Tests cover all comparison operations, range checks, and conditional logic.

## Next Steps

- Explore **Access Control** for secure decryption
- Learn **Input Proofs** for secure user inputs
- Build applications using comparison logic

## Resources

- [FHEVM Comparison Operations](https://docs.zama.ai/fhevm)
- [Conditional Logic Patterns](https://docs.zama.ai/fhevm/guides/conditions)
