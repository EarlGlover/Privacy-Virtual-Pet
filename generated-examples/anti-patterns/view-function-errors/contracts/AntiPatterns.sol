// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title AntiPatterns
 * @notice Demonstrates common mistakes and how to avoid them
 * @dev Educational contract showing WRONG patterns and their fixes
 *
 * @chapter anti-patterns
 * This contract demonstrates common mistakes developers make when
 * working with FHEVM, and shows the correct patterns.
 *
 * ⚠️ The "bad" examples are commented out to prevent compilation errors.
 * Study them to understand what NOT to do!
 */
contract AntiPatterns {
    /// @notice User balances
    mapping(address => euint32) private balances;

    /// @notice Public counter (for demonstration)
    uint32 public counter;

    /**
     * ❌ ANTI-PATTERN #1: Decrypting in View Functions
     *
     * @chapter anti-patterns
     * Problem: View functions cannot decrypt because decryption
     * requires transaction execution and state changes.
     *
     * This will FAIL:
     * function getBalanceBad() external view returns (uint32) {
     *     return TFHE.decrypt(balances[msg.sender]); // ❌ ERROR!
     * }
     *
     * Why it fails:
     * - Decryption requires async operations
     * - View functions cannot modify state
     * - Would expose encrypted data to everyone
     */

    /**
     * ✅ CORRECT: Return Encrypted Handle
     *
     * @chapter anti-patterns
     * Solution: Return the encrypted handle, let the user decrypt client-side
     */
    function getBalanceCorrect() external view returns (euint32) {
        return balances[msg.sender]; // ✅ Return encrypted
    }

    /**
     * ❌ ANTI-PATTERN #2: Missing FHE.allow() Permissions
     *
     * @chapter anti-patterns
     * Problem: User cannot decrypt their data without permissions!
     *
     * This is WRONG:
     * function depositBad(uint32 amount) external {
     *     euint32 encrypted = TFHE.asEuint32(amount);
     *     balances[msg.sender] = TFHE.add(balances[msg.sender], encrypted);
     *     // ❌ Missing: TFHE.allowThis() and TFHE.allow()
     *     // Result: User cannot access their balance!
     * }
     */

    /**
     * ✅ CORRECT: Always Grant Permissions
     *
     * @chapter anti-patterns
     * Solution: Grant permissions after every state change
     */
    function depositCorrect(uint32 amount) external {
        euint32 encrypted = TFHE.asEuint32(amount);
        euint32 newBalance = TFHE.add(balances[msg.sender], encrypted);
        balances[msg.sender] = newBalance;

        // ✅ Grant permissions
        TFHE.allowThis(newBalance);
        TFHE.allow(newBalance, msg.sender);
    }

    /**
     * ❌ ANTI-PATTERN #3: Accepting Encrypted Input Without Proof
     *
     * @chapter anti-patterns
     * Problem: No validation of encrypted input, vulnerable to attacks!
     *
     * This is INSECURE:
     * function depositInsecure(euint32 amount) external {
     *     balances[msg.sender] = TFHE.add(balances[msg.sender], amount);
     *     // ❌ No proof! User could submit malicious data
     * }
     */

    /**
     * ✅ CORRECT: Always Use Input Proofs
     *
     * @chapter anti-patterns
     * Solution: Require input proof for all user-provided encrypted data
     */
    function depositSecure(
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        // ✅ Validate with proof
        euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);

        euint32 newBalance = TFHE.add(balances[msg.sender], amount);
        balances[msg.sender] = newBalance;

        TFHE.allowThis(newBalance);
        TFHE.allow(newBalance, msg.sender);
    }

    /**
     * ❌ ANTI-PATTERN #4: Mixing Encrypted and Plaintext in Wrong Places
     *
     * @chapter anti-patterns
     * Problem: Trying to use encrypted values in plaintext contexts
     *
     * This will FAIL:
     * function badComparison() external view returns (bool) {
     *     euint32 balance = balances[msg.sender];
     *     return balance > 100; // ❌ Cannot compare encrypted to plaintext!
     * }
     */

    /**
     * ✅ CORRECT: Use FHE Operations for Encrypted Values
     *
     * @chapter anti-patterns
     * Solution: Use TFHE comparison functions
     */
    function correctComparison() external view returns (ebool) {
        euint32 balance = balances[msg.sender];
        euint32 threshold = TFHE.asEuint32(100);

        // ✅ Use TFHE.gt() for encrypted comparison
        return TFHE.gt(balance, threshold);
    }

    /**
     * ❌ ANTI-PATTERN #5: Forgetting allowThis() for Contract Operations
     *
     * @chapter anti-patterns
     * Problem: Contract cannot perform future operations on the value
     *
     * This causes issues:
     * function updateBad(uint32 amount) external {
     *     euint32 newBalance = TFHE.asEuint32(amount);
     *     balances[msg.sender] = newBalance;
     *     TFHE.allow(newBalance, msg.sender); // User can decrypt
     *     // ❌ Missing: TFHE.allowThis(newBalance);
     *     // Contract might not be able to use this value later!
     * }
     */

    /**
     * ✅ CORRECT: Always Grant Contract Permission Too
     *
     * @chapter anti-patterns
     * Solution: Grant both allowThis and allow
     */
    function updateCorrect(uint32 amount) external {
        euint32 newBalance = TFHE.asEuint32(amount);
        balances[msg.sender] = newBalance;

        // ✅ Grant permissions in correct order
        TFHE.allowThis(newBalance);      // Contract first
        TFHE.allow(newBalance, msg.sender); // Then user
    }

    /**
     * ❌ ANTI-PATTERN #6: Exposing Encrypted Data Through Events
     *
     * @chapter anti-patterns
     * Problem: Events with encrypted data expose the values
     *
     * This defeats privacy:
     * event BadEvent(uint32 amount); // ❌ If amount was encrypted
     *
     * function emitBad(euint32 amount) external {
     *     emit BadEvent(TFHE.decrypt(amount)); // ❌ Leaks private data!
     * }
     */

    /**
     * ✅ CORRECT: Emit Only Public Information
     *
     * @chapter anti-patterns
     * Solution: Only emit public data or encrypted handles
     */
    event GoodEvent(address indexed user, uint256 timestamp);

    function emitGood() external {
        // ✅ Only emit public information
        emit GoodEvent(msg.sender, block.timestamp);
    }

    /**
     * ❌ ANTI-PATTERN #7: Reusing Input Proofs
     *
     * @chapter anti-patterns
     * Problem: Each encrypted input needs its own proof!
     *
     * This is WRONG:
     * function processTwo(
     *     einput input1,
     *     einput input2,
     *     bytes calldata proof // ❌ Only one proof!
     * ) external {
     *     euint32 val1 = TFHE.asEuint32(input1, proof);
     *     euint32 val2 = TFHE.asEuint32(input2, proof); // ❌ Reusing proof!
     * }
     */

    /**
     * ✅ CORRECT: Separate Proof for Each Input
     *
     * @chapter anti-patterns
     * Solution: Each input needs its own proof parameter
     */
    function processTwoCorrect(
        einput input1,
        bytes calldata proof1,
        einput input2,
        bytes calldata proof2
    ) external {
        // ✅ Each input has its own proof
        euint32 val1 = TFHE.asEuint32(input1, proof1);
        euint32 val2 = TFHE.asEuint32(input2, proof2);

        euint32 sum = TFHE.add(val1, val2);
        balances[msg.sender] = sum;

        TFHE.allowThis(sum);
        TFHE.allow(sum, msg.sender);
    }

    /**
     * ❌ ANTI-PATTERN #8: Type Mismatches
     *
     * @chapter anti-patterns
     * Problem: Using wrong type conversion function
     *
     * This will FAIL:
     * function typeMismatch(einput input, bytes calldata proof) external {
     *     euint32 value = TFHE.asEuint8(input, proof); // ❌ Type mismatch!
     * }
     */

    /**
     * ✅ CORRECT: Match Types Correctly
     *
     * @chapter anti-patterns
     * Solution: Use correct type conversion
     */
    function typeMatchCorrect(
        einput input8,
        bytes calldata proof8,
        einput input32,
        bytes calldata proof32
    ) external {
        // ✅ Correct type matching
        euint8 value8 = TFHE.asEuint8(input8, proof8);
        euint32 value32 = TFHE.asEuint32(input32, proof32);

        // Convert if needed
        euint32 converted = TFHE.asEuint32(value8);
        euint32 sum = TFHE.add(converted, value32);

        balances[msg.sender] = sum;
        TFHE.allowThis(sum);
        TFHE.allow(sum, msg.sender);
    }

    /**
     * ✅ Helper: Get decrypted balance (for testing only!)
     *
     * @chapter anti-patterns
     * Note: In production, add access control to decryption functions!
     */
    function getDecryptedBalance() external view returns (uint32) {
        return TFHE.decrypt(balances[msg.sender]);
    }

    /**
     * Summary of Anti-Patterns:
     *
     * ❌ 1. Decrypting in view functions
     * ❌ 2. Missing FHE.allow() permissions
     * ❌ 3. No input proofs for user data
     * ❌ 4. Mixing encrypted/plaintext incorrectly
     * ❌ 5. Forgetting allowThis() for contract
     * ❌ 6. Exposing encrypted data in events
     * ❌ 7. Reusing input proofs
     * ❌ 8. Type mismatches
     *
     * Remember: Always use the CORRECT patterns shown in this contract!
     */
}
