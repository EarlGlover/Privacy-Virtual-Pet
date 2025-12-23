# Input Proofs - Secure Encrypted User Inputs

## Why Input Proofs Are Critical

Input proofs are the **security foundation** of FHEVM applications. They prevent malicious users from submitting invalid or manipulated encrypted data.

## The Problem

Without input proofs:
```solidity
// ❌ INSECURE: No validation!
function deposit(euint32 amount) external {
    balances[msg.sender] = TFHE.add(balances[msg.sender], amount);
}
```

**Vulnerabilities**:
- ❌ User could submit garbage encrypted data
- ❌ User could replay old encrypted values
- ❌ No verification that user created the encryption
- ❌ Encrypted value could be tampered with

## The Solution

```solidity
// ✅ SECURE: Input proof validates the encrypted data
function deposit(einput encryptedAmount, bytes calldata inputProof) external {
    // Validate encrypted input with proof
    euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);

    balances[msg.sender] = TFHE.add(balances[msg.sender], amount);
}
```

**Security Guarantees**:
- ✅ Encrypted value is cryptographically valid
- ✅ Proof verifies msg.sender created this encryption
- ✅ Protection against replay attacks
- ✅ Tampering is detected and rejected

## What Input Proofs Contain

An input proof cryptographically proves:

1. **Validity**: The encrypted value is properly formed
2. **Ownership**: The caller (msg.sender) created this encryption
3. **Freshness**: The encryption is recent (prevents replay)
4. **Integrity**: The encrypted value hasn't been tampered with

## Usage Pattern

### Basic Pattern
```solidity
function processInput(
    einput encryptedValue,
    bytes calldata inputProof
) external {
    // Convert and validate
    euint32 value = TFHE.asEuint32(encryptedValue, inputProof);

    // Use the validated value securely
    processValue(value);
}
```

### Multiple Inputs
```solidity
function processTwo(
    einput input1,
    bytes calldata proof1,
    einput input2,
    bytes calldata proof2
) external {
    // Each input needs its own proof!
    euint32 value1 = TFHE.asEuint32(input1, proof1);
    euint32 value2 = TFHE.asEuint32(input2, proof2);

    // Process both values
}
```

### Different Types
```solidity
function processTypes(
    einput input8,
    bytes calldata proof8,
    einput input32,
    bytes calldata proof32
) external {
    // Match type to conversion function
    euint8 value8 = TFHE.asEuint8(input8, proof8);
    euint32 value32 = TFHE.asEuint32(input32, proof32);
}
```

## When to Use Input Proofs

✅ **ALWAYS use input proofs when**:
- Accepting encrypted data from users
- Processing financial transactions
- Recording game scores or stats
- Handling voting data
- Storing private user information
- ANY user-provided encrypted value

❌ **Don't need input proofs for**:
- Values created inside the contract
- Results of FHE operations
- Plaintext inputs (use regular parameters)

## Common Patterns

### Pattern 1: Deposits/Payments
```solidity
function deposit(
    einput encryptedAmount,
    bytes calldata proof
) external {
    euint32 amount = TFHE.asEuint32(encryptedAmount, proof);
    balances[msg.sender] = TFHE.add(balances[msg.sender], amount);

    TFHE.allowThis(balances[msg.sender]);
    TFHE.allow(balances[msg.sender], msg.sender);
}
```

### Pattern 2: Transfers
```solidity
function transfer(
    address to,
    einput encryptedAmount,
    bytes calldata proof
) external {
    euint32 amount = TFHE.asEuint32(encryptedAmount, proof);

    // Perform transfer with validated amount
    euint32 senderBal = TFHE.sub(balances[msg.sender], amount);
    euint32 recipientBal = TFHE.add(balances[to], amount);

    // Update and grant permissions
    balances[msg.sender] = senderBal;
    balances[to] = recipientBal;

    TFHE.allowThis(senderBal);
    TFHE.allow(senderBal, msg.sender);
    TFHE.allowThis(recipientBal);
    TFHE.allow(recipientBal, to);
}
```

### Pattern 3: Voting
```solidity
function vote(
    einput encryptedChoice,
    bytes calldata proof
) external {
    euint8 choice = TFHE.asEuint8(encryptedChoice, proof);

    votes[msg.sender] = choice;

    TFHE.allowThis(choice);
    TFHE.allow(choice, msg.sender);
}
```

## Frontend Integration

### Creating Encrypted Input with Proof

```typescript
import { createInstance } from "fhevmjs";

// Initialize FHEVM instance
const instance = await createInstance({
    chainId: 9000,
    publicKey: contractPublicKey
});

// Create encrypted input with proof
const encryptedAmount = await instance.createEncryptedInput(
    contractAddress,
    userAddress
);

// Add values to encrypt
encryptedAmount.add32(1000); // Amount to encrypt

// Generate proof
const { handles, inputProof } = encryptedAmount.encrypt();

// Call contract with proof
await contract.deposit(handles[0], inputProof);
```

## Security Best Practices

### ✅ DO:
- Always use input proofs for user-provided encrypted data
- Use separate proofs for each encrypted input
- Match the proof to the correct input parameter
- Validate input proofs before any state changes

### ❌ DON'T:
- Accept encrypted inputs without proofs
- Reuse proofs for multiple inputs
- Skip proof validation for "trusted" users
- Mix up proof parameters

## Common Mistakes

### ❌ Mistake 1: No Proof
```solidity
// INSECURE!
function deposit(euint32 amount) external {
    balances[msg.sender] = amount;
}
```

### ❌ Mistake 2: Wrong Type
```solidity
// Will fail! Type mismatch
function process(einput input, bytes calldata proof) external {
    euint32 value = TFHE.asEuint8(input, proof); // Wrong type!
}
```

### ❌ Mistake 3: Reusing Proofs
```solidity
// INSECURE! Each input needs its own proof
function processTwo(
    einput input1,
    einput input2,
    bytes calldata proof // Only one proof for two inputs!
) external {
    euint32 val1 = TFHE.asEuint32(input1, proof);
    euint32 val2 = TFHE.asEuint32(input2, proof); // ❌ Reusing proof!
}
```

## Testing

```bash
npm test
```

Tests verify:
- ✅ Valid proofs are accepted
- ✅ Invalid proofs are rejected
- ✅ Multiple inputs with separate proofs work
- ✅ Different encrypted types are handled correctly

## Next Steps

- Learn about **FHE.allowTransient()** for temporary permissions
- Explore **Anti-Patterns** to avoid common mistakes
- Build secure applications using input proofs

## Resources

- [FHEVM Input Proof Documentation](https://docs.zama.ai/fhevm)
- [Security Best Practices](https://docs.zama.ai/fhevm/guides/security)
- [Frontend Integration Guide](https://docs.zama.ai/fhevm/guides/frontend)
