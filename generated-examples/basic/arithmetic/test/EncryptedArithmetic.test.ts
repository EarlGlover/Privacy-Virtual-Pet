import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedArithmetic } from "../typechain-types";
import { Signer } from "ethers";

/**
 * @chapter basic-operations
 * Test suite for encrypted arithmetic operations
 *
 * This test suite demonstrates:
 * - Setting up encrypted values
 * - Performing arithmetic operations on encrypted data
 * - Verifying results through decryption
 * - Testing edge cases and bounds
 */
describe("EncryptedArithmetic", function () {
    let arithmeticContract: EncryptedArithmetic;
    let owner: Signer;
    let user: Signer;

    beforeEach(async function () {
        // Get signers
        [owner, user] = await ethers.getSigners();

        // Deploy contract
        const EncryptedArithmeticFactory = await ethers.getContractFactory("EncryptedArithmetic");
        arithmeticContract = await EncryptedArithmeticFactory.deploy();
        await arithmeticContract.waitForDeployment();
    });

    describe("Basic Addition", function () {
        /**
         * @example basic-addition
         * Demonstrates encrypted addition with plaintext inputs
         */
        it("should add two numbers correctly", async function () {
            // Set operands: 10 + 20 = 30
            await arithmeticContract.setOperandsPlaintext(10, 20);

            // Perform addition
            await arithmeticContract.add();

            // Verify result
            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(30);
        });

        it("should handle large numbers", async function () {
            const a = 1000000;
            const b = 2000000;

            await arithmeticContract.setOperandsPlaintext(a, b);
            await arithmeticContract.add();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(a + b);
        });

        it("should handle zero addition", async function () {
            await arithmeticContract.setOperandsPlaintext(100, 0);
            await arithmeticContract.add();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(100);
        });
    });

    describe("Basic Subtraction", function () {
        /**
         * @example basic-subtraction
         * Demonstrates encrypted subtraction
         */
        it("should subtract two numbers correctly", async function () {
            // Set operands: 50 - 20 = 30
            await arithmeticContract.setOperandsPlaintext(50, 20);

            // Perform subtraction
            await arithmeticContract.subtract();

            // Verify result
            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(30);
        });

        it("should handle subtraction to zero", async function () {
            await arithmeticContract.setOperandsPlaintext(100, 100);
            await arithmeticContract.subtract();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(0);
        });
    });

    describe("Basic Multiplication", function () {
        /**
         * @example basic-multiplication
         * Demonstrates encrypted multiplication
         */
        it("should multiply two numbers correctly", async function () {
            // Set operands: 5 * 6 = 30
            await arithmeticContract.setOperandsPlaintext(5, 6);

            // Perform multiplication
            await arithmeticContract.multiply();

            // Verify result
            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(30);
        });

        it("should handle multiplication by zero", async function () {
            await arithmeticContract.setOperandsPlaintext(100, 0);
            await arithmeticContract.multiply();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(0);
        });

        it("should handle multiplication by one", async function () {
            await arithmeticContract.setOperandsPlaintext(42, 1);
            await arithmeticContract.multiply();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(42);
        });
    });

    describe("Minimum and Maximum", function () {
        /**
         * @example min-max-operations
         * Demonstrates encrypted comparison operations
         */
        it("should find minimum correctly", async function () {
            await arithmeticContract.setOperandsPlaintext(100, 50);
            await arithmeticContract.minimum();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(50);
        });

        it("should find maximum correctly", async function () {
            await arithmeticContract.setOperandsPlaintext(100, 50);
            await arithmeticContract.maximum();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(100);
        });

        it("should handle equal values for min", async function () {
            await arithmeticContract.setOperandsPlaintext(75, 75);
            await arithmeticContract.minimum();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(75);
        });

        it("should handle equal values for max", async function () {
            await arithmeticContract.setOperandsPlaintext(75, 75);
            await arithmeticContract.maximum();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(75);
        });
    });

    describe("Chained Operations", function () {
        /**
         * @example chained-operations
         * Demonstrates composing multiple encrypted operations
         */
        it("should perform chained operations: (a + b) * 2", async function () {
            // (10 + 20) * 2 = 60
            await arithmeticContract.setOperandsPlaintext(10, 20);
            await arithmeticContract.chainedOperation();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(60);
        });

        it("should handle complex chained operations", async function () {
            // (100 + 50) * 2 = 300
            await arithmeticContract.setOperandsPlaintext(100, 50);
            await arithmeticContract.chainedOperation();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(300);
        });
    });

    describe("Safe Arithmetic", function () {
        /**
         * @example safe-arithmetic
         * Demonstrates overflow protection using bounds checking
         */
        it("should cap result at maximum value", async function () {
            const maxValue = 100;

            // This would normally give 150, but will be capped at 100
            await arithmeticContract.setOperandsPlaintext(80, 70);

            // Create encrypted operands
            const a = await arithmeticContract.operandA;
            const b = await arithmeticContract.operandB;

            // Note: In a real implementation, you'd need to properly create encrypted values
            // This is simplified for demonstration
            await arithmeticContract.safeAdd(a, b, maxValue);

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.be.at.most(maxValue);
        });
    });

    describe("Events", function () {
        it("should emit OperandsSet event", async function () {
            await expect(arithmeticContract.setOperandsPlaintext(10, 20))
                .to.emit(arithmeticContract, "OperandsSet");
        });

        it("should emit OperationPerformed event on addition", async function () {
            await arithmeticContract.setOperandsPlaintext(10, 20);

            await expect(arithmeticContract.add())
                .to.emit(arithmeticContract, "OperationPerformed")
                .withArgs("add", await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
        });

        it("should emit OperationPerformed event on subtraction", async function () {
            await arithmeticContract.setOperandsPlaintext(50, 20);

            await expect(arithmeticContract.subtract())
                .to.emit(arithmeticContract, "OperationPerformed");
        });
    });

    describe("View Functions", function () {
        it("should return encrypted result", async function () {
            await arithmeticContract.setOperandsPlaintext(10, 20);
            await arithmeticContract.add();

            const encryptedResult = await arithmeticContract.getResult();
            // Encrypted result should not be zero (it's a handle)
            expect(encryptedResult).to.not.equal(0);
        });

        it("should decrypt operands correctly", async function () {
            await arithmeticContract.setOperandsPlaintext(42, 84);

            const [a, b] = await arithmeticContract.getDecryptedOperands();
            expect(a).to.equal(42);
            expect(b).to.equal(84);
        });
    });

    describe("Edge Cases", function () {
        it("should handle maximum uint32 value", async function () {
            const maxUint32 = 4294967295;
            await arithmeticContract.setOperandsPlaintext(maxUint32, 0);
            await arithmeticContract.add();

            const result = await arithmeticContract.getDecryptedResult();
            expect(result).to.equal(maxUint32);
        });

        it("should handle all zero operations", async function () {
            await arithmeticContract.setOperandsPlaintext(0, 0);

            await arithmeticContract.add();
            expect(await arithmeticContract.getDecryptedResult()).to.equal(0);

            await arithmeticContract.multiply();
            expect(await arithmeticContract.getDecryptedResult()).to.equal(0);
        });
    });
});
