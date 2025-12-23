import { expect } from "chai";
import { ethers } from "hardhat";

describe("EncryptedComparison", function () {
    let contract: any;

    beforeEach(async function () {
        const factory = await ethers.getContractFactory("EncryptedComparison");
        contract = await factory.deploy();
        await contract.waitForDeployment();
    });

    describe("Equality Operations", function () {
        it("should correctly identify equal values", async function () {
            await contract.setValues(42, 42);
            await contract.isEqual();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });

        it("should correctly identify unequal values", async function () {
            await contract.setValues(10, 20);
            await contract.isEqual();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.false;
        });

        it("should correctly identify not equal values", async function () {
            await contract.setValues(10, 20);
            await contract.isNotEqual();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });
    });

    describe("Greater Than Operations", function () {
        it("should identify when A > B", async function () {
            await contract.setValues(100, 50);
            await contract.isGreaterThan();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });

        it("should identify when A is not > B", async function () {
            await contract.setValues(50, 100);
            await contract.isGreaterThan();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.false;
        });

        it("should handle equal values for GTE", async function () {
            await contract.setValues(75, 75);
            await contract.isGreaterThanOrEqual();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });
    });

    describe("Less Than Operations", function () {
        it("should identify when A < B", async function () {
            await contract.setValues(50, 100);
            await contract.isLessThan();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });

        it("should handle equal values for LTE", async function () {
            await contract.setValues(75, 75);
            await contract.isLessThanOrEqual();

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });
    });

    describe("Range Operations", function () {
        it("should correctly identify value in range", async function () {
            await contract.setValues(50, 0); // Using valueA

            // Check if 50 is in range [0, 100]
            // Note: We need to get the encrypted valueA
            const [a] = await contract.getDecryptedValues();
            // This is simplified - in real implementation you'd work with encrypted values

            await contract.isInRange(
                await contract.valueA ? await contract.valueA() : 50,
                0,
                100
            );

            const result = await contract.getDecryptedResult();
            expect(result).to.be.true;
        });
    });

    describe("Conditional Logic", function () {
        it("should perform conditional increment when below threshold", async function () {
            await contract.setValues(50, 0);

            // If value < 100, increment by 25
            await contract.conditionalIncrement(100, 25);

            const [a] = await contract.getDecryptedValues();
            expect(a).to.equal(75); // 50 + 25
        });

        it("should not increment when above threshold", async function () {
            await contract.setValues(150, 0);

            // If value < 100, increment by 25 (but 150 is not < 100)
            await contract.conditionalIncrement(100, 25);

            const [a] = await contract.getDecryptedValues();
            expect(a).to.equal(150); // Unchanged
        });
    });

    describe("Events", function () {
        it("should emit ValuesSet event", async function () {
            await expect(contract.setValues(10, 20))
                .to.emit(contract, "ValuesSet");
        });

        it("should emit ComparisonPerformed event", async function () {
            await contract.setValues(10, 20);

            await expect(contract.isEqual())
                .to.emit(contract, "ComparisonPerformed");
        });
    });
});
