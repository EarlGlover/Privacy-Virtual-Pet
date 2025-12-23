// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title AccessControlExample
 * @notice Demonstrates FHE.allow() and FHE.allowThis() patterns
 * @dev Shows how to grant decryption permissions for encrypted data
 *
 * @chapter access-control
 * Access control is CRITICAL in FHEVM. Without proper permissions,
 * users cannot decrypt their data. This example shows the correct
 * patterns for managing decryption access.
 *
 * Key Concepts:
 * - FHE.allow(handle, address) - Grant decryption permission to an address
 * - FHE.allowThis(handle) - Grant permission to the contract itself
 * - Permissions must be granted after every state change
 */
contract AccessControlExample {
    /// @notice User balances (encrypted)
    mapping(address => euint32) private balances;

    /// @notice Emitted when balance is updated
    event BalanceUpdated(address indexed user, uint256 timestamp);

    /**
     * @notice Deposit funds (increase encrypted balance)
     * @param amount Amount to deposit (plaintext)
     *
     * @chapter access-control
     * This function demonstrates the CORRECT pattern:
     * 1. Perform encrypted operation
     * 2. Grant permission to contract (FHE.allowThis)
     * 3. Grant permission to user (FHE.allow)
     *
     * Without these permissions, the user cannot decrypt their balance!
     */
    function deposit(uint32 amount) external {
        // Get current balance
        euint32 currentBalance = balances[msg.sender];

        // Add deposit amount (encrypted)
        euint32 newBalance = TFHE.add(
            currentBalance,
            TFHE.asEuint32(amount)
        );

        // Update storage
        balances[msg.sender] = newBalance;

        // ⚠️ CRITICAL: Grant permissions after state change
        // Allow contract to read the balance
        TFHE.allowThis(newBalance);

        // Allow user to decrypt their balance
        TFHE.allow(newBalance, msg.sender);

        emit BalanceUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Transfer funds to another user
     * @param to Recipient address
     * @param amount Amount to transfer (plaintext)
     *
     * @chapter access-control
     * When updating multiple encrypted values, grant permissions
     * to all relevant parties:
     * - Sender needs permission for their new balance
     * - Recipient needs permission for their new balance
     * - Contract needs permission for both
     */
    function transfer(address to, uint32 amount) external {
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");

        // Get balances
        euint32 senderBalance = balances[msg.sender];
        euint32 recipientBalance = balances[to];

        // Convert amount to encrypted
        euint32 encryptedAmount = TFHE.asEuint32(amount);

        // Update balances
        euint32 newSenderBalance = TFHE.sub(senderBalance, encryptedAmount);
        euint32 newRecipientBalance = TFHE.add(recipientBalance, encryptedAmount);

        // Store new balances
        balances[msg.sender] = newSenderBalance;
        balances[to] = newRecipientBalance;

        // ⚠️ CRITICAL: Grant permissions for sender
        TFHE.allowThis(newSenderBalance);
        TFHE.allow(newSenderBalance, msg.sender);

        // ⚠️ CRITICAL: Grant permissions for recipient
        TFHE.allowThis(newRecipientBalance);
        TFHE.allow(newRecipientBalance, to);

        emit BalanceUpdated(msg.sender, block.timestamp);
        emit BalanceUpdated(to, block.timestamp);
    }

    /**
     * @notice Get encrypted balance
     * @param user User address
     * @return Encrypted balance
     *
     * @chapter access-control
     * View functions return encrypted handles.
     * The caller can only decrypt if they have permission.
     */
    function getBalance(address user) external view returns (euint32) {
        return balances[user];
    }

    /**
     * @notice Get decrypted balance
     * @return Plaintext balance
     *
     * @chapter access-control
     * Decryption should only be allowed for:
     * 1. The owner of the data
     * 2. Addresses explicitly granted permission
     *
     * This example allows users to decrypt their own balance.
     */
    function getDecryptedBalance() external view returns (uint32) {
        // Only allow users to decrypt their own balance
        return TFHE.decrypt(balances[msg.sender]);
    }

    /**
     * @notice Grant permission to another address to view balance
     * @param viewer Address to grant permission to
     *
     * @chapter access-control
     * Demonstrates explicit permission granting.
     * The balance owner can allow others to decrypt their balance.
     */
    function grantViewPermission(address viewer) external {
        require(viewer != address(0), "Invalid viewer");

        euint32 balance = balances[msg.sender];

        // Grant permission to the viewer
        TFHE.allow(balance, viewer);
    }

    /**
     * @notice Withdraw all funds
     *
     * @chapter access-control
     * When resetting encrypted values, still grant permissions
     * for the new (zero) value.
     */
    function withdrawAll() external {
        // Set balance to zero
        euint32 zero = TFHE.asEuint32(0);
        balances[msg.sender] = zero;

        // Grant permissions even for zero value
        TFHE.allowThis(zero);
        TFHE.allow(zero, msg.sender);

        emit BalanceUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Demonstrate incorrect pattern (commented out)
     *
     * @chapter access-control
     * ❌ ANTI-PATTERN: This would fail because no permissions are granted
     *
     * function depositIncorrect(uint32 amount) external {
     *     euint32 currentBalance = balances[msg.sender];
     *     euint32 newBalance = TFHE.add(currentBalance, TFHE.asEuint32(amount));
     *     balances[msg.sender] = newBalance;
     *     // ❌ Missing: TFHE.allowThis(newBalance);
     *     // ❌ Missing: TFHE.allow(newBalance, msg.sender);
     *     // Result: User cannot decrypt their balance!
     * }
     */

    /**
     * @notice Check if user has sufficient balance
     * @param amount Amount to check
     * @return Encrypted boolean result
     *
     * @chapter access-control
     * When returning encrypted booleans, grant permissions too
     */
    function hasSufficientBalance(uint32 amount) external returns (ebool) {
        euint32 balance = balances[msg.sender];
        euint32 requiredAmount = TFHE.asEuint32(amount);

        // Check if balance >= amount
        ebool hasEnough = TFHE.gte(balance, requiredAmount);

        // Grant permission to contract and user
        TFHE.allowThis(hasEnough);
        TFHE.allow(hasEnough, msg.sender);

        return hasEnough;
    }
}
