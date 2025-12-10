# User Decryption - FHEVM Examples

**Category**: Access-Controlled Decryption Patterns
**Difficulty**: Intermediate to Advanced ⭐⭐⭐☆☆
**Time to Complete**: 4-5 hours

## 📚 Category Overview

Master the critical skill of secure, access-controlled decryption. Learn how to reveal encrypted data only to authorized parties while maintaining privacy for everyone else.

## 🎯 What You'll Learn

By completing this category, you will master:

- ✅ Implementing owner-only decryption
- ✅ Using TFHE.decrypt() with access control
- ✅ Managing decryption permissions with FHE.allow()
- ✅ Decrypting multiple values securely
- ✅ Conditional decryption patterns
- ✅ Event logging for audit trails
- ✅ Time-based and role-based decryption

## 📂 Examples in This Category

### 1. Decrypt Single Value ✅
**File**: `decrypt-single/`
**Concept**: Basic access-controlled decryption
**Difficulty**: ⭐⭐☆☆☆

Learn to decrypt a single value with proper authorization.

**Key Topics**:
- Owner-only decryption
- Access control patterns
- TFHE.decrypt() usage
- Permission management

```bash
cd decrypt-single
npm install && npm test
```

---

### 2. Decrypt Multiple Values
**File**: `decrypt-multiple/` (to be generated)
**Concept**: Batch decryption with access control
**Difficulty**: ⭐⭐⭐☆☆

Decrypt entire structs or multiple fields securely.

**Key Topics**:
- Batch decryption patterns
- Selective field decryption
- Permission granularity
- Gas optimization

---

### 3. Conditional Decryption
**File**: `conditional-decrypt/` (to be generated)
**Concept**: Decrypt based on encrypted conditions
**Difficulty**: ⭐⭐⭐⭐☆

Advanced pattern: decrypt only if encrypted conditions are met.

**Key Topics**:
- Encrypted condition evaluation
- TFHE.cmux() for conditional logic
- Privacy-preserving access control
- Complex authorization rules

---

## 🎓 Learning Path

### Recommended Order:

1. **Foundation**: `decrypt-single` (90 minutes)
   - Understand TFHE.decrypt()
   - Implement access control
   - Manage permissions

2. **Expansion**: `decrypt-multiple` (120 minutes)
   - Batch decryption patterns
   - Selective field access
   - Optimize gas costs

3. **Mastery**: `conditional-decrypt` (90 minutes)
   - Encrypted conditions
   - Complex authorization
   - Production patterns

**Total Time**: ~5 hours

## 🔑 Key Concepts

### Access-Controlled Decryption

The most critical FHE security pattern:

```solidity
// ❌ DANGEROUS: Anyone can decrypt
function getValue() external view returns (uint32) {
    return TFHE.decrypt(encryptedValue);
}

// ✅ SECURE: Only authorized users
function getValue() external view returns (uint32) {
    require(authorized[msg.sender], "Not authorized");
    return TFHE.decrypt(encryptedValue);
}
```

### Owner-Only Pattern

Simplest and most secure:

```solidity
address public owner;

constructor() {
    owner = msg.sender;
}

function getDecrypted() external view returns (uint32) {
    require(msg.sender == owner, "Only owner");
    return TFHE.decrypt(value);
}
```

### Permission Mapping

Granular access control:

```solidity
mapping(address => bool) public canDecrypt;

function grantAccess(address user) external {
    require(msg.sender == owner);
    canDecrypt[user] = true;
}

function getDecrypted() external view returns (uint32) {
    require(canDecrypt[msg.sender], "No permission");
    return TFHE.decrypt(value);
}
```

### Self-Decryption Pattern

Users can only decrypt their own data:

```solidity
mapping(address => euint32) private userValues;

function getMyValue() external view returns (uint32) {
    return TFHE.decrypt(userValues[msg.sender]);
}
```

## 💡 Common Patterns

### Pattern 1: Owner-Only Decryption

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

