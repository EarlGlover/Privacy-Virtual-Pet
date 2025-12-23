// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title SecretValue
 * @notice Demonstrates secure, access-controlled decryption of encrypted values
 * @dev Shows patterns for implementing granular permission management for decryption
 *
 * @chapter user-decryption
 * This example illustrates:
 * - Encrypting and storing sensitive values
 * - Access-controlled decryption with authorization checks
 * - Permission management with whitelisting
 * - Secure patterns to prevent unauthorized data access
 * - Event logging for audit trails
 */
contract SecretValue {
    using TFHE for euint32;
    using TFHE for ebool;

    /// @notice The encrypted secret value
    euint32 private secretValue;

    /// @notice Owner of the secret
    address private owner;

    /// @notice Whitelist of addresses authorized to decrypt
    mapping(address => bool) private authorized;

    /// @notice Emitted when secret value is set
    event SecretSet(address indexed setter, uint256 timestamp);

    /// @notice Emitted when someone attempts to decrypt
    event DecryptionAttempted(address indexed requester, bool authorized, uint256 timestamp);

    /// @notice Emitted when decryption permission is granted
    event PermissionGranted(address indexed recipient, uint256 timestamp);

    /// @notice Emitted when decryption permission is revoked
    event PermissionRevoked(address indexed recipient, uint256 timestamp);

    /**
     * @notice Initialize contract with owner
     *
     * @chapter user-decryption
     * Pattern: Set owner during initialization
     */
    constructor() {
        owner = msg.sender;
        authorized[msg.sender] = true;
    }

    /**
     * @notice Set the secret value (owner only)
     * @param plainValue The plaintext value to encrypt and store
     *
     * @dev Encryption pattern:
     * 1. Receive plaintext value
     * 2. Encrypt using TFHE.asEuint32()
     * 3. Store encrypted value
     * 4. Encrypted value is unreadable without key
     *
     * @chapter user-decryption
     * Critical: Only owner can set the secret
     */
    function setValue(uint32 plainValue) external {
        require(msg.sender == owner, "Only owner can set secret");

        // Encrypt the value
        secretValue = TFHE.asEuint32(plainValue);

        emit SecretSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Get encrypted value (anyone can call)
     * @return Encrypted value handle (unreadable)
     *
     * @dev Pattern: Public encryption status doesn't compromise privacy
     * The encrypted handle is useless without the decryption key
     *
     * @chapter user-decryption
     * Anyone can see that a value exists, but can't read it
     */
    function getEncryptedValue() external view returns (euint32) {
        return secretValue;
    }

    /**
     * @notice Get decrypted value (authorized only)
     * @return Decrypted plaintext value
     *
     * @dev Access control pattern:
     * 1. Check if caller is authorized
     * 2. Decrypt only if authorized
     * 3. Return plaintext value
     * 4. Log the decryption attempt
     *
     * @chapter user-decryption
     * CRITICAL: Decryption must include proper authorization checks
     * Never decrypt without verifying permissions
     */
    function getDecryptedValue() external returns (uint32) {
        // Check if caller is authorized
        bool isAuthorized = authorized[msg.sender];

        // Log decryption attempt for audit trail
        emit DecryptionAttempted(msg.sender, isAuthorized, block.timestamp);

        // Only decrypt if authorized
        require(isAuthorized, "Not authorized to decrypt");

        // Decrypt and return
        return TFHE.decrypt(secretValue);
    }

    /**
     * @notice Check if an address is authorized (owner only)
     * @param addr The address to check
     * @return Whether the address is authorized
     *
     * @chapter user-decryption
     * Pattern: Expose authorization status to authorized parties
     */
    function isAuthorized(address addr) external view returns (bool) {
        require(msg.sender == owner, "Only owner can check authorization");
        return authorized[addr];
    }

    /**
     * @notice Grant decryption permission to an address (owner only)
     * @param user The address to authorize
     *
     * @dev Permission management pattern:
     * - Owner explicitly grants permissions
     * - Emit event for audit trail
     * - Support revoking permissions later
     *
     * @chapter user-decryption
     * Pattern: Granular permission control
     */
    function grantDecryptionPermission(address user) external {
        require(msg.sender == owner, "Only owner can grant permissions");
        require(user != address(0), "Invalid address");
        require(!authorized[user], "Already authorized");

        authorized[user] = true;
        emit PermissionGranted(user, block.timestamp);
    }

    /**
     * @notice Revoke decryption permission from an address (owner only)
     * @param user The address to revoke permission from
     *
     * @dev Pattern: Remove access when no longer needed
     *
     * @chapter user-decryption
     * Support revoking permissions at any time
     */
    function revokeDecryptionPermission(address user) external {
        require(msg.sender == owner, "Only owner can revoke permissions");
        require(authorized[user], "Not authorized");

        authorized[user] = false;
        emit PermissionRevoked(user, block.timestamp);
    }

    /**
     * @notice Decrypt for a specific authorized user
     * @param user The address requesting decryption
     * @return Decrypted value
     *
     * @dev Alternative pattern: Decryption via owner
     * Owner can decrypt on behalf of authorized users
     *
     * @chapter user-decryption
     * Pattern: Owner-delegated decryption
     */
    function getDecryptedFor(address user) external returns (uint32) {
        require(msg.sender == owner, "Only owner can decrypt for others");
        require(authorized[user], "User not authorized");
        require(user != address(0), "Invalid address");

        // Emit event for audit
        emit DecryptionAttempted(user, true, block.timestamp);

        return TFHE.decrypt(secretValue);
    }

    /**
     * @notice Perform encrypted comparison with secret
     * @param otherValue Value to compare against
     * @return Encrypted boolean (true if secret > other)
     *
     * @dev Pattern: Computation on encrypted data
     * Can perform operations without decrypting
     *
     * @chapter user-decryption
     * Demonstrates encrypted comparison
     */
    function isGreaterThan(uint32 otherValue) external view returns (ebool) {
        return TFHE.gt(
            secretValue,
            TFHE.asEuint32(otherValue)
        );
    }

    /**
     * @notice Perform encrypted equality check with secret
     * @param otherValue Value to compare against
     * @return Encrypted boolean (true if equal)
     *
     * @chapter user-decryption
     * Encrypted comparison without decryption
     */
    function isEqual(uint32 otherValue) external view returns (ebool) {
        return TFHE.eq(
            secretValue,
            TFHE.asEuint32(otherValue)
        );
    }

    /**
     * @notice Verify caller is owner
     * @return True if caller is owner
     *
     * @chapter user-decryption
     * Helper function
     */
    function getOwner() external view returns (address) {
        return owner;
    }
}
