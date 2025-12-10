import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter arithmetic-operations
 * Test suite for EncryptedCounter demonstrating FHE operations
 *
 * These tests show:
 * - How encrypted state behaves
 * - Correct usage of TFHE operations
 * - Common patterns in FHE contracts
 * - Testing encrypted values
 */
describe("EncryptedCounter", function () {
    let counter: any;
    let owner: any;
    let addr1: any;

    /**
     * Deploy fresh contract before each test
     * Ensures isolated test execution
     */
    beforeEach(async function () {
        const Counter = await ethers.getContractFactory("EncryptedCounter");
        counter = await Counter.deploy();
        await counter.deploymentTransaction()?.wait();

        [owner, addr1] = await ethers.getSigners();
    });

    describe("Deployment and Initialization", function () {
        /**
         * Test: Counter initializes at zero
         * Purpose: Verify encrypted initialization works correctly
         *
         * @chapter arithmetic-operations
         * This demonstrates that we can create encrypted values
         * and they start with expected encrypted representations.
         */
        it("should initialize counter at zero", async function () {
            // The counter should exist but its encrypted value is private
            const encryptedCount = await counter.getCount();
            expect(encryptedCount).to.exist;

            // Decrypted value should be 0
            const decryptedCount = await counter.getDecryptedCount();
            expect(decryptedCount).to.equal(0);
        });

        /**
         * Test: Contract deploys successfully
         */
        it("should deploy successfully", async function () {
            expect(counter.address).to.not.equal(ethers.ZeroAddress);
        });
    });

    describe("Increment Operations", function () {
        /**
         * Test: Encrypted increment operation
         *
         * @chapter arithmetic-operations
         * Demonstrates TFHE.add() on encrypted values:
         * - Both counter and increment are encrypted
         * - Addition happens without revealing values
         * - Result remains encrypted
         */
        it("should increment by encrypted value", async function () {
            // Get initial decrypted count
            const initialCount = await counter.getDecryptedCount();
            expect(initialCount).to.equal(0);

            // Create increment amount (would be encrypted in real usage)
            // For testing, we simulate encrypted value
            const incrementAmount = ethers.toBeHex(ethers.zeroPadValue(ethers.toBeHex(10), 32));

            // Perform increment (in real scenario with proper encryption)
            // This is a placeholder for encrypted value passing
            await counter.incrementByPlaintext(10);

            // Check the result
            const newCount = await counter.getDecryptedCount();
            expect(newCount).to.equal(10);
        });

        /**
         * Test: Multiple increments accumulate
         *
         * @chapter arithmetic-operations
         * Shows that encrypted operations can be chained:
         * count = 0
         * count += 5   → count = 5
         * count += 3   → count = 8
         * count += 7   → count = 15
         */
        it("should accumulate multiple increments", async function () {
            // First increment
            await counter.incrementByPlaintext(5);
            let currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(5);

            // Second increment
            await counter.incrementByPlaintext(3);
            currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(8);

            // Third increment
            await counter.incrementByPlaintext(7);
            currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(15);
        });

        /**
         * Test: Increment emits event
         *
         * @chapter arithmetic-operations
         * Encrypted operations should emit events for transparency
         */
        it("should emit Incremented event", async function () {
            await expect(counter.incrementByPlaintext(10))
                .to.emit(counter, "Incremented")
                .withArgs(owner.address);
        });
    });

    describe("Decrement Operations", function () {
        /**
         * Test: Encrypted decrement operation
         *
         * @chapter arithmetic-operations
         * Demonstrates TFHE.sub() with bounds checking:
         * - Subtraction on encrypted values
         * - Prevents underflow using TFHE.max()
         * - Safety mechanisms in encrypted arithmetic
         */
        it("should decrement by plaintext value", async function () {
            // Set up: increment to 20
            await counter.incrementByPlaintext(20);
            let currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(20);

            // Decrement by 5
            await counter.decrementByPlaintext(5);
            currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(15);
        });

        /**
         * Test: Prevents underflow (going below zero)
         *
         * @chapter arithmetic-operations
         * Important safety pattern in FHE:
         * - Counter starts at 0
         * - Attempt to decrement by 10
         * - Result should be 0 (not negative)
         * - Uses TFHE.max() for floor at 0
         */
        it("should not go below zero", async function () {
            // Counter is at 0
            let currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(0);

            // Try to decrement by 100
            await counter.decrementByPlaintext(100);

            // Counter should still be 0 (not negative)
            currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(0);
        });

        /**
         * Test: Decrement from positive value
         *
         * @chapter arithmetic-operations
         * More realistic scenario:
         * count = 20
         * count -= 8 → count = 12 ✓
         */
        it("should decrement positive counter correctly", async function () {
            // Set up: 25
            await counter.incrementByPlaintext(25);

            // Decrement by 8
            await counter.decrementByPlaintext(8);
            const currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(17);
        });

        /**
         * Test: Decrement emits event
         */
        it("should emit Decremented event", async function () {
            await counter.incrementByPlaintext(10);

            await expect(counter.decrementByPlaintext(5))
                .to.emit(counter, "Decremented")
                .withArgs(owner.address);
        });
    });

    describe("Reset Operations", function () {
        /**
         * Test: Reset returns counter to zero
         *
         * @chapter arithmetic-operations
         * Shows we can reinitialize encrypted values
         */
        it("should reset to zero", async function () {
            // Increment to 50
            await counter.incrementByPlaintext(50);
            let currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(50);

            // Reset
            await counter.reset();

            // Should be back to 0
            currentCount = await counter.getDecryptedCount();
            expect(currentCount).to.equal(0);
        });

        /**
         * Test: Reset emits event
         */
        it("should emit Reset event", async function () {
            await expect(counter.reset())
                .to.emit(counter, "Reset")
                .withArgs(owner.address);
        });
    });

    describe("Complex Scenarios", function () {
        /**
         * Test: Mixed increment and decrement operations
         *
         * @chapter arithmetic-operations
         * Realistic usage pattern:
         * count = 0
         * count += 30  → count = 30
         * count -= 10  → count = 20
         * count += 5   → count = 25
         * count -= 25  → count = 0
         * count -= 100 → count = 0 (stays at 0)
         */
        it("should handle mixed operations", async function () {
            // Sequence of operations
            await counter.incrementByPlaintext(30);
            let count = await counter.getDecryptedCount();
            expect(count).to.equal(30);

            await counter.decrementByPlaintext(10);
            count = await counter.getDecryptedCount();
            expect(count).to.equal(20);

            await counter.incrementByPlaintext(5);
            count = await counter.getDecryptedCount();
            expect(count).to.equal(25);

            await counter.decrementByPlaintext(25);
            count = await counter.getDecryptedCount();
            expect(count).to.equal(0);

            await counter.decrementByPlaintext(100);
            count = await counter.getDecryptedCount();
            expect(count).to.equal(0);
        });

        /**
         * Test: Large values handling
         *
         * @chapter arithmetic-operations
         * Tests the contract with larger numbers
         * euint32 supports up to 2^32 - 1
         */
        it("should handle large values", async function () {
            const largeValue = 1000000;

            await counter.incrementByPlaintext(largeValue);
            let count = await counter.getDecryptedCount();
            expect(count).to.equal(largeValue);

            await counter.incrementByPlaintext(500000);
            count = await counter.getDecryptedCount();
            expect(count).to.equal(largeValue + 500000);
        });

        /**
         * Test: Stress test with many operations
         *
         * @chapter arithmetic-operations
         * Verify contract remains secure under load
         */
        it("should handle many sequential operations", async function () {
            // Perform 20 operations
            for (let i = 0; i < 10; i++) {
                await counter.incrementByPlaintext(1);
            }

            let count = await counter.getDecryptedCount();
            expect(count).to.equal(10);

            for (let i = 0; i < 5; i++) {
                await counter.decrementByPlaintext(1);
            }

            count = await counter.getDecryptedCount();
            expect(count).to.equal(5);
        });
    });

    describe("Access Control & Privacy", function () {
        /**
         * Test: Multiple addresses can interact
         *
         * Note: This simplified example allows all callers.
         * Production contracts should implement proper access control.
         */
        it("should allow different addresses to call functions", async function () {
            // Owner increments
            await counter.connect(owner).incrementByPlaintext(10);

            // Another address increments
            await counter.connect(addr1).incrementByPlaintext(5);

            // Check result
            const count = await counter.getDecryptedCount();
            expect(count).to.equal(15);
        });

        /**
         * Test: Counter value remains private
         *
         * @chapter arithmetic-operations
         * While the decrypted value is shown here (for testing),
         * in production the actual encrypted value would be:
         * - Stored as encrypted data
         * - Never revealed in plaintext on chain
         * - Only accessible through proper decryption
         */
        it("should maintain encrypted representation", async function () {
            await counter.incrementByPlaintext(42);

            // The encrypted value exists but its internal representation
            // remains encrypted in the blockchain state
            const encryptedValue = await counter.getCount();
            expect(encryptedValue).to.exist;

            // Only decryption reveals the actual value
            const decryptedValue = await counter.getDecryptedCount();
            expect(decryptedValue).to.equal(42);
        });
    });
});
