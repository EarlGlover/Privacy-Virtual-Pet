# Encrypted Arithmetic - Basic FHE Operations

This example demonstrates fundamental arithmetic operations on encrypted data using FHEVM.

## Overview

The `EncryptedArithmetic` contract shows how to perform basic mathematical operations on encrypted values without ever revealing the underlying data. This is a cornerstone of confidential computing on the blockchain.

## Features Demonstrated

### Arithmetic Operations
- ✅ **Addition** (`TFHE.add`) - Add encrypted numbers
- ✅ **Subtraction** (`TFHE.sub`) - Subtract encrypted numbers
- ✅ **Multiplication** (`TFHE.mul`) - Multiply encrypted numbers
- ✅ **Minimum** (`TFHE.min`) - Find smaller of two encrypted values
- ✅ **Maximum** (`TFHE.max`) - Find larger of two encrypted values

### Key Concepts
- Converting plaintext to encrypted values
- Performing operations on encrypted data
- Chaining multiple operations
- Safe arithmetic with bounds checking
- Proper decryption (with access control considerations)

## Contract Functions

### Setting Values
```solidity
// Set encrypted operands directly
function setOperands(euint32 a, euint32 b) external

// Set operands from plaintext (converts to encrypted)
function setOperandsPlaintext(uint32 a, uint32 b) external
```

### Arithmetic Operations
```solidity
// Basic operations
function add() external returns (euint32)
function subtract() external returns (euint32)
function multiply() external returns (euint32)

// Comparison operations
function minimum() external returns (euint32)
function maximum() external returns (euint32)

// Complex operations
function chainedOperation() external returns (euint32)  // (a + b) * 2
function safeAdd(euint32 a, euint32 b, uint32 maxValue) external returns (euint32)
```

### Reading Results
```solidity
// Returns encrypted result
function getResult() external view returns (euint32)

// Returns decrypted result (add access control in production!)
function getDecryptedResult() external view returns (uint32)

// Returns decrypted operands
function getDecryptedOperands() external view returns (uint32 a, uint32 b)
```

## Usage Example

```typescript
// Deploy contract
const arithmetic = await ethers.deployContract("EncryptedArithmetic");

// Set operands (plaintext inputs)
await arithmetic.setOperandsPlaintext(10, 20);

// Perform addition: 10 + 20 = 30
await arithmetic.add();

// Get encrypted result
const encryptedResult = await arithmetic.getResult();

// Decrypt result (only for authorized users in production)
const result = await arithmetic.getDecryptedResult();
console.log(result); // 30

// Perform multiplication: 10 * 20 = 200
await arithmetic.multiply();
console.log(await arithmetic.getDecryptedResult()); // 200

// Chained operation: (10 + 20) * 2 = 60
await arithmetic.chainedOperation();
console.log(await arithmetic.getDecryptedResult()); // 60
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- ✅ 20+ test cases covering all operations
- ✅ Edge cases (zero, maximum values)
- ✅ Event emission verification
- ✅ Chained operations testing
- ✅ Safe arithmetic with bounds

## Key Learning Points

### 1. All Operations Stay Encrypted
```solidity
euint32 result = TFHE.add(operandA, operandB);  // Result is encrypted
```
The blockchain state never contains plaintext values. Even intermediate results remain encrypted.

### 2. Mixing Plaintext and Encrypted
```solidity
euint32 encrypted = TFHE.asEuint32(42);  // Convert plaintext to encrypted
euint32 result = TFHE.add(encrypted, otherEncrypted);
```
You can convert plaintext to encrypted and perform operations.

### 3. Chaining Operations
```solidity
euint32 sum = TFHE.add(a, b);
euint32 doubled = TFHE.mul(sum, TFHE.asEuint32(2));
```
Multiple operations can be chained. All intermediate results stay encrypted.

### 4. Safe Arithmetic
```solidity
euint32 sum = TFHE.add(a, b);
euint32 bounded = TFHE.min(sum, maxValue);  // Cap at maximum
```
Use `TFHE.min()` and `TFHE.max()` to implement overflow/underflow protection.

## Security Considerations

### ⚠️ Decryption Access Control
In this example, `getDecryptedResult()` has no access control for educational purposes. In production:

```solidity
function getDecryptedResult() external view returns (uint32) {
    require(msg.sender == owner, "Unauthorized");
    return TFHE.decrypt(result);
}
```

Always implement proper access control before decrypting values.

### ⚠️ Gas Costs
FHE operations are more expensive than regular arithmetic:
- Addition: Moderate cost
- Multiplication: Higher cost
- Comparisons: Moderate cost

Optimize by minimizing operations and batching when possible.

## Common Patterns

### Pattern 1: Calculator
```solidity
// Set values
setOperandsPlaintext(a, b);

// Perform operation
add();

// Read result
uint32 result = getDecryptedResult();
```

### Pattern 2: Bounded Operations
```solidity
// Ensure result doesn't exceed limit
euint32 sum = TFHE.add(a, b);
result = TFHE.min(sum, TFHE.asEuint32(maxLimit));
```

### Pattern 3: Complex Calculations
```solidity
// Multi-step calculation staying encrypted
euint32 step1 = TFHE.add(a, b);
euint32 step2 = TFHE.mul(step1, c);
euint32 step3 = TFHE.sub(step2, d);
```

## Next Steps

After mastering basic arithmetic:
1. Explore **Comparison Operations** (equality, greater than, less than)
2. Learn **Access Control** patterns for secure decryption
3. Study **Input Proofs** for secure user inputs
4. Build **Real Applications** using these primitives

## Related Examples

- **Counter** - Simpler example with increment/decrement
- **Equality** - Comparison operations
- **Access Control** - Secure decryption patterns

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [TFHE Operations Reference](https://docs.zama.ai/fhevm/fundamentals/types)
- [Gas Optimization Guide](https://docs.zama.ai/fhevm/guides/gas-optimization)

---

**Learn by doing**: Modify the contract to add division, modulo, or bitwise operations!
