# Encryption Patterns - FHEVM Examples

**Category**: Input Handling and Type Conversion
**Difficulty**: Beginner to Intermediate ⭐⭐☆☆☆
**Time to Complete**: 3-4 hours

## 📚 Category Overview

This category teaches you how to convert plaintext user input into encrypted form and manage complex encrypted state. Master the patterns for handling encrypted data structures and type conversions.

## 🎯 What You'll Learn

By completing this category, you will master:

- ✅ Converting plaintext to encrypted values with TFHE.asEuint()
- ✅ Managing multiple encrypted values in structs
- ✅ Handling encrypted arrays and mappings
- ✅ Converting between different encrypted types
- ✅ Batch encryption of multiple inputs
- ✅ Updating encrypted state efficiently
- ✅ Type-safe encrypted operations

## 📂 Examples in This Category

### 1. Encrypt Single Value ✅
**File**: `encrypt-single/`
**Concept**: Basic plaintext to encrypted conversion
**Difficulty**: ⭐☆☆☆☆

Learn the fundamental pattern of encrypting a single value.

**Key Topics**:
- `TFHE.asEuint32(value)` - Basic encryption
- Storing encrypted state
- Retrieving without decryption
- Privacy guarantees

```bash
cd encrypt-single
npm install && npm test
```

---

### 2. Encrypt Multiple Values ✅
**File**: `encrypt-multiple/`
**Concept**: Managing encrypted structs
**Difficulty**: ⭐⭐☆☆☆

Handle multiple encrypted values in a single structure.

**Key Topics**:
- Encrypted struct patterns
- Batch encryption
- Individual field updates
- Cross-field computations

```bash
cd encrypt-multiple
npm install && npm test
```

---

### 3. Type Conversion
**File**: `type-conversion/` (to be generated)
**Concept**: Converting between encrypted types
**Difficulty**: ⭐⭐☆☆☆

Learn to safely convert between euint8, euint16, euint32, and ebool.

**Key Topics**:
- Type casting patterns
- Upcasting (euint8 → euint32)
- Downcasting with safety checks
- Boolean to integer conversion

---

## 🎓 Learning Path

### Recommended Order:

1. **Start**: `encrypt-single` (60 minutes)
   - Understand TFHE.asEuint32()
   - Learn encrypted state management
   - Practice retrieval patterns

2. **Build**: `encrypt-multiple` (90 minutes)
   - Manage encrypted structs
   - Batch operations
   - Field-level updates

3. **Master**: `type-conversion` (60 minutes)
   - Type safety in FHE
   - Safe casting patterns
   - Type conversion best practices

**Total Time**: ~3.5 hours

## 🔑 Key Concepts

### Plaintext to Encrypted Conversion

The fundamental encryption pattern:

```solidity
// User provides plaintext
function setValue(uint32 plainValue) external {
    // Convert to encrypted
    euint32 encrypted = TFHE.asEuint32(plainValue);

    // Store in state
    myValue = encrypted;

    // Value is now private on-chain
}
```

### Encrypted Struct Management

Organize multiple encrypted values:

```solidity
struct EncryptedData {
    euint8 age;        // Small range (0-255)
    euint32 balance;   // Large range
    ebool isActive;    // Boolean
}

mapping(address => EncryptedData) public userData;
```

### Batch Encryption

Encrypt multiple values in one transaction:

```solidity
function setProfile(uint8 age, uint32 score, uint32 balance) external {
    userData[msg.sender] = EncryptedData({
        age: TFHE.asEuint8(age),
        score: TFHE.asEuint32(score),
        balance: TFHE.asEuint32(balance)
    });
}
```

### Type Conversion

Safe casting between encrypted types:

```solidity
euint8 smallValue = TFHE.asEuint8(100);

// Upcast: euint8 → euint32 (always safe)
euint32 largeValue = TFHE.asEuint32(smallValue);

// Downcast: euint32 → euint8 (needs validation)
euint32 bigValue = TFHE.asEuint32(300);
euint8 smallValue = TFHE.asEuint8(bigValue);  // Truncates to 44 (300 % 256)
```

## 💡 Common Patterns

### Pattern 1: Single Value Encryption

```solidity
euint32 private encryptedValue;

function setValue(uint32 plain) external {
    encryptedValue = TFHE.asEuint32(plain);
}

function getValue() external view returns (euint32) {
    return encryptedValue;  // Returns encrypted
}
```

### Pattern 2: Multi-Field Struct

```solidity
struct UserProfile {
    euint32 health;
    euint32 mana;
    euint8 level;
}

mapping(address => UserProfile) profiles;

function createProfile(uint32 hp, uint32 mp, uint8 lvl) external {
    profiles[msg.sender] = UserProfile({
        health: TFHE.asEuint32(hp),
        mana: TFHE.asEuint32(mp),
        level: TFHE.asEuint8(lvl)
    });
}
```

