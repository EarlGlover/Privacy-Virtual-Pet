# FHE Single Value Decryption Example

**Category**: User Decryption Patterns
**Difficulty**: Intermediate
**Chapter**: user-decryption
**Concepts**: Access-controlled decryption, FHE.allow(), owner permissions, secure decryption

## Overview

This example demonstrates how to implement secure, access-controlled decryption of encrypted values. Learn the critical patterns for managing who can decrypt what data, and how to implement proper authorization checks.

## What You'll Learn

- ✅ Using TFHE.decrypt() with access control
- ✅ Implementing owner-only decryption
- ✅ Using FHE.allow() for granular permissions
- ✅ Secure decryption patterns
- ✅ Preventing unauthorized data access
- ✅ Decryption event logging for auditing

## Smart Contract

### SecretValue.sol

A contract that stores encrypted values with strict access control for decryption.

**Key Features**:
- `setValue(uint32 plainValue)` - Encrypt and store value
- `getEncryptedValue()` - Retrieve encrypted value (anyone)
- `getDecryptedValue()` - Decrypt value (owner only)
- `allowDecryption(address user)` - Grant decryption permission
- `revokeDecryption(address user)` - Revoke decryption permission

## How It Works

### Access-Controlled Decryption Flow

```
Encrypted Value in Contract
       ↓
User requests decryption
       ↓
Check: Is user authorized?
  ├─ YES → TFHE.decrypt() → Return plaintext
  └─ NO  → Revert transaction
```

### Traditional vs FHE Decryption

**Traditional (No Privacy)**:
```solidity
uint32 public value = 42;  // Anyone can read
```

**FHE (Privacy + Access Control)**:
```solidity
euint32 private value;     // Encrypted
// Only authorized users can decrypt
function getDecrypted() external view returns (uint32) {
    require(authorized[msg.sender], "Not authorized");
    return TFHE.decrypt(value);
}
```

## Encrypted Operations Used

| Operation | TFHE Function | Purpose |
|-----------|---------------|---------|
| Encryption | `TFHE.asEuint32(value)` | Convert plaintext to encrypted |
| Decryption | `TFHE.decrypt(value)` | Convert encrypted to plaintext |
| Permission | `FHE.allow(value, address)` | Grant decryption rights |
| Revoke | Remove from authorized mapping | Revoke decryption rights |

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
SecretValue
  Access Control
    ✓ should allow owner to decrypt
    ✓ should deny unauthorized decryption
    ✓ should grant decryption permission
    ✓ should revoke decryption permission
  Decryption Security
    ✓ should emit decryption events
    ✓ should maintain privacy for unauthorized
    ✓ should handle multiple authorized users

7 passing
```

## Key Concepts

### Owner-Only Decryption

Most secure pattern - only contract creator can decrypt:

```solidity
address public owner;

constructor() {
    owner = msg.sender;
}

function getDecryptedValue() external view returns (uint32) {
    require(msg.sender == owner, "Only owner can decrypt");
    return TFHE.decrypt(encryptedValue);
}
```

### Granular Permission System

Allow specific users to decrypt:

```solidity
mapping(address => bool) public canDecrypt;

function allowDecryption(address user) external {
    require(msg.sender == owner, "Only owner can grant");
    canDecrypt[user] = true;
}

function getDecryptedValue() external view returns (uint32) {
    require(canDecrypt[msg.sender], "Not authorized");
    return TFHE.decrypt(encryptedValue);
}
```

### FHE.allow() Pattern

Use FHEVM's built-in permission system:

```solidity
function grantAccess(address user) external {
    require(msg.sender == owner, "Only owner");
    FHE.allow(encryptedValue, user);
}
```

## Common Patterns

### Pattern 1: Self-Decryption Only

Users can only decrypt their own data:

```solidity
mapping(address => euint32) private userValues;

function getMyDecryptedValue() external view returns (uint32) {
    return TFHE.decrypt(userValues[msg.sender]);
}
```

### Pattern 2: Time-Based Access

Grant temporary decryption rights:

```solidity
mapping(address => uint256) public decryptionExpiry;

