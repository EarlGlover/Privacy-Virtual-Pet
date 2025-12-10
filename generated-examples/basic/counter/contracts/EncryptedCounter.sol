// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedCounter
 * @notice A simple encrypted counter demonstrating FHE arithmetic operations
 * @dev Demonstrates how to perform arithmetic on encrypted data
 *
 * @chapter arithmetic-operations
 * This example shows the fundamental pattern of maintaining private state
 * while allowing the contract to perform computations on encrypted values.
 */
contract EncryptedCounter {
    using TFHE for euint32;

    /// @notice The encrypted counter value
    euint32 private count;

    /// @notice Emitted when counter is incremented
    event Incremented(address indexed operator, uint256 timestamp);

    /// @notice Emitted when counter is decremented
    event Decremented(address indexed operator, uint256 timestamp);

    /// @notice Emitted when counter is reset
    event Reset(address indexed operator, uint256 timestamp);

    /**
     * @notice Initialize counter at zero
     * @dev Creates an encrypted zero value
     */
    constructor() {
        count = TFHE.asEuint32(0);
    }

    /**
     * @notice Increment counter by a specified encrypted value
     * @param value The amount to increment (as encrypted euint32)
     *
     * @dev This demonstrates encrypted addition:
     * - The current counter value is encrypted
     * - The increment value is encrypted
     * - The addition happens on encrypted data
     * - The result remains encrypted
     * - The actual values are never exposed
     */
    function increment(euint32 value) external {
        // Encrypted arithmetic: count + value (all operations on encrypted data)
        count = TFHE.add(count, value);

        // Optional: cap at maximum (demonstrated as common pattern)
        count = TFHE.min(count, TFHE.asEuint32(type(uint32).max));

        emit Incremented(msg.sender, block.timestamp);
    }

    /**
     * @notice Decrement counter by a specified encrypted value
     * @param value The amount to decrement (as encrypted euint32)
     *
     * @dev This demonstrates encrypted subtraction with bounds:
     * - Subtracts encrypted value from encrypted counter
     * - Ensures result never goes below zero
     * - Uses encrypted max operation for safety
     */
    function decrement(euint32 value) external {
        // Encrypted arithmetic: count - value
        count = TFHE.sub(count, value);

        // Prevent underflow: ensure minimum of 0
        // This is a common pattern in FHE to maintain invariants
        count = TFHE.max(count, TFHE.asEuint32(0));

        emit Decremented(msg.sender, block.timestamp);
    }

    /**
     * @notice Get the encrypted counter value
     * @return The encrypted counter (euint32)
     *
     * @dev Note: This returns an encrypted value.
     * The actual counter value cannot be determined from this return value.
     * Only the contract (and authorized users) can decrypt this value.
     */
    function getCount() external view returns (euint32) {
        return count;
    }

    /**
     * @notice Decrypted counter value (only callable by authorized users)
     * @return The decrypted counter value
     *
     * @dev In a full implementation, this would include access control.
     * For this example, decryption is allowed (educational purposes).
     * Production contracts should implement proper access control.
     *
     * @chapter arithmetic-operations
     * Decryption is a critical operation:
     * - Only authorized parties should be able to decrypt
     * - Use FHE.allow() to grant decryption permissions
     * - Keep decryption operations minimal and secure
     */
    function getDecryptedCount() external view returns (uint32) {
        return TFHE.decrypt(count);
    }

    /**
     * @notice Reset counter to zero
     * @dev Useful for testing and demonstration purposes
     *
     * @chapter arithmetic-operations
     * This shows that we can reinitialize encrypted values
     * at any time during the contract's lifetime.
     */
    function reset() external {
        count = TFHE.asEuint32(0);
        emit Reset(msg.sender, block.timestamp);
    }

    /**
     * @notice Add a plaintext value to the encrypted counter
     * @param plainValue The plaintext value to add
     *
     * @dev Demonstrates converting plaintext to encrypted and performing arithmetic
     * This is a common pattern when taking user input.
     */
    function incrementByPlaintext(uint32 plainValue) external {
        // Convert plaintext to encrypted
        euint32 encryptedValue = TFHE.asEuint32(plainValue);

        // Perform encrypted arithmetic
        count = TFHE.add(count, encryptedValue);

        emit Incremented(msg.sender, block.timestamp);
    }

    /**
     * @notice Subtract a plaintext value from the encrypted counter
     * @param plainValue The plaintext value to subtract
     *
     * @dev Shows mixing plaintext and encrypted values in arithmetic
     */
    function decrementByPlaintext(uint32 plainValue) external {
        euint32 encryptedValue = TFHE.asEuint32(plainValue);
        count = TFHE.sub(count, encryptedValue);
        count = TFHE.max(count, TFHE.asEuint32(0));

        emit Decremented(msg.sender, block.timestamp);
    }
}