### Pattern 3: Partial Update

```solidity
function updateHealth(uint32 newHealth) external {
    // Update only one field, others unchanged
    profiles[msg.sender].health = TFHE.asEuint32(newHealth);
}
```

### Pattern 4: Type-Safe Computation

```solidity
function addValues(uint8 small, uint32 large) external view returns (euint32) {
    euint8 encrypted8 = TFHE.asEuint8(small);
    euint32 encrypted32 = TFHE.asEuint32(large);

    // Must convert to same type before adding
    euint32 converted = TFHE.asEuint32(encrypted8);
    return TFHE.add(converted, encrypted32);
}
```

## 🎨 Encrypted Types Reference

### Available Types

| Type | Bits | Range | Gas Cost | Use Case |
|------|------|-------|----------|----------|
| `euint8` | 8 | 0-255 | Low | Age, percentage, small counters |
| `euint16` | 16 | 0-65,535 | Medium | Moderate values |
| `euint32` | 32 | 0-4B+ | Medium | Balances, large numbers |
| `euint64` | 64 | 0-18 quintillion | High | Very large numbers |
| `ebool` | 1 | true/false | Low | Flags, conditions |

### Choosing the Right Type

```solidity
// ✅ Good: Right-sized types
euint8 age;           // Max 255, perfect for age
euint32 balance;      // Large numbers
ebool isActive;       // Boolean flag

// ❌ Bad: Oversized types (wastes gas)
euint64 age;          // Too large for age (0-120)
euint32 isActive;     // Boolean doesn't need 32 bits
```

## ⚠️ Common Mistakes

### Mistake 1: Type Mismatch

```solidity
// ❌ WRONG: Cannot mix encrypted types
euint8 small;
euint32 large;
// euint32 sum = TFHE.add(small, large);  // Type error

// ✅ CORRECT: Convert to same type first
euint32 converted = TFHE.asEuint32(small);
euint32 sum = TFHE.add(converted, large);
```

### Mistake 2: Unsafe Downcasting

```solidity
// ⚠️ DANGEROUS: Value might overflow
euint32 large = TFHE.asEuint32(300);
euint8 small = TFHE.asEuint8(large);  // Becomes 44 (300 % 256)

// ✅ SAFE: Check bounds first
ebool inRange = TFHE.lte(large, TFHE.asEuint32(255));
// Then use conditional logic
```

### Mistake 3: Storage vs Memory

```solidity
// ⚠️ PROBLEM: Changes to memory don't persist
EncryptedData memory data = userData[msg.sender];
data.age = TFHE.asEuint8(25);  // Not saved!

// ✅ CORRECT: Direct storage modification
userData[msg.sender].age = TFHE.asEuint8(25);
```

### Mistake 4: Unnecessary Conversions

```solidity
// ❌ INEFFICIENT: Converting back and forth
uint32 plain = 100;
euint32 encrypted = TFHE.asEuint32(plain);
uint32 decrypted = TFHE.decrypt(encrypted);  // Wasteful

// ✅ EFFICIENT: Keep encrypted until needed
euint32 encrypted = TFHE.asEuint32(plain);
// ... perform operations ...
// Decrypt only when absolutely necessary
```

## 🧪 Testing Your Knowledge

After completing this category, you should be able to:

- [ ] Convert plaintext to any encrypted type
- [ ] Manage encrypted structs with multiple fields
- [ ] Update individual struct fields efficiently
- [ ] Convert between different encrypted types safely
- [ ] Choose appropriate encrypted types for different use cases
- [ ] Handle batch encryption operations
- [ ] Implement type-safe encrypted operations
- [ ] Avoid common type conversion pitfalls

## 🚀 Quick Start

### Start with Single Value

```bash
cd encrypt-single
npm install
npm run test
```

### Progress to Multiple Values

```bash
cd encrypt-multiple
npm install
npm run test
```

### Generate All Encryption Examples

```bash
# From project root
npx ts-node scripts/create-fhevm-category.ts encryption
```

## 📖 Additional Resources

- **FHEVM Type System**: https://docs.zama.ai/fhevm/fundamentals/types
- **Input Handling**: https://docs.zama.ai/fhevm/guides/inputs
- **Best Practices**: See DEVELOPER_GUIDE.md
- **Tutorial**: HELLO_FHEVM_TUTORIAL.md (Part 3)

## ➡️ What's Next?

After completing the Encryption category:

1. **User Decryption** - Learn access-controlled decryption
2. **Access Control** - Implement FHE.allow() patterns
3. **Advanced Patterns** - Build production applications

---

**Master encrypted data handling!** 🔐

*Part of the FHEVM Example Hub*