function allowTemporaryDecryption(address user, uint256 duration) external {
    decryptionExpiry[user] = block.timestamp + duration;
}

function getDecryptedValue() external view returns (uint32) {
    require(block.timestamp < decryptionExpiry[msg.sender], "Access expired");
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 3: Role-Based Decryption

Different roles have different decryption rights:

```solidity
enum Role { None, Viewer, Admin }
mapping(address => Role) public roles;

function getDecryptedValue() external view returns (uint32) {
    require(roles[msg.sender] >= Role.Viewer, "Insufficient role");
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 4: Audit Logging

Log all decryption operations:

```solidity
event ValueDecrypted(address indexed user, uint256 timestamp);

function getDecryptedValue() external returns (uint32) {
    require(canDecrypt[msg.sender], "Not authorized");

    emit ValueDecrypted(msg.sender, block.timestamp);

    return TFHE.decrypt(encryptedValue);
}
```

## Security Considerations

### Critical: Access Control

**Always** implement access control for decryption:

```solidity
// ❌ DANGEROUS: Anyone can decrypt
function getDecrypted() external view returns (uint32) {
    return TFHE.decrypt(value);
}

// ✅ SECURE: Only authorized users
function getDecrypted() external view returns (uint32) {
    require(authorized[msg.sender], "Not authorized");
    return TFHE.decrypt(value);
}
```

### Minimize Decryption

Decrypt only when absolutely necessary:

```solidity
// ✅ Good: Compare without decryption
function isGreaterThan(uint32 threshold) external view returns (ebool) {
    return TFHE.gt(value, TFHE.asEuint32(threshold));
}

// ❌ Unnecessary: Decrypts just to compare
function isGreaterThan(uint32 threshold) external view returns (bool) {
    uint32 decrypted = TFHE.decrypt(value);
    return decrypted > threshold;
}
```

### Event Logging

Log decryption for audit trails:

```solidity
event Decrypted(address indexed user, uint256 timestamp);

function decrypt() external view returns (uint32) {
    require(authorized[msg.sender]);
    emit Decrypted(msg.sender, block.timestamp);
    return TFHE.decrypt(value);
}
```

## Practical Example

### Scenario: Private Health Record

```solidity
contract HealthRecord {
    struct MedicalData {
        euint32 bloodPressure;
        euint32 heartRate;
        address patient;
        mapping(address => bool) authorizedDoctors;
    }

    mapping(address => MedicalData) private records;

    function authorizeDoctor(address doctor) external {
        records[msg.sender].authorizedDoctors[doctor] = true;
    }

    function getBloodPressure(address patient) external view returns (uint32) {
        require(
            msg.sender == patient ||
            records[patient].authorizedDoctors[msg.sender],
            "Not authorized"
        );
        return TFHE.decrypt(records[patient].bloodPressure);
    }
}
```

## Next Steps

After mastering this example:

1. **Multiple Value Decryption** - Decrypt multiple fields with access control
2. **Conditional Decryption** - Decrypt based on encrypted conditions
3. **Threshold Decryption** - Require multiple approvals to decrypt
4. **Time-Locked Decryption** - Decrypt only after specific time

## Troubleshooting

### Unauthorized Decryption Error

```
Error: Not authorized to decrypt
```

**Solution**: Check that the caller has permission:
```solidity
require(canDecrypt[msg.sender], "Not authorized");
```

### Missing Access Control

Always add authorization checks:
```solidity
// Add this to all decryption functions
require(msg.sender == owner || authorized[msg.sender], "Not authorized");
```

## Resources

- **FHEVM Docs**: https://docs.zama.ai
- **Zama Community**: https://www.zama.ai/community
- **Security Best Practices**: https://docs.zama.ai/fhevm/security

## Related Examples

- Encrypt Single Value - Learn basic encryption
- Multiple Value Decryption - Decrypt complex structures
- Access Control - Advanced permission patterns

---

**Secure your encrypted data with proper access control!** 🔐

This example is part of the FHEVM Example Hub - a comprehensive collection of encrypted smart contract patterns.
