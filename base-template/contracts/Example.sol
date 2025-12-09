// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

/**
 * @title Example Contract
 * @notice This is a template contract for FHEVM examples
 * @dev Demonstrates basic encrypted state management
 */
contract Example {
    using TFHE for euint32;

    euint32 private encryptedValue;

    /**
     * @notice Initialize with encrypted value
     */
    constructor() {
        encryptedValue = TFHE.asEuint32(0);
    }

    /**
     * @notice Set an encrypted value
     */
    function setValue(euint32 newValue) external {
        encryptedValue = newValue;
    }

    /**
     * @notice Get the encrypted value (view only)
     */
    function getValue() external view returns (euint32) {
        return encryptedValue;
    }
}
