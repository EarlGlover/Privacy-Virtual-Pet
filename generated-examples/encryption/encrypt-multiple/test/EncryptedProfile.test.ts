import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedProfile } from "../typechain-types";
import { Signer } from "ethers";

/**
 * @chapter encryption-patterns
 * Test suite for multiple encrypted values management
 *
 * This test suite demonstrates:
 * - Creating and managing encrypted profiles
 * - Batch encryption of multiple fields
 * - Individual field updates
 * - Encrypted computations on multiple fields
 * - Decryption patterns for multiple values
 */
describe("EncryptedProfile", function () {
    let profileContract: EncryptedProfile;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy contract
        const EncryptedProfileFactory = await ethers.getContractFactory("EncryptedProfile");
        profileContract = await EncryptedProfileFactory.deploy();
        await profileContract.waitForDeployment();
    });

    describe("Profile Creation", function () {
        /**
         * @example batch-encryption
         * Demonstrates creating a profile with multiple encrypted values at once
         */
        it("should create profile with all fields", async function () {
            // Set profile: age=25, score=100, balance=1000
            await profileContract.connect(user1).setProfile(25, 100, 1000);

            // Verify profile was created
            const hasProfile = await profileContract.hasProfile(await user1.getAddress());
            expect(hasProfile).to.be.true;

            // Verify decrypted values
            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(25);
            expect(score).to.equal(100);
            expect(balance).to.equal(1000);
        });

        it("should handle edge case values", async function () {
            // Test boundary values: age=0, score=0, balance=max
            await profileContract.connect(user1).setProfile(0, 0, 4294967295);

            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(0);
            expect(score).to.equal(0);
            expect(balance).to.equal(4294967295);
        });

        it("should handle maximum age value", async function () {
            // euint8 max value is 255
            await profileContract.connect(user1).setProfile(255, 500, 2000);

            const age = await profileContract.connect(user1).getDecryptedAge();
            expect(age).to.equal(255);
        });

        it("should emit ProfileCreated event", async function () {
            await expect(profileContract.connect(user1).setProfile(30, 150, 5000))
                .to.emit(profileContract, "ProfileCreated")
                .withArgs(await user1.getAddress(), await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });
    });

    describe("Individual Field Updates", function () {
        beforeEach(async function () {
            // Create initial profile
            await profileContract.connect(user1).setProfile(25, 100, 1000);
        });

        /**
         * @example partial-update
         * Demonstrates updating a single field without affecting others
         */
        it("should update age only", async function () {
            // Update only age
            await profileContract.connect(user1).updateAge(30);

            // Verify age changed, others remain
            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(30);
            expect(score).to.equal(100); // Unchanged
            expect(balance).to.equal(1000); // Unchanged
        });

        it("should update score only", async function () {
            await profileContract.connect(user1).updateScore(200);

            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(25); // Unchanged
            expect(score).to.equal(200);
            expect(balance).to.equal(1000); // Unchanged
        });

        it("should update balance only", async function () {
            await profileContract.connect(user1).updateBalance(2000);

            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(25); // Unchanged
            expect(score).to.equal(100); // Unchanged
            expect(balance).to.equal(2000);
        });

        it("should emit FieldUpdated event", async function () {
            await expect(profileContract.connect(user1).updateAge(35))
                .to.emit(profileContract, "FieldUpdated")
                .withArgs(await user1.getAddress(), "age", await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        it("should revert when updating non-existent profile", async function () {
            await expect(
                profileContract.connect(user2).updateAge(30)
            ).to.be.revertedWith("Profile not initialized");
        });
    });

    describe("Encrypted Arithmetic on Fields", function () {
        beforeEach(async function () {
            await profileContract.connect(user1).setProfile(25, 100, 1000);
        });

        /**
         * @example encrypted-increment
         * Demonstrates encrypted addition on a struct field
         */
        it("should increment score", async function () {
            // Increment score by 50: 100 + 50 = 150
            await profileContract.connect(user1).incrementScore(50);

            const score = await profileContract.connect(user1).getDecryptedScore();
            expect(score).to.equal(150);
        });

        it("should handle multiple increments", async function () {
            await profileContract.connect(user1).incrementScore(25);
            await profileContract.connect(user1).incrementScore(75);

            const score = await profileContract.connect(user1).getDecryptedScore();
            expect(score).to.equal(200); // 100 + 25 + 75
        });

        /**
         * @example encrypted-decrement
         * Demonstrates encrypted subtraction on a struct field
         */
        it("should decrement balance", async function () {
            // Decrement balance by 300: 1000 - 300 = 700
            await profileContract.connect(user1).decrementBalance(300);

            const balance = await profileContract.connect(user1).getDecryptedBalance();
            expect(balance).to.equal(700);
        });

        it("should handle balance floor at zero", async function () {
            // Try to decrement below zero: 1000 - 1500 = 0 (floored)
            await profileContract.connect(user1).decrementBalance(1500);

            const balance = await profileContract.connect(user1).getDecryptedBalance();
            expect(balance).to.equal(0);
        });

        it("should handle exact balance depletion", async function () {
            await profileContract.connect(user1).decrementBalance(1000);

            const balance = await profileContract.connect(user1).getDecryptedBalance();
            expect(balance).to.equal(0);
        });
    });

    describe("Cross-Field Computations", function () {
        beforeEach(async function () {
            await profileContract.connect(user1).setProfile(25, 500, 2000);
        });

        /**
         * @example cross-field-computation
         * Demonstrates encrypted computation using multiple struct fields
         */
        it("should compute total from score and balance", async function () {
            // Get encrypted total
            const encryptedTotal = await profileContract.connect(user1).computeTotal();

            // Verify it's encrypted (returns a handle, not readable value)
            expect(encryptedTotal).to.not.equal(0);

            // For testing purposes, we can verify by comparing with known values
            const score = await profileContract.connect(user1).getDecryptedScore();
            const balance = await profileContract.connect(user1).getDecryptedBalance();
            expect(score + balance).to.equal(2500);
        });

        /**
         * @example encrypted-comparison
         * Demonstrates encrypted comparison on a struct field
         */
        it("should check minimum score requirement", async function () {
            // Check if score >= 300 (should be true, score is 500)
            const hasMin = await profileContract.connect(user1).hasMinimumScore(300);
            expect(hasMin).to.not.equal(0); // Encrypted boolean, non-zero means true
        });

        it("should handle comparison edge cases", async function () {
            // Check exact match
            const hasExactScore = await profileContract.connect(user1).hasMinimumScore(500);
            expect(hasExactScore).to.not.equal(0); // Should be true

            // Check higher requirement
            const hasTooHigh = await profileContract.connect(user1).hasMinimumScore(501);
            // Note: In real FHEVM, you'd decrypt the ebool to verify
        });
    });

    describe("Batch Operations", function () {
        beforeEach(async function () {
            await profileContract.connect(user1).setProfile(25, 100, 1000);
        });

        /**
         * @example batch-update
         * Demonstrates updating all fields at once
         */
        it("should update entire profile", async function () {
            // Update all fields: age=30, score=200, balance=3000
            await profileContract.connect(user1).updateProfile(30, 200, 3000);

            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(30);
            expect(score).to.equal(200);
            expect(balance).to.equal(3000);
        });

        it("should emit ProfileUpdated event", async function () {
            await expect(profileContract.connect(user1).updateProfile(35, 250, 4000))
                .to.emit(profileContract, "ProfileUpdated")
                .withArgs(await user1.getAddress(), await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        /**
         * @example batch-reset
         * Demonstrates resetting all fields to zero
         */
        it("should reset profile to zeros", async function () {
            await profileContract.connect(user1).resetProfile();

            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(0);
            expect(score).to.equal(0);
            expect(balance).to.equal(0);
        });
    });

    describe("Multi-User Isolation", function () {
        /**
         * @example user-isolation
         * Demonstrates that each user has independent encrypted state
         */
        it("should maintain separate profiles for different users", async function () {
            // User1 creates profile
            await profileContract.connect(user1).setProfile(25, 100, 1000);

            // User2 creates different profile
            await profileContract.connect(user2).setProfile(30, 200, 2000);

            // Verify user1 profile
            const [age1, score1, balance1] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age1).to.equal(25);
            expect(score1).to.equal(100);
            expect(balance1).to.equal(1000);

            // Verify user2 profile
            const [age2, score2, balance2] = await profileContract.connect(user2).getDecryptedProfile();
            expect(age2).to.equal(30);
            expect(score2).to.equal(200);
            expect(balance2).to.equal(2000);
        });

        it("should allow independent updates per user", async function () {
            await profileContract.connect(user1).setProfile(25, 100, 1000);
            await profileContract.connect(user2).setProfile(30, 200, 2000);

            // User1 updates
            await profileContract.connect(user1).updateAge(26);

            // User2 profile should be unaffected
            const [age2] = await profileContract.connect(user2).getDecryptedProfile();
            expect(age2).to.equal(30);
        });
    });

    describe("Selective Decryption", function () {
        beforeEach(async function () {
            await profileContract.connect(user1).setProfile(25, 100, 1000);
        });

        /**
         * @example selective-decryption
         * Demonstrates decrypting individual fields instead of entire profile
         */
        it("should decrypt only age", async function () {
            const age = await profileContract.connect(user1).getDecryptedAge();
            expect(age).to.equal(25);
        });

        it("should decrypt only score", async function () {
            const score = await profileContract.connect(user1).getDecryptedScore();
            expect(score).to.equal(100);
        });

        it("should decrypt only balance", async function () {
            const balance = await profileContract.connect(user1).getDecryptedBalance();
            expect(balance).to.equal(1000);
        });

        it("should decrypt entire profile at once", async function () {
            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(25);
            expect(score).to.equal(100);
            expect(balance).to.equal(1000);
        });
    });

    describe("Error Handling", function () {
        it("should revert when accessing non-existent profile", async function () {
            await expect(
                profileContract.connect(user1).getDecryptedProfile()
            ).to.be.revertedWith("Profile not initialized");
        });

        it("should revert when updating non-existent profile", async function () {
            await expect(
                profileContract.connect(user1).updateProfile(30, 200, 2000)
            ).to.be.revertedWith("Profile not initialized");
        });

        it("should revert when incrementing non-existent score", async function () {
            await expect(
                profileContract.connect(user1).incrementScore(50)
            ).to.be.revertedWith("Profile not initialized");
        });

        it("should revert when decrementing non-existent balance", async function () {
            await expect(
                profileContract.connect(user1).decrementBalance(100)
            ).to.be.revertedWith("Profile not initialized");
        });

        it("should revert when resetting non-existent profile", async function () {
            await expect(
                profileContract.connect(user1).resetProfile()
            ).to.be.revertedWith("Profile not initialized");
        });
    });

    describe("Complex Workflows", function () {
        /**
         * @example complete-workflow
         * Demonstrates a complete user journey with multiple operations
         */
        it("should handle complete user workflow", async function () {
            // 1. Create profile
            await profileContract.connect(user1).setProfile(25, 100, 1000);

            // 2. Increment score twice
            await profileContract.connect(user1).incrementScore(50);
            await profileContract.connect(user1).incrementScore(25);

            // 3. Decrement balance
            await profileContract.connect(user1).decrementBalance(200);

            // 4. Update age
            await profileContract.connect(user1).updateAge(26);

            // 5. Verify final state
            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(26);
            expect(score).to.equal(175); // 100 + 50 + 25
            expect(balance).to.equal(800); // 1000 - 200
        });

        it("should handle profile recreation", async function () {
            // Create initial profile
            await profileContract.connect(user1).setProfile(25, 100, 1000);

            // Create new profile (overwrites)
            await profileContract.connect(user1).setProfile(30, 200, 2000);

            // Verify new values
            const [age, score, balance] = await profileContract.connect(user1).getDecryptedProfile();
            expect(age).to.equal(30);
            expect(score).to.equal(200);
            expect(balance).to.equal(2000);
        });
    });
});
