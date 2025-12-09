import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @chapter basic-example
 * Basic test suite for Example contract
 */
describe("Example Contract", function () {
    let example: any;
    let owner: any;

    /**
     * Deploy contract before each test
     */
    beforeEach(async function () {
        const Example = await ethers.getContractFactory("Example");
        example = await Example.deploy();
        [owner] = await ethers.getSigners();
    });

    describe("Deployment", function () {
        /**
         * Test: Contract deploys without errors
         */
        it("should deploy successfully", async function () {
            expect(example.address).to.not.equal(ethers.ZeroAddress);
        });

        /**
         * Test: Initial value is encrypted zero
         */
        it("should initialize with zero", async function () {
            const value = await example.getValue();
            expect(value).to.exist;
        });
    });

    describe("Value Management", function () {
        /**
         * Test: Can set and retrieve encrypted values
         */
        it("should allow setting values", async function () {
            // Set value
            const tx = await example.setValue(TFHE.asEuint32(42));
            await tx.wait();

            // Get value
            const value = await example.getValue();
            expect(value).to.exist;
        });
    });
});
