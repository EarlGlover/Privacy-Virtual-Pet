# Anti-Patterns - Learn from Common Mistakes

Understand the **most common mistakes** developers make with FHEVM and learn how to avoid them. This category is essential for writing correct, secure FHEVM code.

## Overview

Anti-patterns are common programming mistakes that look correct but cause problems. Learning these anti-patterns helps you:
- ✅ Avoid frustrating bugs
- ✅ Write secure code from the start
- ✅ Understand FHEVM limitations
- ✅ Follow best practices

## Examples in This Category

### View Function Errors
**Location**: `view-function-errors/`

Learn the **8 most common FHEVM mistakes**:

#### 1. Decrypting in View Functions
❌ **Wrong**: Trying to decrypt in view functions
✅ **Right**: Return encrypted handles

#### 2. Missing FHE.allow() Permissions
❌ **Wrong**: Forgetting to grant permissions
✅ **Right**: Always grant `allowThis` and `allow`

#### 3. No Input Proofs
❌ **Wrong**: Accepting encrypted data without validation
✅ **Right**: Always use input proofs

#### 4. Mixing Encrypted and Plaintext
❌ **Wrong**: Using regular operators on encrypted values
✅ **Right**: Use TFHE operations

#### 5. Forgetting allowThis()
❌ **Wrong**: Only granting user permission
✅ **Right**: Grant contract permission too

#### 6. Exposing Data in Events
❌ **Wrong**: Emitting decrypted values
✅ **Right**: Emit only public information

#### 7. Reusing Input Proofs
❌ **Wrong**: One proof for multiple inputs
✅ **Right**: Separate proof for each input

#### 8. Type Mismatches
❌ **Wrong**: Using wrong conversion function
✅ **Right**: Match types correctly

**Difficulty**: ⭐⭐ Intermediate (Essential for all developers)

---

## The 8 Anti-Patterns in Detail

### 🚫 #1: Decrypting in View Functions

```solidity
// ❌ WRONG
function getBalance() external view returns (uint32) {
    return TFHE.decrypt(balances[msg.sender]); // ERROR!
}

// ✅ CORRECT
function getBalance() external view returns (euint32) {
    return balances[msg.sender]; // Return encrypted
}
```

**Why**: View functions cannot modify state, but decryption requires state changes.

---

### 🚫 #2: Missing Permissions

```solidity
// ❌ WRONG
function deposit(uint32 amount) external {
    balances[msg.sender] = TFHE.asEuint32(amount);
    // Missing permissions!
}

// ✅ CORRECT
function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.asEuint32(amount);
    balances[msg.sender] = newBalance;

    TFHE.allowThis(newBalance);
    TFHE.allow(newBalance, msg.sender);
}
```

**Impact**: User cannot decrypt their own data!

---

### 🚫 #3: No Input Proofs

```solidity
// ❌ WRONG (INSECURE!)
function deposit(euint32 amount) external {
    balances[msg.sender] = amount;
    // No proof - vulnerable!
}

// ✅ CORRECT
function deposit(
    einput encryptedAmount,
    bytes calldata inputProof
) external {
    euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);
    balances[msg.sender] = amount;
}
```

**Risk**: Vulnerable to malicious encrypted inputs!

---

### 🚫 #4: Mixing Types

```solidity
// ❌ WRONG
function checkBalance() external view returns (bool) {
    return balances[msg.sender] > 100; // ERROR!
}

// ✅ CORRECT
function checkBalance() external view returns (ebool) {
    return TFHE.gt(balances[msg.sender], TFHE.asEuint32(100));
}
```

**Why**: Cannot use regular operators on encrypted values.

---

### 🚫 #5: Forgetting allowThis

```solidity
// ❌ WRONG
function update(euint32 value) external {
    data[msg.sender] = value;
    TFHE.allow(value, msg.sender); // Only user permission
    // Missing: TFHE.allowThis(value);
}

// ✅ CORRECT
function update(euint32 value) external {
    data[msg.sender] = value;
    TFHE.allowThis(value);      // Contract first
    TFHE.allow(value, msg.sender); // Then user
}
```

**Problem**: Contract may not be able to use this value later.

---

### 🚫 #6: Exposing in Events

