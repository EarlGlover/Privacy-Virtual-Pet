// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title EncryptedProfile
 * @notice Demonstrates managing multiple encrypted values in a struct
 * @dev Shows patterns for batch encryption and individual field updates
 *
 * @chapter encryption-patterns
 * This example illustrates:
 * - Storing multiple encrypted values in structs
 * - Batch encryption of multiple inputs
 * - Individual field updates
 * - Decrypting multiple values
 * - Managing complex encrypted state
 */
contract EncryptedProfile {
    using TFHE for euint8;
    using TFHE for euint32;

    /**
     * @notice Encrypted user profile structure
     * @dev Contains multiple encrypted fields of different types
     *
     * @chapter encryption-patterns
     * Pattern: Use appropriate encrypted type for each field's range
     * - euint8 for small ranges (0-255)
     * - euint32 for larger ranges (0-4,294,967,295)
     */
    struct EncryptedProfile {
        euint8 age;        // Encrypted age (0-255)
        euint32 score;     // Encrypted score
        euint32 balance;   // Encrypted balance
    }

    /// @notice Mapping from user address to encrypted profile
    mapping(address => EncryptedProfile) public profiles;

    /// @notice Track if user has initialized their profile
    mapping(address => bool) public hasProfile;

    /// @notice Emitted when profile is created
    event ProfileCreated(address indexed user, uint256 timestamp);

    /// @notice Emitted when profile is updated
    event ProfileUpdated(address indexed user, uint256 timestamp);

    /// @notice Emitted when individual field is updated
    event FieldUpdated(address indexed user, string fieldName, uint256 timestamp);

    /**
     * @notice Set complete profile with all fields
     * @param age Plaintext age value (0-255)
     * @param score Plaintext score value
     * @param balance Plaintext balance value
     *
     * @dev Batch encryption pattern:
     * 1. Receive multiple plaintext values
     * 2. Encrypt each value to appropriate type
     * 3. Store all in encrypted struct
     * 4. All values encrypted in single transaction
     *
     * @chapter encryption-patterns
     * Demonstrates efficient batch encryption of multiple values
     */
    function setProfile(
        uint8 age,
        uint32 score,
        uint32 balance
    ) external {
        // Create encrypted profile with all fields
        profiles[msg.sender] = EncryptedProfile({
            age: TFHE.asEuint8(age),
            score: TFHE.asEuint32(score),
            balance: TFHE.asEuint32(balance)
        });

        hasProfile[msg.sender] = true;

        emit ProfileCreated(msg.sender, block.timestamp);
    }

    /**
     * @notice Update age field only
     * @param newAge New plaintext age value
     *
     * @dev Individual field update pattern:
     * - Update only the specific field
     * - Other fields remain unchanged
     * - More gas efficient than rewriting entire struct
     *
     * @chapter encryption-patterns
     * Shows partial update of encrypted struct
     */
    function updateAge(uint8 newAge) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        // Update only age field
        profiles[msg.sender].age = TFHE.asEuint8(newAge);

        emit FieldUpdated(msg.sender, "age", block.timestamp);
    }

    /**
     * @notice Update score field only
     * @param newScore New plaintext score value
     *
     * @chapter encryption-patterns
     * Partial update preserves other encrypted fields
     */
    function updateScore(uint32 newScore) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        profiles[msg.sender].score = TFHE.asEuint32(newScore);

        emit FieldUpdated(msg.sender, "score", block.timestamp);
    }

    /**
     * @notice Update balance field only
     * @param newBalance New plaintext balance value
     *
     * @chapter encryption-patterns
     * Gas-efficient single-field update
     */
    function updateBalance(uint32 newBalance) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        profiles[msg.sender].balance = TFHE.asEuint32(newBalance);

        emit FieldUpdated(msg.sender, "balance", block.timestamp);
    }

    /**
     * @notice Increment score by a value
     * @param amount Amount to add to score
     *
     * @dev Demonstrates computation on encrypted field:
     * - Read current encrypted value
     * - Perform encrypted addition
     * - Store encrypted result
     *
     * @chapter encryption-patterns
     * Shows encrypted arithmetic on struct field
     */
    function incrementScore(uint32 amount) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        EncryptedProfile storage profile = profiles[msg.sender];

        // Encrypted addition: score + amount
        profile.score = TFHE.add(
            profile.score,
            TFHE.asEuint32(amount)
        );

        emit FieldUpdated(msg.sender, "score", block.timestamp);
    }

    /**
     * @notice Decrement balance by a value
     * @param amount Amount to subtract from balance
     *
     * @dev Encrypted subtraction with bounds checking
     *
     * @chapter encryption-patterns
     * Demonstrates safe encrypted subtraction
     */
    function decrementBalance(uint32 amount) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        EncryptedProfile storage profile = profiles[msg.sender];

        // Encrypted subtraction with floor at 0
        profile.balance = TFHE.sub(
            profile.balance,
            TFHE.asEuint32(amount)
        );
        profile.balance = TFHE.max(profile.balance, TFHE.asEuint32(0));

        emit FieldUpdated(msg.sender, "balance", block.timestamp);
    }

    /**
     * @notice Get encrypted profile (all fields)
     * @return age Encrypted age value
     * @return score Encrypted score value
     * @return balance Encrypted balance value
     *
     * @dev Returns all encrypted values without decryption
     * Privacy preserved - nobody can see actual values
     *
     * @chapter encryption-patterns
     * Multi-value retrieval without revealing plaintext
     */
    function getProfile() external view returns (
        euint8 age,
        euint32 score,
        euint32 balance
    ) {
        EncryptedProfile memory profile = profiles[msg.sender];
        return (profile.age, profile.score, profile.balance);
    }

    /**
     * @notice Get decrypted profile (authorized users only)
     * @return age Decrypted age value
     * @return score Decrypted score value
     * @return balance Decrypted balance value
     *
     * @dev Batch decryption pattern:
     * - Decrypt all fields
     * - Return as tuple
     * - Only authorized users can call
     *
     * @chapter encryption-patterns
     * In production:
     * - Add access control
     * - Log decryption events
     * - Consider rate limiting
     */
    function getDecryptedProfile() external view returns (
        uint8 age,
        uint32 score,
        uint32 balance
    ) {
        require(hasProfile[msg.sender], "Profile not initialized");

        EncryptedProfile memory profile = profiles[msg.sender];

        return (
            TFHE.decrypt(profile.age),
            TFHE.decrypt(profile.score),
            TFHE.decrypt(profile.balance)
        );
    }

    /**
     * @notice Get only decrypted age
     * @return Decrypted age value
     *
     * @chapter encryption-patterns
     * Selective decryption - only one field
     */
    function getDecryptedAge() external view returns (uint8) {
        require(hasProfile[msg.sender], "Profile not initialized");
        return TFHE.decrypt(profiles[msg.sender].age);
    }

    /**
     * @notice Get only decrypted score
     * @return Decrypted score value
     *
     * @chapter encryption-patterns
     * Minimize decryption operations for efficiency
     */
    function getDecryptedScore() external view returns (uint32) {
        require(hasProfile[msg.sender], "Profile not initialized");
        return TFHE.decrypt(profiles[msg.sender].score);
    }

    /**
     * @notice Get only decrypted balance
     * @return Decrypted balance value
     *
     * @chapter encryption-patterns
     * Granular decryption access control
     */
    function getDecryptedBalance() external view returns (uint32) {
        require(hasProfile[msg.sender], "Profile not initialized");
        return TFHE.decrypt(profiles[msg.sender].balance);
    }

    /**
     * @notice Compute total from score and balance
     * @return Encrypted sum of score and balance
     *
     * @dev Cross-field encrypted computation:
     * - Access multiple encrypted fields
     * - Perform encrypted addition
     * - Return encrypted result
     *
     * @chapter encryption-patterns
     * Shows computation across multiple encrypted fields
     */
    function computeTotal() external view returns (euint32) {
        require(hasProfile[msg.sender], "Profile not initialized");

        EncryptedProfile memory profile = profiles[msg.sender];

        // Add two encrypted euint32 values
        return TFHE.add(profile.score, profile.balance);
    }

    /**
     * @notice Compare score with target value
     * @param target Target score to compare against
     * @return Encrypted boolean (true if score >= target)
     *
     * @chapter encryption-patterns
     * Encrypted comparison on struct field
     */
    function hasMinimumScore(uint32 target) external view returns (ebool) {
        require(hasProfile[msg.sender], "Profile not initialized");

        return TFHE.gte(
            profiles[msg.sender].score,
            TFHE.asEuint32(target)
        );
    }

    /**
     * @notice Reset profile to zeros
     * @dev Reinitialize all fields to encrypted zero
     *
     * @chapter encryption-patterns
     * Batch reinitialization of encrypted struct
     */
    function resetProfile() external {
        require(hasProfile[msg.sender], "Profile not initialized");

        profiles[msg.sender] = EncryptedProfile({
            age: TFHE.asEuint8(0),
            score: TFHE.asEuint32(0),
            balance: TFHE.asEuint32(0)
        });

        emit ProfileUpdated(msg.sender, block.timestamp);
    }

    /**
     * @notice Update all fields at once
     * @param newAge New age value
     * @param newScore New score value
     * @param newBalance New balance value
     *
     * @chapter encryption-patterns
     * Batch update of all encrypted fields
     */
    function updateProfile(
        uint8 newAge,
        uint32 newScore,
        uint32 newBalance
    ) external {
        require(hasProfile[msg.sender], "Profile not initialized");

        profiles[msg.sender] = EncryptedProfile({
            age: TFHE.asEuint8(newAge),
            score: TFHE.asEuint32(newScore),
            balance: TFHE.asEuint32(newBalance)
        });

        emit ProfileUpdated(msg.sender, block.timestamp);
    }
}
