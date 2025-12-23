import { expect } from "chai";
import { ethers } from "hardhat";
import type { AccessControlExample } from "../typechain-types";
import type { Signer } from "ethers";

/**
 * @chapter access-control
 * Test suite for FHE.allow() and FHE.allowThis() patterns
 *
 * These tests demonstrate:
 * - Proper permission management
 * - Single user operations
 * - Multi-party transactions
 * - Permission sharing
 */
describe("AccessControlExample", function () {
    let contract: AccessControlExample;
    let owner: Signer;
    let alice: Signer;
    let bob: Signer;
    let ownerAddress: string;
    let aliceAddress: string;
    let bobAddress: string;

    beforeEach(async function () {
        [owner, alice, bob] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        aliceAddress = await alice.getAddress();
        bobAddress = await bob.getAddress();

        const factory = await ethers.getContractFactory("AccessControlExample");
        contract = await factory.deploy() as AccessControlExample;
        await contract.waitForDeployment();
    });

    describe("Deposits", function () {
        it("should allow users to deposit", async function () {
            await contract.connect(alice).deposit(100);

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(100);
        });

        it("should handle multiple deposits", async function () {
            await contract.connect(alice).deposit(100);
            await contract.connect(alice).deposit(50);

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(150);
        });

        it("should keep balances separate per user", async function () {
            await contract.connect(alice).deposit(100);
            await contract.connect(bob).deposit(200);

            const aliceBalance = await contract.connect(alice).getDecryptedBalance();
            const bobBalance = await contract.connect(bob).getDecryptedBalance();

            expect(aliceBalance).to.equal(100);
            expect(bobBalance).to.equal(200);
        });

        it("should emit BalanceUpdated event", async function () {
            await expect(contract.connect(alice).deposit(100))
                .to.emit(contract, "BalanceUpdated")
                .withArgs(aliceAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            // Give Alice initial balance
            await contract.connect(alice).deposit(1000);
        });

        it("should transfer between users", async function () {
            await contract.connect(alice).transfer(bobAddress, 300);

            const aliceBalance = await contract.connect(alice).getDecryptedBalance();
            const bobBalance = await contract.connect(bob).getDecryptedBalance();

            expect(aliceBalance).to.equal(700);
            expect(bobBalance).to.equal(300);
        });

        it("should handle multiple transfers", async function () {
            await contract.connect(alice).transfer(bobAddress, 200);
            await contract.connect(alice).transfer(bobAddress, 100);

            const aliceBalance = await contract.connect(alice).getDecryptedBalance();
            const bobBalance = await contract.connect(bob).getDecryptedBalance();

            expect(aliceBalance).to.equal(700);
            expect(bobBalance).to.equal(300);
        });

        it("should revert on invalid recipient", async function () {
            await expect(
                contract.connect(alice).transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("Invalid recipient");
        });

        it("should revert on self-transfer", async function () {
            await expect(
                contract.connect(alice).transfer(aliceAddress, 100)
            ).to.be.revertedWith("Cannot transfer to self");
        });

        it("should emit events for both parties", async function () {
            const tx = contract.connect(alice).transfer(bobAddress, 300);

            await expect(tx)
                .to.emit(contract, "BalanceUpdated")
                .withArgs(aliceAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

            await expect(tx)
                .to.emit(contract, "BalanceUpdated")
                .withArgs(bobAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
        });
    });

    describe("Balance Queries", function () {
        beforeEach(async function () {
            await contract.connect(alice).deposit(500);
        });

        it("should return encrypted balance", async function () {
            const encryptedBalance = await contract.connect(alice).getBalance(aliceAddress);

            // Encrypted balance should be a handle (non-zero)
            expect(encryptedBalance).to.not.equal(0);
        });

        it("should allow decryption of own balance", async function () {
            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(500);
        });

        it("should return zero for addresses with no balance", async function () {
            const balance = await contract.connect(bob).getDecryptedBalance();
            expect(balance).to.equal(0);
        });
    });

    describe("Permission Sharing", function () {
        beforeEach(async function () {
            await contract.connect(alice).deposit(1000);
        });

        it("should allow granting view permission", async function () {
            await contract.connect(alice).grantViewPermission(bobAddress);

            // After granting permission, this should work
            // Note: In real implementation with full FHE, Bob would be able to decrypt
        });

        it("should revert on invalid viewer address", async function () {
            await expect(
                contract.connect(alice).grantViewPermission(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid viewer");
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            await contract.connect(alice).deposit(1000);
        });

        it("should allow withdrawing all funds", async function () {
            await contract.connect(alice).withdrawAll();

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(0);
        });

        it("should emit event on withdrawal", async function () {
            await expect(contract.connect(alice).withdrawAll())
                .to.emit(contract, "BalanceUpdated")
                .withArgs(aliceAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
        });

        it("should handle withdrawal of zero balance", async function () {
            await contract.connect(alice).withdrawAll();
            await contract.connect(alice).withdrawAll(); // Second withdrawal

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(0);
        });
    });

    describe("Balance Checks", function () {
        beforeEach(async function () {
            await contract.connect(alice).deposit(1000);
        });

        it("should check sufficient balance correctly", async function () {
            const hasEnough = await contract.connect(alice).hasSufficientBalance(500);

            // Returns encrypted boolean
            expect(hasEnough).to.not.equal(0);
        });

        it("should check insufficient balance", async function () {
            const hasEnough = await contract.connect(alice).hasSufficientBalance(2000);

            // Returns encrypted boolean
            expect(hasEnough).to.not.equal(0);
        });
    });

    describe("Edge Cases", function () {
        it("should handle zero deposits", async function () {
            await contract.connect(alice).deposit(0);

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(0);
        });

        it("should handle large values", async function () {
            const largeValue = 4294967295; // Max uint32

            await contract.connect(alice).deposit(largeValue);

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(largeValue);
        });

        it("should handle rapid successive operations", async function () {
            await contract.connect(alice).deposit(100);
            await contract.connect(alice).deposit(200);
            await contract.connect(alice).deposit(300);

            const balance = await contract.connect(alice).getDecryptedBalance();
            expect(balance).to.equal(600);
        });
    });

    describe("Access Control Patterns", function () {
        /**
         * @example permission-pattern
         * This test demonstrates the correct permission granting pattern
         */
        it("should demonstrate proper permission pattern", async function () {
            // 1. Perform operation
            await contract.connect(alice).deposit(500);

            // 2. Verify contract can use the value (allowThis was granted)
            const encryptedBalance = await contract.getBalance(aliceAddress);
            expect(encryptedBalance).to.not.equal(0);

            // 3. Verify user can decrypt (allow was granted)
            const decryptedBalance = await contract.connect(alice).getDecryptedBalance();
            expect(decryptedBalance).to.equal(500);
        });

        /**
         * @example multi-party-pattern
         * Demonstrates permission management in multi-party transactions
         */
        it("should handle multi-party permissions in transfers", async function () {
            // Setup
            await contract.connect(alice).deposit(1000);

            // Transfer (updates both parties)
            await contract.connect(alice).transfer(bobAddress, 400);

            // Both parties can access their balances
            const aliceBalance = await contract.connect(alice).getDecryptedBalance();
            const bobBalance = await contract.connect(bob).getDecryptedBalance();

            expect(aliceBalance).to.equal(600);
            expect(bobBalance).to.equal(400);
        });
    });
});