function decrypt() external view onlyOwner returns (uint32) {
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 2: Multi-User Permission

```solidity
mapping(address => bool) authorized;

function authorize(address user) external onlyOwner {
    authorized[user] = true;
    emit Authorized(user);
}

function decrypt() external view returns (uint32) {
    require(authorized[msg.sender], "Not authorized");
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 3: Time-Based Access

```solidity
mapping(address => uint256) public accessExpiry;

function grantTemporaryAccess(address user, uint256 duration) external {
    accessExpiry[user] = block.timestamp + duration;
}

function decrypt() external view returns (uint32) {
    require(block.timestamp < accessExpiry[msg.sender], "Access expired");
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 4: Role-Based Decryption

```solidity
enum Role { None, Viewer, Admin }
mapping(address => Role) public roles;

function decrypt() external view returns (uint32) {
    require(roles[msg.sender] >= Role.Viewer, "Insufficient role");
    return TFHE.decrypt(encryptedValue);
}
```

### Pattern 5: Audit Logging

```solidity
event Decrypted(address indexed user, uint256 timestamp, uint256 value);

function decrypt() external returns (uint32) {
    require(authorized[msg.sender]);

    uint32 decrypted = TFHE.decrypt(encryptedValue);

    emit Decrypted(msg.sender, block.timestamp, decrypted);

    return decrypted;
}
```

## 🔒 Security Best Practices

### 1. Always Require Authorization

```solidity
// ✅ Every decryption function needs access control
function decrypt() external view returns (uint32) {
    require(msg.sender == owner || authorized[msg.sender]);
    return TFHE.decrypt(value);
}
```

### 2. Log All Decryptions

```solidity
// ✅ Create audit trail
event ValueDecrypted(address indexed by, uint256 when);

function decrypt() external returns (uint32) {
    require(authorized[msg.sender]);
    emit ValueDecrypted(msg.sender, block.timestamp);
    return TFHE.decrypt(value);
}
```

### 3. Minimize Decryption

```solidity
// ❌ Unnecessary decryption
function compare(uint32 threshold) external view returns (bool) {
    uint32 decrypted = TFHE.decrypt(value);
    return decrypted > threshold;
}

// ✅ Compare without decryption
function compare(uint32 threshold) external view returns (ebool) {
    return TFHE.gt(value, TFHE.asEuint32(threshold));
}
```

### 4. Beware of View Function Gas Limits

```solidity
// ⚠️ View functions may run out of gas
function decrypt() external view returns (uint32) {
    return TFHE.decrypt(value);  // May fail with gas error
}

// ✅ Use non-view or return encrypted
function decrypt() external returns (uint32) {
    return TFHE.decrypt(value);  // No gas limit
}
```

### 5. Use FHE.allow() for Frontend

```solidity
// Allow frontend to decrypt
function allowFrontend(address user) external {
    FHE.allow(encryptedValue, user);
}

// User can now decrypt client-side
```

## ⚠️ Common Mistakes

### Mistake 1: No Access Control

```solidity
// ❌ CRITICAL SECURITY FLAW
function decrypt() external view returns (uint32) {
    return TFHE.decrypt(value);  // ANYONE can decrypt!
}
```

### Mistake 2: Decrypting in Constructor

```solidity
// ❌ WRONG: Can't decrypt during construction
constructor(euint32 encrypted) {
    uint32 plain = TFHE.decrypt(encrypted);  // Error!
}
```

### Mistake 3: Returning Decrypted from View

```solidity
// ⚠️ May run out of gas in view function
function get() external view returns (uint32) {
    return TFHE.decrypt(value);  // Gas issues possible
}
```

### Mistake 4: Not Logging Decryption

```solidity
// ⚠️ No audit trail
function decrypt() external view returns (uint32) {
    require(authorized[msg.sender]);
    return TFHE.decrypt(value);  // No event!
}

// ✅ Better: emit event
```

## 📊 Decryption Patterns Comparison

| Pattern | Security | Flexibility | Gas Cost | Use Case |
|---------|----------|-------------|----------|----------|
| Owner-Only | ⭐⭐⭐⭐⭐ | ⭐☆☆☆☆ | Low | Simple contracts |
| Permission Mapping | ⭐⭐⭐⭐☆ | ⭐⭐⭐☆☆ | Medium | Multi-user apps |
| Time-Based | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | Medium | Temporary access |
| Role-Based | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ | High | Complex orgs |
| Self-Decryption | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆ | Low | User data only |

## 🧪 Testing Your Knowledge

After completing this category, you should be able to:

- [ ] Implement secure access-controlled decryption
- [ ] Use owner-only decryption pattern
- [ ] Manage permission mappings
- [ ] Implement time-based access control
- [ ] Create role-based decryption
- [ ] Log decryption events for auditing
- [ ] Decrypt multiple values efficiently
- [ ] Avoid common decryption security pitfalls

## 🚀 Quick Start

```bash
cd decrypt-single
npm install
npm run test
```

## 📖 Additional Resources

- **Security Guide**: https://docs.zama.ai/fhevm/security
- **Decryption Best Practices**: https://docs.zama.ai/fhevm/guides/decrypt
- **Access Control**: See DEVELOPER_GUIDE.md
- **Tutorial**: HELLO_FHEVM_TUTORIAL.md (Part 5)

## ➡️ What's Next?

After mastering User Decryption:

1. **Access Control** - Advanced FHE.allow() patterns
2. **Anti-Patterns** - Learn what NOT to do
3. **Advanced Patterns** - Production applications

---

**Secure your encrypted data with proper access control!** 🔐

*Part of the FHEVM Example Hub*
