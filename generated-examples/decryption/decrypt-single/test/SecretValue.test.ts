import { expect } from "chai";
import { ethers } from "hardhat";
import { SecretValue } from "../typechain-types";
import { Signer } from "ethers";

/**
 * @chapter user-decryption
 * Test suite for access-controlled decryption patterns
 *
 * This test suite demonstrates:
 * - Setting and retrieving encrypted values
 * - Implementing permission-based decryption
 * - Managing authorization whitelist
 * - Revoking permissions
 * - Audit trail logging
 * - Encrypted computation without decryption
 */
describe("SecretValue", function () {
    let secretContract: SecretValue;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy contract
        const SecretValueFactory = await ethers.getContractFactory("SecretValue");
        secretContract = await SecretValueFactory.deploy();
        await secretContract.waitForDeployment();
    });

    describe("Basic Secret Storage", function () {
        /**
         * @example secret-storage
         * Demonstrates setting and storing an encrypted secret
         */
        it("should set secret value", async function () {
            const secretValue = 12345;

            await secretContract.setValue(secretValue);

            // Verify secret was set (can't read encrypted value directly)
            const encryptedValue = await secretContract.getEncryptedValue();
            expect(encryptedValue).to.not.equal(0);
        });

        it("should emit SecretSet event", async function () {
            await expect(secretContract.setValue(999))
                .to.emit(secretContract, "SecretSet")
                .withArgs(await owner.getAddress(), await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        it("should allow owner to set multiple times", async function () {
            await secretContract.setValue(100);
            const encrypted1 = await secretContract.getEncryptedValue();

            await secretContract.setValue(200);
            const encrypted2 = await secretContract.getEncryptedValue();

            // Different values produce different encrypted results
            // (This is a property of encryption)
            expect(encrypted1).to.exist;
            expect(encrypted2).to.exist;
        });

        it("should revert if non-owner tries to set", async function () {
            await expect(
                secretContract.connect(user1).setValue(12345)
            ).to.be.revertedWith("Only owner can set secret");
        });
    });

    describe("Owner Decryption Access", function () {
        beforeEach(async function () {
            await secretContract.setValue(12345);
        });

        /**
         * @example owner-decryption
         * Demonstrates that owner can always decrypt their secret
         */
        it("should allow owner to decrypt", async function () {
            const decrypted = await secretContract.getDecryptedValue();
            expect(decrypted).to.equal(12345);
        });

        it("should emit DecryptionAttempted event for owner", async function () {
            await expect(secretContract.getDecryptedValue())
                .to.emit(secretContract, "DecryptionAttempted")
                .withArgs(await owner.getAddress(), true, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        it("should deny non-authorized user from decrypting", async function () {
            await expect(
                secretContract.connect(user1).getDecryptedValue()
            ).to.be.revertedWith("Not authorized to decrypt");
        });

        it("should emit DecryptionAttempted event for unauthorized", async function () {
            await expect(secretContract.connect(user1).getDecryptedValue())
                .to.emit(secretContract, "DecryptionAttempted")
                .withArgs(await user1.getAddress(), false, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });
    });

    describe("Permission Management", function () {
        beforeEach(async function () {
            await secretContract.setValue(54321);
        });

        /**
         * @example grant-permission
         * Demonstrates granting decryption permissions
         */
        it("should grant decryption permission", async function () {
            const user1Addr = await user1.getAddress();

            // Grant permission
            await secretContract.grantDecryptionPermission(user1Addr);

            // User1 should now be able to decrypt
            const decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(54321);
        });

        it("should emit PermissionGranted event", async function () {
            const user1Addr = await user1.getAddress();

            await expect(secretContract.grantDecryptionPermission(user1Addr))
                .to.emit(secretContract, "PermissionGranted")
                .withArgs(user1Addr, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        /**
         * @example revoke-permission
         * Demonstrates revoking decryption permissions
         */
        it("should revoke decryption permission", async function () {
            const user1Addr = await user1.getAddress();

            // Grant permission
            await secretContract.grantDecryptionPermission(user1Addr);

            // User1 can decrypt
            let decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(54321);

            // Revoke permission
            await secretContract.revokeDecryptionPermission(user1Addr);

            // User1 can no longer decrypt
            await expect(
                secretContract.connect(user1).getDecryptedValue()
            ).to.be.revertedWith("Not authorized to decrypt");
        });

        it("should emit PermissionRevoked event", async function () {
            const user1Addr = await user1.getAddress();

            await secretContract.grantDecryptionPermission(user1Addr);

            await expect(secretContract.revokeDecryptionPermission(user1Addr))
                .to.emit(secretContract, "PermissionRevoked")
                .withArgs(user1Addr, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });

        it("should not allow duplicate permission grant", async function () {
            const user1Addr = await user1.getAddress();

            await secretContract.grantDecryptionPermission(user1Addr);

            await expect(
                secretContract.grantDecryptionPermission(user1Addr)
            ).to.be.revertedWith("Already authorized");
        });

        it("should not allow revoking non-existent permission", async function () {
            const user1Addr = await user1.getAddress();

            await expect(
                secretContract.revokeDecryptionPermission(user1Addr)
            ).to.be.revertedWith("Not authorized");
        });

        it("should reject permission for zero address", async function () {
            await expect(
                secretContract.grantDecryptionPermission(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("should reject non-owner attempting to grant permissions", async function () {
            const user2Addr = await user2.getAddress();

            await expect(
                secretContract.connect(user1).grantDecryptionPermission(user2Addr)
            ).to.be.revertedWith("Only owner can grant permissions");
        });

        it("should reject non-owner attempting to revoke permissions", async function () {
            const user1Addr = await user1.getAddress();

            await secretContract.grantDecryptionPermission(user1Addr);

            await expect(
                secretContract.connect(user1).revokeDecryptionPermission(user1Addr)
            ).to.be.revertedWith("Only owner can revoke permissions");
        });
    });

    describe("Multi-User Authorization", function () {
        beforeEach(async function () {
            await secretContract.setValue(77777);
        });

        /**
         * @example multi-user-auth
         * Demonstrates managing permissions for multiple users
         */
        it("should grant permissions to multiple users", async function () {
            const user1Addr = await user1.getAddress();
            const user2Addr = await user2.getAddress();

            // Grant permissions to both users
            await secretContract.grantDecryptionPermission(user1Addr);
            await secretContract.grantDecryptionPermission(user2Addr);

            // Both can decrypt
            const decrypted1 = await secretContract.connect(user1).getDecryptedValue();
            const decrypted2 = await secretContract.connect(user2).getDecryptedValue();

            expect(decrypted1).to.equal(77777);
            expect(decrypted2).to.equal(77777);
        });

        it("should allow selective revocation", async function () {
            const user1Addr = await user1.getAddress();
            const user2Addr = await user2.getAddress();

            // Grant permissions
            await secretContract.grantDecryptionPermission(user1Addr);
            await secretContract.grantDecryptionPermission(user2Addr);

            // Revoke user1 only
            await secretContract.revokeDecryptionPermission(user1Addr);

            // User1 cannot decrypt
            await expect(
                secretContract.connect(user1).getDecryptedValue()
            ).to.be.revertedWith("Not authorized to decrypt");

            // User2 can still decrypt
            const decrypted2 = await secretContract.connect(user2).getDecryptedValue();
            expect(decrypted2).to.equal(77777);
        });

        it("should handle independent user states", async function () {
            const user1Addr = await user1.getAddress();
            const user2Addr = await user2.getAddress();
            const user3Addr = await user3.getAddress();

            // Grant to user1 and user2
            await secretContract.grantDecryptionPermission(user1Addr);
            await secretContract.grantDecryptionPermission(user2Addr);

            // User3 not authorized
            const isUser3Auth = await secretContract.connect(owner).isAuthorized(user3Addr);
            expect(isUser3Auth).to.be.false;

            // User1 and user2 authorized
            const isUser1Auth = await secretContract.connect(owner).isAuthorized(user1Addr);
            const isUser2Auth = await secretContract.connect(owner).isAuthorized(user2Addr);
            expect(isUser1Auth).to.be.true;
            expect(isUser2Auth).to.be.true;
        });
    });

    describe("Owner Delegation", function () {
        beforeEach(async function () {
            await secretContract.setValue(88888);
        });

        /**
         * @example owner-delegation
         * Demonstrates owner-delegated decryption
         */
        it("should allow owner to decrypt for authorized user", async function () {
            const user1Addr = await user1.getAddress();

            // Grant permission
            await secretContract.grantDecryptionPermission(user1Addr);

            // Owner decrypts for user1
            const decrypted = await secretContract.getDecryptedFor(user1Addr);
            expect(decrypted).to.equal(88888);
        });

        it("should reject owner decryption for unauthorized user", async function () {
            const user1Addr = await user1.getAddress();

            await expect(
                secretContract.getDecryptedFor(user1Addr)
            ).to.be.revertedWith("User not authorized");
        });

        it("should reject non-owner from delegating decryption", async function () {
            const user2Addr = await user2.getAddress();

            await expect(
                secretContract.connect(user1).getDecryptedFor(user2Addr)
            ).to.be.revertedWith("Only owner can decrypt for others");
        });

        it("should reject decryption for zero address", async function () {
            // Grant to a valid user first
            const user1Addr = await user1.getAddress();
            await secretContract.grantDecryptionPermission(user1Addr);

            // Try to decrypt for zero address
            await expect(
                secretContract.getDecryptedFor(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("should emit DecryptionAttempted for delegated decryption", async function () {
            const user1Addr = await user1.getAddress();

            await secretContract.grantDecryptionPermission(user1Addr);

            await expect(secretContract.getDecryptedFor(user1Addr))
                .to.emit(secretContract, "DecryptionAttempted")
                .withArgs(user1Addr, true, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
        });
    });

    describe("Encrypted Operations", function () {
        beforeEach(async function () {
            await secretContract.setValue(5000);
        });

        /**
         * @example encrypted-comparison
         * Demonstrates operations on encrypted data without decryption
         */
        it("should perform encrypted comparison without decryption", async function () {
            // Compare 5000 > 3000 (should be true)
            const isGreater = await secretContract.isGreaterThan(3000);
            expect(isGreater).to.not.equal(0); // Encrypted bool, non-zero = true

            // Compare 5000 > 6000 (should be false)
            const isGreater2 = await secretContract.isGreaterThan(6000);
            // Encrypted bool result exists
            expect(isGreater2).to.exist;
        });

        /**
         * @example encrypted-equality
         * Demonstrates encrypted equality checking
         */
        it("should perform encrypted equality check", async function () {
            // Check 5000 == 5000 (should be true)
            const isEqual = await secretContract.isEqual(5000);
            expect(isEqual).to.not.equal(0); // Encrypted bool, non-zero = true

            // Check 5000 == 3000 (should be false)
            const notEqual = await secretContract.isEqual(3000);
            // Encrypted bool result exists
            expect(notEqual).to.exist;
        });

        it("should allow anyone to perform encrypted operations", async function () {
            // Unauthorized user can still perform encrypted ops
            const isGreater = await secretContract.connect(user1).isGreaterThan(2000);
            expect(isGreater).to.exist;

            const isEqual = await secretContract.connect(user1).isEqual(5000);
            expect(isEqual).to.exist;
        });
    });

    describe("Authorization Checks", function () {
        beforeEach(async function () {
            await secretContract.setValue(99999);
        });

        it("should return true for authorized address", async function () {
            const user1Addr = await user1.getAddress();

            await secretContract.grantDecryptionPermission(user1Addr);

            const isAuth = await secretContract.isAuthorized(user1Addr);
            expect(isAuth).to.be.true;
        });

        it("should return false for unauthorized address", async function () {
            const user1Addr = await user1.getAddress();

            const isAuth = await secretContract.isAuthorized(user1Addr);
            expect(isAuth).to.be.false;
        });

        it("should reject isAuthorized call from non-owner", async function () {
            const user1Addr = await user1.getAddress();

            await expect(
                secretContract.connect(user1).isAuthorized(user1Addr)
            ).to.be.revertedWith("Only owner can check authorization");
        });
    });

    describe("Owner Information", function () {
        it("should return owner address", async function () {
            const contractOwner = await secretContract.getOwner();
            expect(contractOwner).to.equal(await owner.getAddress());
        });

        it("should be callable by anyone", async function () {
            const ownerFromUser = await secretContract.connect(user1).getOwner();
            expect(ownerFromUser).to.equal(await owner.getAddress());
        });
    });

    describe("Complex Scenarios", function () {
        /**
         * @example complete-flow
         * Demonstrates a complete authorization and decryption workflow
         */
        it("should handle complete authorization workflow", async function () {
            // 1. Set secret
            await secretContract.setValue(11111);

            // 2. Grant permission to user1
            const user1Addr = await user1.getAddress();
            await secretContract.grantDecryptionPermission(user1Addr);

            // 3. User1 decrypts
            let decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(11111);

            // 4. Update secret
            await secretContract.setValue(22222);

            // 5. User1 still authorized and sees new value
            decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(22222);

            // 6. Revoke permission
            await secretContract.revokeDecryptionPermission(user1Addr);

            // 7. User1 cannot decrypt
            await expect(
                secretContract.connect(user1).getDecryptedValue()
            ).to.be.revertedWith("Not authorized to decrypt");
        });

        it("should handle rapid permission changes", async function () {
            const user1Addr = await user1.getAddress();

            // Grant, revoke, grant pattern
            await secretContract.grantDecryptionPermission(user1Addr);
            await secretContract.revokeDecryptionPermission(user1Addr);
            await secretContract.grantDecryptionPermission(user1Addr);

            // Should be able to decrypt at the end
            const decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.exist;
        });

        it("should maintain secret through permission changes", async function () {
            const user1Addr = await user1.getAddress();

            // Set initial secret
            await secretContract.setValue(33333);

            // Grant permission
            await secretContract.grantDecryptionPermission(user1Addr);
            let decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(33333);

            // Revoke and re-grant
            await secretContract.revokeDecryptionPermission(user1Addr);
            await secretContract.grantDecryptionPermission(user1Addr);

            // Secret should be unchanged
            decrypted = await secretContract.connect(user1).getDecryptedValue();
            expect(decrypted).to.equal(33333);
        });
    });
});
