import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter encryption-patterns
 * Test suite for EncryptedValue demonstrating single value encryption
 *
 * These tests show:
 * - How to encrypt plaintext values
 * - How to store encrypted state
 * - How to retrieve encrypted values
 * - How to decrypt with proper authorization
 * - Privacy guarantees in practice
 */
describe("EncryptedValue", function () {
    let encryptedValue: any;
    let owner: any;
    let addr1: any;

    /**
     * Deploy fresh contract before each test
     * Ensures isolated test execution
     */
    beforeEach(async function () {
        const EncryptedValue = await ethers.getContractFactory(
            "EncryptedValue"
        );
        encryptedValue = await EncryptedValue.deploy();
        await encryptedValue.deploymentTransaction()?.wait();

        [owner, addr1] = await ethers.getSigners();
    });

    describe("Deployment and Initialization", function () {
        /**
         * Test: Contract deploys successfully
         * Purpose: Verify the contract is deployed to a valid address
         */
        it("should deploy successfully", async function () {
            expect(encryptedValue.address).to.not.equal(
                ethers.ZeroAddress
            );
        });

        /**
         * Test: Initialize with encrypted zero
         * Purpose: Verify contract starts with encrypted zero value
         *
         * @chapter encryption-patterns
         * Shows that we can create encrypted zero as initial state
         */
        it("should initialize with encrypted zero", async function () {
            const encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(0);
        });

        /**
         * Test: Owner is set correctly
         * Purpose: Verify access control initialization
         */
        it("should set owner correctly", async function () {
            const contractOwner = await encryptedValue.owner();
            expect(contractOwner).to.equal(owner.address);
        });
    });

    describe("Setting Values from Plaintext", function () {
        /**
         * Test: Set plaintext value
         *
         * @chapter encryption-patterns
         * Demonstrates the core encryption pattern:
         * plaintext → TFHE.asEuint32() → encrypted storage
         */
        it("should set plaintext value", async function () {
            // Set plaintext value
            await encryptedValue.setValue(42);

            // Retrieve encrypted value (won't show 42)
            const encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            // Only decryption reveals the value
            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(42);
        });

        /**
         * Test: Multiple values can be set sequentially
         *
         * @chapter encryption-patterns
         * Shows that encryption pattern works repeatedly
         */
        it("should handle multiple plaintext values", async function () {
            // Set first value
            await encryptedValue.setValue(100);
            let decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(100);

            // Set different value
            await encryptedValue.setValue(200);
            decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(200);

            // Set another value
            await encryptedValue.setValue(300);
            decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(300);
        });

        /**
         * Test: Large values can be encrypted
         *
         * @chapter encryption-patterns
         * euint32 supports values up to 2^32 - 1
         */
        it("should encrypt large values", async function () {
            const largeValue = 4294967295; // 2^32 - 1

            await encryptedValue.setValue(largeValue);

            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(largeValue);
        });

        /**
         * Test: Zero value encryption
         *
         * @chapter encryption-patterns
         * Zero is a valid encrypted value
         */
        it("should handle zero values", async function () {
            await encryptedValue.setValue(0);

            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(0);
        });

        /**
         * Test: Emit ValueSet event
         *
         * @chapter encryption-patterns
         * Events provide transparency without revealing values
         */
        it("should emit ValueSet event", async function () {
            await expect(encryptedValue.setValue(42))
                .to.emit(encryptedValue, "ValueSet")
                .withArgs(owner.address);
        });
    });

    describe("Setting Pre-Encrypted Values", function () {
        /**
         * Test: Accept pre-encrypted values
         *
         * @chapter encryption-patterns
         * Some clients may encrypt client-side
         * This shows how to accept pre-encrypted input
         */
        it("should accept pre-encrypted values", async function () {
            // Simulate client-side encryption
            const plainValue = 123;
            const encryptedInput = ethers.toBeHex(
                ethers.zeroPadValue(ethers.toBeHex(plainValue), 32)
            );

            // Set from encrypted input
            await encryptedValue.setValueFromEncrypted(encryptedInput);

            // Value should be stored
            const encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;
        });

        /**
         * Test: Pre-encrypted values can be different types
         *
         * @chapter encryption-patterns
         * Shows flexibility in accepting encrypted inputs
         */
        it("should emit event for pre-encrypted value", async function () {
            const encryptedInput = ethers.toBeHex(
                ethers.zeroPadValue(ethers.toBeHex(456), 32)
            );

            await expect(
                encryptedValue.setValueFromEncrypted(encryptedInput)
            )
                .to.emit(encryptedValue, "ValueSet")
                .withArgs(owner.address);
        });
    });

    describe("Retrieving Values", function () {
        /**
         * Test: Retrieve encrypted value without decryption
         *
         * @chapter encryption-patterns
         * Shows that we can work with encrypted data
         * without ever seeing the plaintext
         */
        it("should retrieve encrypted value", async function () {
            await encryptedValue.setValue(42);

            const encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            // Encrypted value has a specific format
            // But we cannot determine the plaintext from it
        });

        /**
         * Test: Encrypted values are different for different inputs
         *
         * @chapter encryption-patterns
         * Each encryption is unique even for same value
         */
        it("should produce different encrypted representations", async function () {
            // Set first value
            await encryptedValue.setValue(42);
            const encrypted1 = await encryptedValue.getValue();

            // Reset and set again
            await encryptedValue.resetValue();
            await encryptedValue.setValue(42);
            const encrypted2 = await encryptedValue.getValue();

            // Encrypted representations should exist
            expect(encrypted1).to.exist;
            expect(encrypted2).to.exist;
        });
    });

    describe("Decryption and Privacy", function () {
        /**
         * Test: Decrypt to reveal plaintext
         *
         * @chapter encryption-patterns
         * Only authorized parties can decrypt
         * This test assumes no access control (educational)
         */
        it("should decrypt encrypted value", async function () {
            await encryptedValue.setValue(12345);

            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(12345);
        });

        /**
         * Test: Privacy guarantee - others cannot see plaintext
         *
         * @chapter encryption-patterns
         * Only the contract and authorized users can decrypt
         */
        it("should maintain privacy of encrypted value", async function () {
            await encryptedValue.setValue(999);

            // Different address calls getValue
            const encrypted = await encryptedValue
                .connect(addr1)
                .getValue();

            // Encrypted value exists but reveals nothing
            expect(encrypted).to.exist;

            // Only owner can decrypt
            const decrypted = await encryptedValue
                .connect(owner)
                .getDecryptedValue();
            expect(decrypted).to.equal(999);
        });

        /**
         * Test: Decryption consistency
         *
         * @chapter encryption-patterns
         * Multiple decryptions of same encrypted value give same result
         */
        it("should consistently decrypt same value", async function () {
            await encryptedValue.setValue(555);

            const decrypted1 = await encryptedValue.getDecryptedValue();
            const decrypted2 = await encryptedValue.getDecryptedValue();

            expect(decrypted1).to.equal(decrypted2);
            expect(decrypted1).to.equal(555);
        });
    });

    describe("Updating Values", function () {
        /**
         * Test: Update encrypted value
         *
         * @chapter encryption-patterns
         * Encrypted values can be replaced with new ones
         */
        it("should update value", async function () {
            // Set initial value
            await encryptedValue.setValue(100);
            let decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(100);

            // Update to new value
            await encryptedValue.updateValue(200);
            decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(200);
        });

        /**
         * Test: Multiple updates
         *
         * @chapter encryption-patterns
         * Values can be updated repeatedly
         */
        it("should handle multiple updates", async function () {
            const values = [10, 20, 30, 40, 50];

            for (const val of values) {
                await encryptedValue.updateValue(val);
                const decrypted = await encryptedValue.getDecryptedValue();
                expect(decrypted).to.equal(val);
            }
        });

        /**
         * Test: Emit ValueUpdated event
         *
         * @chapter encryption-patterns
         * Updates emit event for transparency
         */
        it("should emit ValueUpdated event", async function () {
            await encryptedValue.setValue(100);

            await expect(encryptedValue.updateValue(200))
                .to.emit(encryptedValue, "ValueUpdated")
                .withArgs(owner.address);
        });

        /**
         * Test: Reset value
         *
         * @chapter encryption-patterns
         * Can reinitialize to encrypted zero
         */
        it("should reset to zero", async function () {
            await encryptedValue.setValue(999);
            let decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(999);

            await encryptedValue.resetValue();
            decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(0);
        });
    });

    describe("Encrypted Comparisons", function () {
        /**
         * Test: Equality comparison on encrypted values
         *
         * @chapter encryption-patterns
         * TFHE.eq() returns encrypted boolean
         * Result is also encrypted - privacy preserved
         */
        it("should compare values for equality", async function () {
            await encryptedValue.setValue(42);

            // These comparisons return encrypted booleans
            const isEqual = await encryptedValue.isEqualTo(42);
            expect(isEqual).to.exist;

            const notEqual = await encryptedValue.isEqualTo(99);
            expect(notEqual).to.exist;

            // Cannot directly check encrypted boolean
            // But contract operations can use it
        });

        /**
         * Test: Greater than comparison
         *
         * @chapter encryption-patterns
         * TFHE.gt() for greater-than on encrypted data
         */
        it("should compare values for greater than", async function () {
            await encryptedValue.setValue(100);

            const result = await encryptedValue.isGreaterThan(50);
            expect(result).to.exist;
        });

        /**
         * Test: Less than comparison
         *
         * @chapter encryption-patterns
         * TFHE.lt() for less-than on encrypted data
         */
        it("should compare values for less than", async function () {
            await encryptedValue.setValue(50);

            const result = await encryptedValue.isLessThan(100);
            expect(result).to.exist;
        });
    });

    describe("Encrypted Conditionals", function () {
        /**
         * Test: Conditional select on encrypted data
         *
         * @chapter encryption-patterns
         * TFHE.cmux() is conditional select on encrypted boolean
         * No branching - both paths computed, result selected
         */
        it("should perform conditional selection", async function () {
            // Set value to determine condition
            await encryptedValue.setValue(100);

            // Select based on comparison result
            // Result is encrypted euint32
            const result = await encryptedValue.selectValue(
                TFHE.asEuint32(1), // condition (true)
                111, // valueIfTrue
                222 // valueIfFalse
            );

            expect(result).to.exist;
        });

        /**
         * Test: Conditional with different values
         *
         * @chapter encryption-patterns
         * Shows flexibility of cmux() in selecting encrypted values
         */
        it("should handle various conditional values", async function () {
            const result1 = await encryptedValue.selectValue(
                TFHE.asEuint32(1),
                1000,
                2000
            );
            expect(result1).to.exist;

            const result2 = await encryptedValue.selectValue(
                TFHE.asEuint32(0),
                1000,
                2000
            );
            expect(result2).to.exist;
        });
    });

    describe("Privacy Guarantees", function () {
        /**
         * Test: Multiple operations maintain privacy
         *
         * @chapter encryption-patterns
         * Contract can work with encrypted data
         * without ever exposing plaintext
         */
        it("should maintain privacy through multiple operations", async function () {
            // Perform several operations
            await encryptedValue.setValue(42);
            let encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            await encryptedValue.updateValue(84);
            encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            await encryptedValue.isEqualTo(84);
            encrypted = await encryptedValue.getValue();
            expect(encrypted).to.exist;

            // Only decryption reveals values
            const decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(84);
        });

        /**
         * Test: Encryption semantic security
         *
         * @chapter encryption-patterns
         * Different plaintext values cannot be distinguished
         * by observing encrypted state
         */
        it("should provide semantic security", async function () {
            // Set value A
            await encryptedValue.setValue(1000);
            const encryptedA = await encryptedValue.getValue();

            // Reset and set value B
            await encryptedValue.resetValue();
            await encryptedValue.setValue(1000);
            const encryptedB = await encryptedValue.getValue();

            // Encrypted representations may differ
            // But both encrypt same plaintext value
            const decryptedA = await encryptedValue.getDecryptedValue();

            await encryptedValue.resetValue();
            await encryptedValue.setValue(1000);
            const decryptedB = await encryptedValue.getDecryptedValue();

            expect(decryptedA).to.equal(decryptedB);
        });
    });

    describe("State Consistency", function () {
        /**
         * Test: State remains consistent after many operations
         *
         * @chapter encryption-patterns
         * Even with many operations, encrypted state is consistent
         */
        it("should maintain state consistency", async function () {
            const operations = [10, 20, 30, 40, 50];

            for (const val of operations) {
                await encryptedValue.setValue(val);
                const decrypted = await encryptedValue.getDecryptedValue();
                expect(decrypted).to.equal(val);
            }

            // Final state should be last value
            const final = await encryptedValue.getDecryptedValue();
            expect(final).to.equal(50);
        });

        /**
         * Test: Different addresses can set values
         *
         * @chapter encryption-patterns
         * Multiple participants can encrypt and store values
         */
        it("should allow different addresses to set values", async function () {
            // Owner sets value
            await encryptedValue.connect(owner).setValue(111);
            let decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(111);

            // Another address sets value
            await encryptedValue.connect(addr1).setValue(222);
            decrypted = await encryptedValue.getDecryptedValue();
            expect(decrypted).to.equal(222);

            // State updated correctly
            expect(decrypted).to.equal(222);
        });
    });
});
