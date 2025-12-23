# Access Control with FHE.allow()

## Critical Concept: Decryption Permissions

In FHEVM, **encrypted data cannot be decrypted without explicit permission**. This example demonstrates the correct patterns for managing decryption access.

## The Problem

```solidity
// ❌ WRONG: User cannot decrypt their balance!
function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balances[msg.sender], TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;
    // Missing permissions!
}
```

## The Solution

```solidity
// ✅ CORRECT: Proper permission management
function deposit(uint32 amount) external {
    euint32 newBalance = TFHE.add(balances[msg.sender], TFHE.asEuint32(amount));
    balances[msg.sender] = newBalance;

    // Grant permissions
    TFHE.allowThis(newBalance);      // Contract can read it
    TFHE.allow(newBalance, msg.sender);  // User can decrypt it
}
```

## Key Functions

### FHE.allow(handle, address)
Grants decryption permission to a specific address.

```solidity
TFHE.allow(encryptedValue, userAddress);
```

### FHE.allowThis(handle)
Grants decryption permission to the contract itself.

```solidity
TFHE.allowThis(encryptedValue);
```

## When to Grant Permissions

✅ **ALWAYS grant permissions**:
- After creating new encrypted values
- After updating encrypted values
- After arithmetic operations
- After comparison operations
- When returning encrypted values from functions

## Permission Patterns

### Pattern 1: Single User Update
```solidity
function updateValue() external {
    euint32 newValue = TFHE.asEuint32(42);
    userValue[msg.sender] = newValue;

    TFHE.allowThis(newValue);
    TFHE.allow(newValue, msg.sender);
}
```

### Pattern 2: Multi-Party Update
```solidity
function transfer(address to, uint32 amount) external {
    // Update sender
    euint32 newSenderBalance = TFHE.sub(balances[msg.sender], amount);
    balances[msg.sender] = newSenderBalance;
    TFHE.allowThis(newSenderBalance);
    TFHE.allow(newSenderBalance, msg.sender);

    // Update recipient
    euint32 newRecipientBalance = TFHE.add(balances[to], amount);
    balances[to] = newRecipientBalance;
    TFHE.allowThis(newRecipientBalance);
    TFHE.allow(newRecipientBalance, to);
}
```

### Pattern 3: Explicit Permission Sharing
```solidity
function shareData(address viewer) external {
    euint32 myData = userData[msg.sender];

    // Grant permission to another user
    TFHE.allow(myData, viewer);
}
```

## Common Mistakes

### ❌ Mistake 1: Forgetting allowThis
```solidity
// Contract cannot perform operations on this value later
TFHE.allow(value, user);  // User can decrypt
// Missing: TFHE.allowThis(value);
```

### ❌ Mistake 2: Forgetting allow for User
```solidity
// User cannot decrypt their own data!
TFHE.allowThis(value);  // Contract can use it
// Missing: TFHE.allow(value, msg.sender);
```

### ❌ Mistake 3: Granting Before Storage
```solidity
euint32 newValue = TFHE.asEuint32(42);
TFHE.allow(newValue, msg.sender);  // Too early!
balances[msg.sender] = newValue;   // Handle changes on storage
// Should grant permissions AFTER storage update
```

## Testing

```bash
npm test
```

Tests verify:
- ✅ Users can decrypt their own data
- ✅ Users cannot decrypt others' data without permission
- ✅ Contract can perform operations on encrypted data
- ✅ Explicit permission granting works

## Security Considerations

1. **Principle of Least Privilege**: Only grant permissions to addresses that need them
2. **No Universal Decryption**: Never create functions that allow anyone to decrypt
3. **Permission Tracking**: Consider tracking who has permissions for auditing

## Next Steps

- Learn **FHE.allowTransient()** for temporary permissions
- Explore **Input Proofs** for secure user inputs
- Study **Anti-Patterns** to avoid common mistakes

## Resources

- [FHEVM Access Control Documentation](https://docs.zama.ai/fhevm)
- [Permission Management Guide](https://docs.zama.ai/fhevm/guides/permissions)
