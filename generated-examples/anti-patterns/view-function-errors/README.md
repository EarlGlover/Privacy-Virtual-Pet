# Anti-Patterns - Common Mistakes and How to Avoid Them

Learn from common mistakes! This example shows the **8 most frequent errors** developers make with FHEVM and how to fix them.

## 🚫 Anti-Pattern #1: Decrypting in View Functions

### ❌ Wrong
```solidity
function getBalance() external view returns (uint32) {
    return TFHE.decrypt(balances[msg.sender]); // ERROR!
}
```

**Why it fails**: View functions cannot perform decryption (requires state changes).

### ✅ Correct
```solidity
function getBalance() external view returns (euint32) {
    return balances[msg.sender]; // Return encrypted handle
}
```

**Decrypt client-side** using fhevmjs.

---

## 🚫 Anti-Pattern #2: Missing FHE.allow() Permissions

### ❌ Wrong
```solidity
function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balances[msg.sender], TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;
    // Missing permissions!
}
```

**Problem**: User cannot decrypt their balance!

### ✅ Correct
```solidity
function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balances[msg.sender], TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;

    TFHE.allowThis(newBalance);      // ✅ Contract permission
    TFHE.allow(newBalance, msg.sender); // ✅ User permission
}
```

---

## 🚫 Anti-Pattern #3: No Input Proofs

### ❌ Wrong
```solidity
function deposit(euint32 amount) external {
    balances[msg.sender] = TFHE.add(balances[msg.sender], amount);
    // No validation!
}
```

**Security Risk**: Vulnerable to malicious encrypted inputs!

### ✅ Correct
```solidity
function deposit(einput encryptedAmount, bytes calldata inputProof) external {
    euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof); // ✅ Validated
    balances[msg.sender] = TFHE.add(balances[msg.sender], amount);
}
```

---

## 🚫 Anti-Pattern #4: Mixing Encrypted and Plaintext

### ❌ Wrong
```solidity
function checkBalance() external view returns (bool) {
    return balances[msg.sender] > 100; // ERROR! Cannot compare
}
```

**Problem**: Cannot use plaintext operators on encrypted values.

### ✅ Correct
```solidity
function checkBalance() external view returns (ebool) {
    return TFHE.gt(balances[msg.sender], TFHE.asEuint32(100)); // ✅ FHE comparison
}
```

---

## 🚫 Anti-Pattern #5: Forgetting allowThis()

### ❌ Wrong
```solidity
function update(uint32 amount) external {
    euint32 newBalance = TFHE.asEuint32(amount);
    balances[msg.sender] = newBalance;
    TFHE.allow(newBalance, msg.sender); // Only user permission
    // Missing contract permission!
}
```

**Problem**: Contract may not be able to use this value later.

### ✅ Correct
```solidity
function update(uint32 amount) external {
    euint32 newBalance = TFHE.asEuint32(amount);
    balances[msg.sender] = newBalance;

    TFHE.allowThis(newBalance);      // ✅ Contract first
    TFHE.allow(newBalance, msg.sender); // ✅ Then user
}
```

---

## 🚫 Anti-Pattern #6: Exposing Data in Events

### ❌ Wrong
```solidity
event Transfer(uint32 amount); // Exposes private data!

function transfer(euint32 amount) external {
    emit Transfer(TFHE.decrypt(amount)); // ❌ Privacy leak!
}
```

**Privacy Violation**: Encrypted data becomes public!

### ✅ Correct
```solidity
event Transfer(address indexed from, address indexed to, uint256 timestamp);

function transfer() external {
    emit Transfer(msg.sender, recipient, block.timestamp); // ✅ Only public data
}
```

---

## 🚫 Anti-Pattern #7: Reusing Input Proofs

### ❌ Wrong
```solidity
function processTwo(
    einput input1,
    einput input2,
    bytes calldata proof // Only one proof!
) external {
    euint32 val1 = TFHE.asEuint32(input1, proof);
    euint32 val2 = TFHE.asEuint32(input2, proof); // ❌ Reusing proof!
}
```

**Security Risk**: Each input needs its own proof!

### ✅ Correct
```solidity
function processTwo(
    einput input1,
    bytes calldata proof1,
    einput input2,
    bytes calldata proof2
) external {
    euint32 val1 = TFHE.asEuint32(input1, proof1); // ✅ Own proof
    euint32 val2 = TFHE.asEuint32(input2, proof2); // ✅ Own proof
}
```

---

## 🚫 Anti-Pattern #8: Type Mismatches

### ❌ Wrong
```solidity
function process(einput input, bytes calldata proof) external {
    euint32 value = TFHE.asEuint8(input, proof); // ❌ Type mismatch!
}
```

**Compilation Error**: Wrong type conversion function.

### ✅ Correct
```solidity
function process(
    einput input8,
    bytes calldata proof8,
    einput input32,
    bytes calldata proof32
) external {
    euint8 value8 = TFHE.asEuint8(input8, proof8);   // ✅ Correct
    euint32 value32 = TFHE.asEuint32(input32, proof32); // ✅ Correct
}
```

---

## Quick Reference: DO vs DON'T

| ❌ DON'T | ✅ DO |
|---------|-------|
| Decrypt in view functions | Return encrypted handles |
| Forget FHE.allow() | Always grant permissions |
| Skip input proofs | Use proofs for all user inputs |
| Mix encrypted/plaintext | Use TFHE operations |
| Skip allowThis() | Grant contract permission |
| Expose data in events | Emit only public info |
| Reuse input proofs | One proof per input |
| Mismatch types | Match conversion functions |

## Testing

```bash
npm test
```

Tests demonstrate:
- ✅ Correct patterns work
- ❌ Anti-patterns are avoided
- ✅ Security is maintained

## Next Steps

- Review **Access Control** for secure permissions
- Study **Input Proofs** for validation
- Build applications avoiding these pitfalls

## Resources

- [FHEVM Best Practices](https://docs.zama.ai/fhevm/guides/best-practices)
- [Common Mistakes Guide](https://docs.zama.ai/fhevm/guides/common-mistakes)
- [Security Checklist](https://docs.zama.ai/fhevm/guides/security)

---

**Remember**: Learn from these mistakes so you don't make them in your own code!
