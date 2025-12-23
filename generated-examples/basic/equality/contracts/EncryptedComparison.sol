// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedComparison
 * @notice Demonstrates encrypted comparison operations (eq, ne, gt, lt, gte, lte)
 * @dev Shows how to compare encrypted values without revealing them
 *
 * @chapter comparison-operations
 * This example demonstrates how to perform comparisons on encrypted data.
 * Comparisons return encrypted boolean results (ebool), maintaining privacy
 * throughout the entire operation.
 */
contract EncryptedComparison {
    /// @notice First encrypted value for comparison
    euint32 private valueA;

    /// @notice Second encrypted value for comparison
    euint32 private valueB;

    /// @notice Result of last comparison (encrypted boolean)
    ebool private comparisonResult;

    /// @notice Emitted when values are set
    event ValuesSet(address indexed setter, uint256 timestamp);

    /// @notice Emitted when comparison is performed
    event ComparisonPerformed(string operation, uint256 timestamp);

    constructor() {
        valueA = TFHE.asEuint32(0);
        valueB = TFHE.asEuint32(0);
        comparisonResult = TFHE.asEbool(false);
    }

    /**
     * @notice Set values from plaintext
     * @param a First value
     * @param b Second value
     */
    function setValues(uint32 a, uint32 b) external {
        valueA = TFHE.asEuint32(a);
        valueB = TFHE.asEuint32(b);

        emit ValuesSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Set encrypted values directly
     * @param a First encrypted value
     * @param b Second encrypted value
     */
    function setEncryptedValues(euint32 a, euint32 b) external {
        valueA = a;
        valueB = b;

        emit ValuesSet(msg.sender, block.timestamp);
    }

    /**
     * @notice Check if two encrypted values are equal
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.eq() performs equality comparison on encrypted data:
     * - Both operands are encrypted
     * - The result is an encrypted boolean (ebool)
     * - The actual comparison result remains hidden
     * - Only authorized parties can decrypt the result
     */
    function isEqual() external returns (ebool) {
        comparisonResult = TFHE.eq(valueA, valueB);

        emit ComparisonPerformed("equal", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if two encrypted values are not equal
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.ne() checks inequality on encrypted values
     */
    function isNotEqual() external returns (ebool) {
        comparisonResult = TFHE.ne(valueA, valueB);

        emit ComparisonPerformed("notEqual", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if valueA > valueB
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.gt() performs greater-than comparison on encrypted data
     */
    function isGreaterThan() external returns (ebool) {
        comparisonResult = TFHE.gt(valueA, valueB);

        emit ComparisonPerformed("greaterThan", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if valueA >= valueB
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.gte() performs greater-than-or-equal comparison
     */
    function isGreaterThanOrEqual() external returns (ebool) {
        comparisonResult = TFHE.gte(valueA, valueB);

        emit ComparisonPerformed("greaterThanOrEqual", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if valueA < valueB
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.lt() performs less-than comparison on encrypted data
     */
    function isLessThan() external returns (ebool) {
        comparisonResult = TFHE.lt(valueA, valueB);

        emit ComparisonPerformed("lessThan", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if valueA <= valueB
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * TFHE.lte() performs less-than-or-equal comparison
     */
    function isLessThanOrEqual() external returns (ebool) {
        comparisonResult = TFHE.lte(valueA, valueB);

        emit ComparisonPerformed("lessThanOrEqual", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if value is within range [min, max]
     * @param value Value to check
     * @param min Minimum value
     * @param max Maximum value
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * Demonstrates combining multiple comparisons using TFHE.and()
     * This pattern is useful for range checking in encrypted contexts.
     */
    function isInRange(euint32 value, uint32 min, uint32 max) external returns (ebool) {
        // Check if value >= min
        ebool aboveMin = TFHE.gte(value, TFHE.asEuint32(min));

        // Check if value <= max
        ebool belowMax = TFHE.lte(value, TFHE.asEuint32(max));

        // Combine: value >= min AND value <= max
        comparisonResult = TFHE.and(aboveMin, belowMax);

        emit ComparisonPerformed("inRange", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Check if value is outside range (value < min OR value > max)
     * @param value Value to check
     * @param min Minimum value
     * @param max Maximum value
     * @return Encrypted boolean result
     *
     * @chapter comparison-operations
     * Demonstrates using TFHE.or() for combining conditions
     */
    function isOutsideRange(euint32 value, uint32 min, uint32 max) external returns (ebool) {
        // Check if value < min
        ebool belowMin = TFHE.lt(value, TFHE.asEuint32(min));

        // Check if value > max
        ebool aboveMax = TFHE.gt(value, TFHE.asEuint32(max));

        // Combine: value < min OR value > max
        comparisonResult = TFHE.or(belowMin, aboveMax);

        emit ComparisonPerformed("outsideRange", block.timestamp);
        return comparisonResult;
    }

    /**
     * @notice Select one of two values based on encrypted condition
     * @param condition Encrypted boolean condition
     * @param trueValue Value to return if condition is true
     * @param falseValue Value to return if condition is false
     * @return Selected encrypted value
     *
     * @chapter comparison-operations
     * TFHE.select() is the encrypted equivalent of a ternary operator.
     * This is crucial for implementing conditional logic on encrypted data.
     *
     * Example: TFHE.select(condition, a, b) is like: condition ? a : b
     */
    function selectValue(
        ebool condition,
        uint32 trueValue,
        uint32 falseValue
    ) external pure returns (euint32) {
        return TFHE.select(
            condition,
            TFHE.asEuint32(trueValue),
            TFHE.asEuint32(falseValue)
        );
    }

    /**
     * @notice Get the encrypted comparison result
     * @return Encrypted boolean result
     */
    function getComparisonResult() external view returns (ebool) {
        return comparisonResult;
    }

    /**
     * @notice Get decrypted comparison result (for testing)
     * @return Plaintext boolean result
     *
     * @dev In production, add access control here
     */
    function getDecryptedResult() external view returns (bool) {
        return TFHE.decrypt(comparisonResult);
    }

    /**
     * @notice Get both values decrypted (for testing)
     * @return a First value
     * @return b Second value
     */
    function getDecryptedValues() external view returns (uint32 a, uint32 b) {
        return (TFHE.decrypt(valueA), TFHE.decrypt(valueB));
    }

    /**
     * @notice Demonstrate conditional update using select
     * @param threshold Threshold value
     * @param increment Value to add if below threshold
     *
     * @chapter comparison-operations
     * Shows how to implement "if-then-else" logic on encrypted data
     */
    function conditionalIncrement(uint32 threshold, uint32 increment) external {
        // Check if valueA < threshold
        ebool needsIncrement = TFHE.lt(valueA, TFHE.asEuint32(threshold));

        // If true, add increment; if false, keep current value
        euint32 incrementValue = TFHE.asEuint32(increment);
        euint32 newValue = TFHE.add(valueA, incrementValue);

        valueA = TFHE.select(needsIncrement, newValue, valueA);

        emit ComparisonPerformed("conditionalIncrement", block.timestamp);
    }
}
