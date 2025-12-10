# Basic Operations - FHEVM Examples

**Category**: Fundamental FHE Concepts
**Difficulty**: Beginner ⭐☆☆☆☆
**Time to Complete**: 2-3 hours

## 📚 Category Overview

This category introduces the fundamental building blocks of Fully Homomorphic Encryption (FHE) smart contracts. Learn how to perform basic operations on encrypted data without ever revealing the values.

## 🎯 What You'll Learn

By completing this category, you will master:

- ✅ Creating and managing encrypted state variables
- ✅ Performing arithmetic operations on encrypted data (add, subtract, multiply)
- ✅ Comparing encrypted values (equality, less than, greater than)
- ✅ Using bounds checking (min, max) to prevent overflow/underflow
- ✅ Converting plaintext to encrypted values
- ✅ Decrypting values with proper access control
- ✅ Testing encrypted smart contracts

## 📂 Examples in This Category

### 1. Encrypted Counter
**File**: `counter/`
**Concept**: Encrypted arithmetic operations
**Difficulty**: ⭐☆☆☆☆

Learn how to build a counter that increments and decrements without revealing its value.

**Key Operations**:
- `TFHE.add()` - Add encrypted values
- `TFHE.sub()` - Subtract encrypted values
- `TFHE.min()` - Cap maximum value
- `TFHE.max()` - Prevent negative values

**Start Here**: This is the best first example for learning FHE.

```bash
cd counter
npm install
npm test
```

---

### 2. Arithmetic Operations
**File**: `arithmetic/` (to be generated)
**Concept**: Complete set of TFHE math operations
**Difficulty**: ⭐☆☆☆☆

Comprehensive example of all arithmetic operations on encrypted data.

**Key Operations**:
- `TFHE.add()` - Addition
- `TFHE.sub()` - Subtraction
- `TFHE.mul()` - Multiplication
- `TFHE.div()` - Division
- `TFHE.min()` / `TFHE.max()` - Bounds
- `TFHE.neg()` - Negation

---

### 3. Equality Comparison
**File**: `equality/` (to be generated)
**Concept**: Encrypted comparisons and boolean operations
**Difficulty**: ⭐☆☆☆☆

Learn how to compare encrypted values without decryption.

**Key Operations**:
- `TFHE.eq()` - Equality check
- `TFHE.ne()` - Not equal
- `TFHE.lt()` - Less than
- `TFHE.gt()` - Greater than
- `TFHE.lte()` - Less than or equal
- `TFHE.gte()` - Greater than or equal

---

## 🎓 Learning Path

### Recommended Order:

1. **Start**: `counter` (30 minutes)
   - Understand encrypted state
   - Learn basic add/sub operations
   - Practice bounds checking

2. **Next**: `arithmetic` (45 minutes)
   - Master all math operations
   - Understand encrypted types
   - Learn type conversions

3. **Complete**: `equality` (45 minutes)
   - Compare encrypted values
   - Work with encrypted booleans
   - Understand encrypted branching

**Total Time**: ~2 hours

## 🔑 Key Concepts

### Encrypted State Variables

Unlike normal smart contracts where all state is public:

```solidity
// ❌ Traditional: Everyone can see
uint32 public counter = 42;  // Value: 42 (visible to all)

// ✅ FHE: Value is encrypted
euint32 private counter;     // Value: encrypted(42) (private)
```

### Encrypted Arithmetic

Perform math on encrypted values without decryption:

```
encrypted(5) + encrypted(3) = encrypted(8)
// Neither inputs nor output are visible
```

### TFHE Operations

All operations return encrypted results:

```solidity
euint32 a = TFHE.asEuint32(10);
euint32 b = TFHE.asEuint32(20);
euint32 sum = TFHE.add(a, b);        // encrypted(30)
ebool isEqual = TFHE.eq(a, b);       // encrypted(false)
ebool isLess = TFHE.lt(a, b);        // encrypted(true)
```

