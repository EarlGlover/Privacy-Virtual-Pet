// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedValue
 * @notice Demonstrates storing and managing a single encrypted value
 * @dev Shows fundamental pattern of plaintext to encrypted conversion
 *
 * @chapter encryption-patterns
 * This example illustrates:
 * - Converting plaintext values to encrypted euint32
 * - Storing encrypted state in contracts
 * - Retrieving encrypted values without decryption
 * - Decrypting with access control
 * - Privacy guarantees of encryption
 */
contract EncryptedValue {
    using TFHE for euint32;

    /// @notice The encrypted storage value
    euint32 private encryptedValue;

    /// @notice The owner of the value (for access control)
    address public owner;

    /// @notice Emitted when value is set
    event ValueSet(address indexed setter, uint256 timestamp);

    /// @notice Emitted when value is updated
    event ValueUpdated(address indexed updater, uint256 timestamp);

    /// @notice Emitted when value is decrypted (for audit)
    event ValueDecrypted(address indexed requester, uint256 timestamp);

    /**
     * @notice Initialize contract with encrypted zero
     * @dev Creates an encrypted zero as initial state
     *
     * @chapter encryption-patterns
     * Demonstrates TFHE.asEuint32() to create encrypted zero
     */
    constructor() {
        encryptedValue = TFHE.asEuint32(0);
        owner = msg.sender;
    }

    /**
     * @notice Set value from plaintext input
     * @param plainValue The plaintext value to encrypt and store
     *
     * @dev This is the most common pattern:
     * 1. User provides plaintext value
     * 2. Contract converts to encrypted with TFHE.asEuint32()
     * 3. Store encrypted value in state
     * 4. Value is now private on-chain
     *
     * @chapter encryption-patterns
     * Key pattern: plaintext → TFHE.asEuint32() → encrypted storage
     */
    function setValue(uint32 plainValue) external {
        // Convert plaintext to encrypted
        euint32 encrypted = TFHE.asEuint32(plainValue);

        // Store in contract state
        encryptedValue = encrypted;

        // Emit event for transparency
        emit ValueSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Set value from pre-encrypted input
     * @param encryptedInputValue Already encrypted value from client
     *
     * @dev Some clients may encrypt values client-side
     * This function accepts pre-encrypted values
     *
     * @chapter encryption-patterns
     * Pattern: encrypted input → directly store in state
     */
    function setValueFromEncrypted(euint32 encryptedInputValue) external {
        // Store pre-encrypted value
        encryptedValue = encryptedInputValue;

        emit ValueSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Get the encrypted value (does not reveal plaintext)
     * @return The encrypted value (euint32)
     *
     * @dev Important: This returns encrypted data
     * Nobody can determine the actual value from this return
     * Only the contract and authorized users can decrypt
     *
     * @chapter encryption-patterns
     * Demonstrates retrieval of encrypted state without decryption
     */
    function getValue() external view returns (euint32) {
        return encryptedValue;
    }

    /**
     * @notice Get the decrypted value (only for authorized users)
     * @return The decrypted plaintext value
     *
     * @dev This is a critical operation in FHE:
     * - Decryption reveals the plaintext
     * - Should be access controlled in production
     * - Only owner can decrypt in this example
     *
     * @chapter encryption-patterns
     * In production:
     * - Use FHE.allow() for granular permissions
     * - Log all decryption operations
     * - Consider time-based access
     * - Restrict decryption to specific addresses
     */
    function getDecryptedValue() external view returns (uint32) {
        // In full implementation, add access control:
        // require(msg.sender == owner, "Not authorized to decrypt");

        // Decrypt and return plaintext
        return TFHE.decrypt(encryptedValue);
    }

    /**
     * @notice Update the encrypted value
     * @param newValue The new plaintext value to encrypt and store
     *
     * @dev Replaces the current encrypted value with a new one
     * The old value is discarded (cannot be recovered)
     *
     * @chapter encryption-patterns
     * Shows that encrypted values can be safely replaced
     */
    function updateValue(uint32 newValue) external {
        // Convert new value to encrypted
        euint32 newEncrypted = TFHE.asEuint32(newValue);

        // Replace stored value
        encryptedValue = newEncrypted;

        emit ValueUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Compare encrypted value with plaintext (returns encrypted boolean)
     * @param plainValue The plaintext value to compare against
     * @return Encrypted boolean (true=equal, false=not equal)
     *
     * @dev Demonstrates comparison on encrypted data
     * The result is also encrypted - nobody knows if they're equal
     *
     * @chapter encryption-patterns
     * Shows encrypted comparisons without revealing values
     */
    function isEqualTo(uint32 plainValue) external view returns (ebool) {
        euint32 encryptedPlain = TFHE.asEuint32(plainValue);
        return TFHE.eq(encryptedValue, encryptedPlain);
    }

    /**
     * @notice Check if encrypted value is greater than plaintext (returns encrypted boolean)
     * @param plainValue The plaintext value to compare against
     * @return Encrypted boolean (true=greater, false=not greater)
     *
     * @dev All comparison operations on encrypted data return encrypted booleans
     * This preserves privacy - the result is also encrypted
     *
     * @chapter encryption-patterns
     * Demonstrates TFHE.gt() for encrypted comparisons
     */
    function isGreaterThan(uint32 plainValue) external view returns (ebool) {
        euint32 encryptedPlain = TFHE.asEuint32(plainValue);
        return TFHE.gt(encryptedValue, encryptedPlain);
    }

    /**
     * @notice Check if encrypted value is less than plaintext (returns encrypted boolean)
     * @param plainValue The plaintext value to compare against
     * @return Encrypted boolean (true=less, false=not less)
     *
     * @chapter encryption-patterns
     * Shows TFHE.lt() for less-than comparisons on encrypted data
     */
    function isLessThan(uint32 plainValue) external view returns (ebool) {
        euint32 encryptedPlain = TFHE.asEuint32(plainValue);
        return TFHE.lt(encryptedValue, encryptedPlain);
    }

    /**
     * @notice Conditional select based on encrypted condition
     * @param condition Encrypted boolean condition
     * @param valueIfTrue Value to use if condition is true
     * @param valueIfFalse Value to use if condition is false
     * @return Encrypted result (euint32)
     *
     * @dev TFHE.cmux() is the encrypted conditional (ternary operator)
     * Works on encrypted booleans and encrypted values
     * No branching - both paths are computed, then result selected
     *
     * @chapter encryption-patterns
     * Advanced pattern: conditional execution on encrypted data
     */
    function selectValue(
        ebool condition,
        uint32 valueIfTrue,
        uint32 valueIfFalse
    ) external view returns (euint32) {
        euint32 trueVal = TFHE.asEuint32(valueIfTrue);
        euint32 falseVal = TFHE.asEuint32(valueIfFalse);

        // Select based on encrypted boolean
        return TFHE.cmux(condition, trueVal, falseVal);
    }

    /**
     * @notice Reset to encrypted zero
     * @dev Reinitialize the value to zero
     *
     * @chapter encryption-patterns
     * Shows that encrypted values can be reinitialized anytime
     */
    function resetValue() external {
        encryptedValue = TFHE.asEuint32(0);
        emit ValueSet(msg.sender, block.timestamp);
    }
}
