// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VeriChain Notary
 * @dev Stores ZK-proof validation results on Shardeum for public verification.
 */
contract VeriChainNotary {
    
    struct Validation {
        bytes32 dataHash;
        bool isValid;
        uint256 timestamp;
        address notary;
    }

    // Mapping from Asset ID to its latest Validation status
    mapping(string => Validation) public validations;

    // Event to allow external indexers/explorers to track notarizations
    event Notarized(string indexed assetId, bytes32 dataHash, bool isValid, uint256 timestamp);

    /**
     * @notice Records a validation result for an asset.
     * @param assetId The unique identifier of the asset (e.g., VAX-001).
     * @param dataHash The hash of the data/proof being validated.
     * @param isValid The boolean result of the ZK verification.
     */
    function notarize(string memory assetId, bytes32 dataHash, bool isValid) public {
        validations[assetId] = Validation({
            dataHash: dataHash,
            isValid: isValid,
            timestamp: block.timestamp,
            notary: msg.sender
        });

        emit Notarized(assetId, dataHash, isValid, block.timestamp);
    }

    /**
     * @notice Retrieves the validation status of an asset.
     * @param assetId The unique identifier of the asset.
     */
    function getValidation(string memory assetId) public view returns (Validation memory) {
        return validations[assetId];
    }
}