### Encrypted Types

FHEVM provides multiple encrypted types:

| Type | Range | Use Case |
|------|-------|----------|
| `euint8` | 0 to 255 | Small numbers (age, percentage) |
| `euint16` | 0 to 65,535 | Medium numbers |
| `euint32` | 0 to 4,294,967,295 | Large numbers (balances) |
| `euint64` | 0 to 2^64-1 | Very large numbers |
| `ebool` | true/false | Boolean values |

## 💡 Common Patterns

### Pattern 1: Safe Increment

```solidity
function increment(euint32 amount) external {
    counter = TFHE.add(counter, amount);
    counter = TFHE.min(counter, TFHE.asEuint32(MAX_VALUE));
}
```

### Pattern 2: Safe Decrement

```solidity
function decrement(euint32 amount) external {
    counter = TFHE.sub(counter, amount);
    counter = TFHE.max(counter, TFHE.asEuint32(0));
}
```

### Pattern 3: Encrypted Comparison

```solidity
function isGreaterThan(uint32 threshold) external view returns (ebool) {
    return TFHE.gt(counter, TFHE.asEuint32(threshold));
}
```

### Pattern 4: Access-Controlled Decryption

```solidity
function getDecryptedValue() external view returns (uint32) {
    require(msg.sender == owner, "Not authorized");
    return TFHE.decrypt(counter);
}
```

## ⚠️ Common Mistakes

### Mistake 1: Using Normal Operators

```solidity
// ❌ WRONG: Cannot use + - * on encrypted types
euint32 a, b;
// euint32 sum = a + b;  // Compilation error

// ✅ CORRECT: Use TFHE operations
euint32 sum = TFHE.add(a, b);
```

### Mistake 2: Direct Comparison

```solidity
// ❌ WRONG: Cannot use < > == on encrypted types
// if (encryptedValue > 10) { ... }  // Compilation error

// ✅ CORRECT: Use TFHE comparison, returns encrypted boolean
ebool result = TFHE.gt(encryptedValue, TFHE.asEuint32(10));
```

### Mistake 3: Decrypting in View Function

```solidity
// ⚠️ PROBLEM: View functions have gas limits
function getValue() external view returns (uint32) {
    return TFHE.decrypt(encryptedValue);  // May run out of gas
}

// ✅ BETTER: Use non-view or return encrypted
function getValue() external view returns (euint32) {
    return encryptedValue;  // Returns encrypted, no gas issue
}
```

## 🧪 Testing Your Knowledge

After completing this category, you should be able to:

- [ ] Create an encrypted counter that increments/decrements
- [ ] Prevent integer overflow and underflow using TFHE.min/max
- [ ] Compare two encrypted values without decryption
- [ ] Implement access-controlled decryption
- [ ] Write comprehensive tests for encrypted contracts
- [ ] Understand the difference between euint8, euint32, euint64
- [ ] Use TFHE operations correctly in your contracts

## 🚀 Quick Start

### Option 1: Start with Counter

```bash
cd counter
npm install
npm run compile
npm run test
```

### Option 2: Generate All Basic Examples

```bash
# From project root
npx ts-node scripts/create-fhevm-category.ts basic
```

## 📖 Additional Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **TFHE Operations Reference**: https://docs.zama.ai/fhevm/fundamentals/types
- **Security Best Practices**: See DEVELOPER_GUIDE.md
- **Tutorial**: HELLO_FHEVM_TUTORIAL.md (Part 3: Writing FHE Contracts)

## ➡️ What's Next?

After completing the Basic category:

1. **Encryption Patterns** - Learn how to handle multiple encrypted values
2. **User Decryption** - Master access-controlled decryption
3. **Access Control** - Implement granular permissions with FHE.allow()

---

**Ready to learn FHE basics!** 🎓

*Part of the FHEVM Example Hub*
