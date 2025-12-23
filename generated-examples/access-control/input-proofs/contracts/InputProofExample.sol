// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title InputProofExample
 * @notice Demonstrates proper use of input proofs for encrypted user inputs
 * @dev Shows how to securely accept encrypted data from users
 *
 * @chapter input-proofs
 * Input proofs are CRITICAL for security in FHEVM. They ensure that:
 * 1. The encrypted input actually contains the claimed value
 * 2. The input was created by the legitimate user
 * 3. The input cannot be replayed or tampered with
 *
 * WITHOUT input proofs, malicious users could:
 * - Submit invalid encrypted data
 * - Replay old encrypted values
 * - Manipulate the encrypted data
 */
contract InputProofExample {
    /// @notice User private balances
    mapping(address => euint32) private balances;

    /// @notice User private scores
    mapping(address => euint32) private scores;

    /// @notice Emitted when balance is deposited
    event BalanceDeposited(address indexed user, uint256 timestamp);

    /// @notice Emitted when score is submitted
    event ScoreSubmitted(address indexed user, uint256 timestamp);

    /**
     * @notice Deposit encrypted amount with proof
     * @param encryptedAmount The encrypted amount (euint32 handle)
     * @param inputProof The cryptographic proof validating the input
     *
     * @chapter input-proofs
     * CORRECT PATTERN: Always use input proofs with user-provided encrypted data
     *
     * The inputProof parameter contains:
     * - Proof that the encrypted value is valid
     * - Proof that msg.sender created this encryption
     * - Protection against replay attacks
     */
    function depositWithProof(
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        // ✅ SECURE: Validate and convert encrypted input with proof
        euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);

        // Add to user's balance
        euint32 currentBalance = balances[msg.sender];
        euint32 newBalance = TFHE.add(currentBalance, amount);

        // Update balance
        balances[msg.sender] = newBalance;

        // Grant permissions
        TFHE.allowThis(newBalance);
        TFHE.allow(newBalance, msg.sender);

        emit BalanceDeposited(msg.sender, block.timestamp);
    }

    /**
     * @notice Submit encrypted score with proof
     * @param encryptedScore The encrypted score
     * @param inputProof The cryptographic proof
     *
     * @chapter input-proofs
     * Use input proofs for ANY user-provided encrypted data:
     * - Financial values (balances, amounts)
     * - Game scores
     * - Private data (age, health metrics)
     * - Voting choices
     */
    function submitScore(
        einput encryptedScore,
        bytes calldata inputProof
    ) external {
        // Validate and convert with proof
        euint32 score = TFHE.asEuint32(encryptedScore, inputProof);

        // Store score
        scores[msg.sender] = score;

        // Grant permissions
        TFHE.allowThis(score);
        TFHE.allow(score, msg.sender);

        emit ScoreSubmitted(msg.sender, block.timestamp);
    }

    /**
     * @notice Transfer encrypted amount to another user
     * @param to Recipient address
     * @param encryptedAmount Encrypted transfer amount
     * @param inputProof Proof validating the encrypted amount
     *
     * @chapter input-proofs
     * For transfers, validate the encrypted amount with proof.
     * This prevents users from:
     * - Transferring invalid amounts
     * - Replaying previous transfer amounts
     * - Manipulating the encrypted value
     */
    function transferWithProof(
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");

        // ✅ Validate encrypted input
        euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);

        // Get balances
        euint32 senderBalance = balances[msg.sender];
        euint32 recipientBalance = balances[to];

        // Perform transfer
        euint32 newSenderBalance = TFHE.sub(senderBalance, amount);
        euint32 newRecipientBalance = TFHE.add(recipientBalance, amount);

        // Update balances
        balances[msg.sender] = newSenderBalance;
        balances[to] = newRecipientBalance;

        // Grant permissions
        TFHE.allowThis(newSenderBalance);
        TFHE.allow(newSenderBalance, msg.sender);
        TFHE.allowThis(newRecipientBalance);
        TFHE.allow(newRecipientBalance, to);
    }

    /**
     * @notice Demonstrate multiple inputs with proofs
     * @param input1 First encrypted input
     * @param proof1 Proof for first input
     * @param input2 Second encrypted input
     * @param proof2 Proof for second input
     *
     * @chapter input-proofs
     * When accepting multiple encrypted inputs, each needs its own proof.
     * You cannot use one proof for multiple inputs!
     */
    function processMultipleInputs(
        einput input1,
        bytes calldata proof1,
        einput input2,
        bytes calldata proof2
    ) external {
        // ✅ Each input needs its own proof
        euint32 value1 = TFHE.asEuint32(input1, proof1);
        euint32 value2 = TFHE.asEuint32(input2, proof2);

        // Process values
        euint32 sum = TFHE.add(value1, value2);
        balances[msg.sender] = sum;

        // Grant permissions
        TFHE.allowThis(sum);
        TFHE.allow(sum, msg.sender);
    }

    /**
     * @notice Get user's encrypted balance
     * @return User's encrypted balance
     */
    function getBalance() external view returns (euint32) {
        return balances[msg.sender];
    }

    /**
     * @notice Get user's decrypted balance
     * @return User's plaintext balance
     */
    function getDecryptedBalance() external view returns (uint32) {
        return TFHE.decrypt(balances[msg.sender]);
    }

    /**
     * @notice Get user's encrypted score
     * @return User's encrypted score
     */
    function getScore() external view returns (euint32) {
        return scores[msg.sender];
    }

    /**
     * @notice Example of INCORRECT pattern (commented out for safety)
     *
     * @chapter input-proofs
     * ❌ INSECURE: Never accept encrypted inputs without proofs!
     *
     * function depositInsecure(euint32 amount) external {
     *     // ❌ NO PROOF! Anyone could submit malicious encrypted data
     *     euint32 currentBalance = balances[msg.sender];
     *     euint32 newBalance = TFHE.add(currentBalance, amount);
     *     balances[msg.sender] = newBalance;
     * }
     *
     * Problems with this approach:
     * - No validation that the encrypted value is legitimate
     * - Vulnerable to replay attacks
     * - User could submit garbage encrypted data
     * - No protection against tampering
     */

    /**
     * @notice Demonstrate different input types with proofs
     * @param encryptedValue8 8-bit encrypted value
     * @param proof8 Proof for 8-bit value
     * @param encryptedValue16 16-bit encrypted value
     * @param proof16 Proof for 16-bit value
     *
     * @chapter input-proofs
     * Input proofs work with all encrypted types:
     * - euint8, euint16, euint32, euint64
     * - ebool
     * - Each type needs appropriate conversion
     */
    function processDifferentTypes(
        einput encryptedValue8,
        bytes calldata proof8,
        einput encryptedValue16,
        bytes calldata proof16
    ) external {
        // Convert with appropriate types
        euint8 value8 = TFHE.asEuint8(encryptedValue8, proof8);
        euint16 value16 = TFHE.asEuint16(encryptedValue16, proof16);

        // Can use these values securely
        euint32 combined = TFHE.add(
            TFHE.asEuint32(value8),
            TFHE.asEuint32(value16)
        );

        balances[msg.sender] = combined;

        TFHE.allowThis(combined);
        TFHE.allow(combined, msg.sender);
    }
}
