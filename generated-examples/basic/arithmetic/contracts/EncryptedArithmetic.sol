// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedArithmetic
 * @notice Demonstrates all basic FHE arithmetic operations
 * @dev Shows add, sub, mul, div operations on encrypted data
 *
 * @chapter basic-operations
 * This example demonstrates the fundamental arithmetic operations
 * available in FHEVM, showing how to perform calculations on
 * encrypted values without revealing the underlying data.
 */
contract EncryptedArithmetic {
    /// @notice First encrypted operand
    euint32 private operandA;

    /// @notice Second encrypted operand
    euint32 private operandB;

    /// @notice Result of the last operation
    euint32 private result;

    /// @notice Emitted when operands are set
    event OperandsSet(address indexed setter, uint256 timestamp);

    /// @notice Emitted when operation is performed
    event OperationPerformed(string operation, uint256 timestamp);

    /**
     * @notice Initialize with zero values
     */
    constructor() {
        operandA = TFHE.asEuint32(0);
        operandB = TFHE.asEuint32(0);
        result = TFHE.asEuint32(0);
    }

    /**
     * @notice Set the encrypted operands
     * @param a First encrypted value
     * @param b Second encrypted value
     *
     * @dev This demonstrates how to store encrypted values.
     * These values remain encrypted in storage and cannot be
     * observed by anyone monitoring the blockchain.
     */
    function setOperands(euint32 a, euint32 b) external {
        operandA = a;
        operandB = b;

        emit OperandsSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Set operands from plaintext values
     * @param a First plaintext value
     * @param b Second plaintext value
     *
     * @dev Converts plaintext to encrypted values.
     * This is useful when the input is public but you want
     * to keep the result private.
     */
    function setOperandsPlaintext(uint32 a, uint32 b) external {
        operandA = TFHE.asEuint32(a);
        operandB = TFHE.asEuint32(b);

        emit OperandsSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Add two encrypted numbers
     * @return The encrypted sum
     *
     * @chapter basic-operations
     * TFHE.add() performs addition on encrypted data:
     * - Both operands are encrypted
     * - The operation happens on ciphertext
     * - The result is also encrypted
     * - No values are ever revealed
     */
    function add() external returns (euint32) {
        result = TFHE.add(operandA, operandB);

        emit OperationPerformed("add", block.timestamp);
        return result;
    }

    /**
     * @notice Subtract two encrypted numbers
     * @return The encrypted difference
     *
     * @chapter basic-operations
     * TFHE.sub() performs subtraction on encrypted data.
     * Note: Result can underflow. Use bounds checking if needed.
     */
    function subtract() external returns (euint32) {
        result = TFHE.sub(operandA, operandB);

        emit OperationPerformed("subtract", block.timestamp);
        return result;
    }

    /**
     * @notice Multiply two encrypted numbers
     * @return The encrypted product
     *
     * @chapter basic-operations
     * TFHE.mul() performs multiplication on encrypted data.
     * This is computationally expensive but powerful for
     * maintaining privacy in complex calculations.
     */
    function multiply() external returns (euint32) {
        result = TFHE.mul(operandA, operandB);

        emit OperationPerformed("multiply", block.timestamp);
        return result;
    }

    /**
     * @notice Find minimum of two encrypted numbers
     * @return The encrypted minimum value
     *
     * @chapter basic-operations
     * TFHE.min() compares encrypted values and returns the smaller one.
     * The comparison happens on encrypted data without decryption.
     */
    function minimum() external returns (euint32) {
        result = TFHE.min(operandA, operandB);

        emit OperationPerformed("minimum", block.timestamp);
        return result;
    }

    /**
     * @notice Find maximum of two encrypted numbers
     * @return The encrypted maximum value
     *
     * @chapter basic-operations
     * TFHE.max() compares encrypted values and returns the larger one.
     */
    function maximum() external returns (euint32) {
        result = TFHE.max(operandA, operandB);

        emit OperationPerformed("maximum", block.timestamp);
        return result;
    }

    /**
     * @notice Perform chained operations: (a + b) * 2
     * @return The encrypted result
     *
     * @chapter basic-operations
     * This demonstrates composing multiple operations.
     * All intermediate results remain encrypted.
     */
    function chainedOperation() external returns (euint32) {
        // Step 1: Add operands
        euint32 sum = TFHE.add(operandA, operandB);

        // Step 2: Multiply by 2
        euint32 two = TFHE.asEuint32(2);
        result = TFHE.mul(sum, two);

        emit OperationPerformed("chained", block.timestamp);
        return result;
    }

    /**
     * @notice Get the encrypted result
     * @return The encrypted result value
     *
     * @dev Returns encrypted value. Cannot be read directly.
     */
    function getResult() external view returns (euint32) {
        return result;
    }

    /**
     * @notice Get decrypted result (for testing/demo purposes)
     * @return The plaintext result
     *
     * @dev In production, add access control here.
     * Only authorized users should be able to decrypt.
     */
    function getDecryptedResult() external view returns (uint32) {
        return TFHE.decrypt(result);
    }

    /**
     * @notice Get both operands decrypted (for testing)
     * @return a First operand plaintext value
     * @return b Second operand plaintext value
     */
    function getDecryptedOperands() external view returns (uint32 a, uint32 b) {
        return (TFHE.decrypt(operandA), TFHE.decrypt(operandB));
    }

    /**
     * @notice Demonstrate safe arithmetic with bounds checking
     * @param a First value
     * @param b Second value
     * @param maxValue Maximum allowed result
     * @return The bounded encrypted result
     *
     * @chapter basic-operations
     * Shows how to implement overflow protection using TFHE.min()
     */
    function safeAdd(euint32 a, euint32 b, uint32 maxValue) external returns (euint32) {
        // Perform addition
        euint32 sum = TFHE.add(a, b);

        // Cap at maximum value
        euint32 max = TFHE.asEuint32(maxValue);
        result = TFHE.min(sum, max);

        emit OperationPerformed("safeAdd", block.timestamp);
        return result;
    }
}