```solidity
// ❌ WRONG
event Transfer(uint32 amount); // Exposes private data!

function transfer(euint32 amount) external {
    emit Transfer(TFHE.decrypt(amount)); // Leaks privacy!
}

// ✅ CORRECT
event Transfer(address indexed from, address indexed to);

function transfer() external {
    emit Transfer(msg.sender, recipient);
}
```

**Impact**: Defeats the purpose of encryption!

---

### 🚫 #7: Reusing Proofs

```solidity
// ❌ WRONG
function processTwo(
    einput a,
    einput b,
    bytes calldata proof // Only one proof!
) external {
    euint32 val1 = TFHE.asEuint32(a, proof);
    euint32 val2 = TFHE.asEuint32(b, proof); // Reusing!
}

// ✅ CORRECT
function processTwo(
    einput a,
    bytes calldata proof1,
    einput b,
    bytes calldata proof2
) external {
    euint32 val1 = TFHE.asEuint32(a, proof1);
    euint32 val2 = TFHE.asEuint32(b, proof2);
}
```

**Rule**: Each input needs its own proof!

---

### 🚫 #8: Type Mismatches

```solidity
// ❌ WRONG
function process(einput input, bytes calldata proof) external {
    euint32 value = TFHE.asEuint8(input, proof); // Type mismatch!
}

// ✅ CORRECT
function process(
    einput input8,
    bytes calldata proof8
) external {
    euint8 value = TFHE.asEuint8(input8, proof8);
}
```

**Error**: Compilation fails or runtime error.

---

## Quick Reference Table

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| View decryption | Cannot modify state | Return encrypted handle |
| Missing permissions | User cannot decrypt | Grant `allowThis` and `allow` |
| No input proofs | Security vulnerability | Use `einput` and proof |
| Type mixing | Operator incompatibility | Use TFHE operations |
| No allowThis | Contract cannot use value | Grant contract permission |
| Event exposure | Privacy leak | Emit only public data |
| Proof reuse | Security risk | One proof per input |
| Type mismatch | Compilation/runtime error | Match types correctly |

---

## How to Use These Examples

### 1. Study the Wrong Patterns
- Understand why each pattern is wrong
- Learn the symptoms of each mistake
- Recognize these patterns in code reviews

### 2. Practice the Correct Patterns
- Implement the correct versions
- Run the test suites
- Apply to your own projects

### 3. Create Your Checklist
Before deploying FHEVM code, verify:
- ✅ No view function decryption
- ✅ All values have proper permissions
- ✅ All user inputs use proofs
- ✅ All operations use TFHE functions
- ✅ Both allowThis and allow are used
- ✅ No sensitive data in events
- ✅ Unique proof for each input
- ✅ Type conversions match correctly

---

## Learning Path

### For Beginners
1. Read through all 8 anti-patterns
2. Understand why each is wrong
3. Practice writing correct versions

### For Intermediate
1. Review your existing code for these patterns
2. Refactor any anti-patterns found
3. Add these checks to your code review process

### For Advanced
1. Create automated tests for anti-patterns
2. Build linters to detect these issues
3. Share knowledge with your team

---

## Common Questions

**Q: Why can't I decrypt in view functions?**
A: View functions cannot modify state, but decryption requires state changes for security and gas metering.

**Q: What happens if I forget permissions?**
A: Users cannot decrypt their data, even though it's stored correctly. The data becomes inaccessible.

**Q: Are input proofs really necessary?**
A: YES! Without proofs, malicious users can submit invalid encrypted data or replay old values.

**Q: Can I ever reuse a proof?**
A: NO! Each encrypted input must have its own unique proof for security.

---

## Testing

```bash
cd view-function-errors
npm test
```

The test suite demonstrates:
- ✅ Correct patterns work
- ❌ Anti-patterns fail appropriately
- ✅ Edge cases are handled

---

## Next Steps

After mastering anti-patterns:
1. Review **Access Control** for permission management
2. Study **Advanced** patterns for complex applications
3. Build secure applications confidently

---

## Resources

- [FHEVM Common Mistakes](https://docs.zama.ai/fhevm/guides/common-mistakes)
- [Security Best Practices](https://docs.zama.ai/fhevm/guides/security)
- [Debugging Guide](https://docs.zama.ai/fhevm/guides/debugging)

---

**Learn from these mistakes to write better FHEVM code!** 🎯

Remember: The best way to avoid bugs is to know what not to do!
