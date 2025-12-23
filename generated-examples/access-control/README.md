# Access Control Examples

Learn how to properly manage decryption permissions and secure user inputs in FHEVM.

## Overview

Access control is **CRITICAL** in FHEVM applications. Without proper permissions, users cannot decrypt their data. This category teaches you the essential patterns for managing access to encrypted data.

## Examples in This Category

### 1. FHE.allow() Pattern
**Location**: `fhe-allow/`

Learn the fundamental permission management pattern:
- ✅ `FHE.allow(handle, address)` - Grant decryption permission
- ✅ `FHE.allowThis(handle)` - Grant contract permission
- ✅ When to grant permissions
- ✅ Multi-party permission management

**Key Concepts**:
- Permission granting after state changes
- Contract vs user permissions
- Explicit permission sharing

**Difficulty**: ⭐⭐ Intermediate

---

### 2. Input Proofs
**Location**: `input-proofs/`

Master secure handling of user-provided encrypted data:
- ✅ What are input proofs and why they're needed
- ✅ How to validate encrypted inputs
- ✅ Protection against malicious data
- ✅ Multiple inputs with separate proofs

**Key Concepts**:
- `einput` type for user inputs
- Cryptographic validation
- Replay attack prevention
- Type-specific proofs

**Difficulty**: ⭐⭐⭐ Advanced

---

## Why Access Control Matters

### Without Proper Permissions
```solidity
❌ function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balance, TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;
    // Missing permissions - user cannot decrypt!
}
```

**Problems**:
- User cannot view their balance
- Contract may not be able to use the value
- Data is effectively lost

### With Proper Permissions
```solidity
✅ function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balance, TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;

    TFHE.allowThis(newBalance);      // Contract can use it
    TFHE.allow(newBalance, msg.sender); // User can decrypt it
}
```

**Benefits**:
- User can decrypt their balance
- Contract can perform operations
- Data is accessible when needed

---

## Key Patterns

### Pattern 1: Single User Update
```solidity
function updateValue() external {
    euint32 newValue = computeValue();

    storage[msg.sender] = newValue;

    // Grant permissions
    TFHE.allowThis(newValue);
    TFHE.allow(newValue, msg.sender);
}
```

### Pattern 2: Multi-Party Transaction
```solidity
function transfer(address to, euint32 amount) external {
    // Update sender
    euint32 newSenderBal = TFHE.sub(balances[msg.sender], amount);
    balances[msg.sender] = newSenderBal;
    TFHE.allowThis(newSenderBal);
    TFHE.allow(newSenderBal, msg.sender);

    // Update recipient
    euint32 newRecipientBal = TFHE.add(balances[to], amount);
    balances[to] = newRecipientBal;
    TFHE.allowThis(newRecipientBal);
    TFHE.allow(newRecipientBal, to);
}
```

### Pattern 3: Input Validation
```solidity
function processInput(
    einput encryptedValue,
    bytes calldata inputProof
) external {
    // Validate with proof
    euint32 value = TFHE.asEuint32(encryptedValue, inputProof);

    // Use validated value
    process(value);
}
```

---

## Security Checklist

When implementing access control, always:

✅ **Grant `allowThis` first**: Contract needs permission
✅ **Grant `allow` to users**: Users need to decrypt
✅ **Use input proofs**: Validate all user-provided encrypted data
✅ **One proof per input**: Don't reuse proofs
✅ **Grant after storage**: Update state then grant permissions
✅ **Consider all parties**: Grant permissions to everyone who needs access

---

## Common Mistakes

### ❌ Mistake 1: Forgetting allowThis
```solidity
TFHE.allow(value, user);
// Missing: TFHE.allowThis(value);
// Contract cannot use this value later!
```

### ❌ Mistake 2: Forgetting User Permission
```solidity
TFHE.allowThis(value);
// Missing: TFHE.allow(value, user);
// User cannot decrypt their own data!
```

### ❌ Mistake 3: No Input Proof
```solidity
function deposit(euint32 amount) external {
    // ❌ No proof - vulnerable to attacks!
}
```

### ❌ Mistake 4: Reusing Proofs
```solidity
function processTwo(
    einput a,
    einput b,
    bytes calldata proof // Only one proof!
) external {
    euint32 val1 = TFHE.asEuint32(a, proof);
    euint32 val2 = TFHE.asEuint32(b, proof); // ❌ Reusing proof!
}
```

---

## Learning Path

### For Beginners
1. Start with **fhe-allow/** - Learn basic permission management
2. Study the examples and test cases
3. Practice implementing permission grants

### For Intermediate Developers
1. Master **fhe-allow/** patterns
2. Move to **input-proofs/** for secure user inputs
3. Understand the security implications

### For Advanced Users
1. Combine patterns for complex applications
2. Implement custom access control logic
3. Build production-ready secure contracts

---

## Testing Your Understanding

After completing these examples, you should be able to:

✅ Explain why `FHE.allow()` is necessary
✅ Implement proper permission management
✅ Validate user inputs with proofs
✅ Handle multiple parties in one transaction
✅ Avoid common access control mistakes
✅ Design secure FHEVM applications

---

## Next Steps

After mastering access control:
1. Review **Anti-Patterns** to avoid common mistakes
2. Explore **Advanced** examples for real-world applications
3. Build your own secure FHEVM applications

---

## Resources

- [FHEVM Access Control Documentation](https://docs.zama.ai/fhevm/fundamentals/permissions)
- [Input Proof Security](https://docs.zama.ai/fhevm/fundamentals/inputs)
- [Best Practices Guide](https://docs.zama.ai/fhevm/guides/best-practices)

---

**Master access control to build secure, privacy-preserving applications!** 🔐
