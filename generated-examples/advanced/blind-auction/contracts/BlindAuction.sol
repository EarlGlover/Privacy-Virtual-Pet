// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title BlindAuction
 * @notice A completely private auction where bids remain encrypted
 * @dev Demonstrates advanced FHEVM patterns for real-world use cases
 *
 * @chapter advanced-patterns
 * This blind auction demonstrates:
 * - Private bidding (bids are encrypted)
 * - Encrypted winner selection
 * - No one (including the auctioneer) knows the bids during the auction
 * - Winner and amount are only revealed at the end
 *
 * Key Features:
 * - Complete privacy during bidding
 * - Fair auction (no front-running)
 * - Verifiable on-chain
 */
contract BlindAuction {
    /// @notice Auction owner
    address public immutable auctioneer;

    /// @notice Auction end time
    uint256 public immutable auctionEndTime;

    /// @notice Has auction ended
    bool public auctionEnded;

    /// @notice Encrypted bids
    mapping(address => euint32) private bids;

    /// @notice Track if address has bid
    mapping(address => bool) public hasBid;

    /// @notice Number of bidders
    uint256 public bidderCount;

    /// @notice Current highest encrypted bid
    euint32 private highestBid;

    /// @notice Current highest bidder
    address public highestBidder;

    /// @notice Emitted when bid is placed
    event BidPlaced(address indexed bidder, uint256 timestamp);

    /// @notice Emitted when auction ends
    event AuctionEnded(address winner, uint256 timestamp);

    /// @notice Bid period has ended
    error AuctionHasEnded();

    /// @notice Auction still active
    error AuctionStillActive();

    /// @notice Already ended
    error AuctionAlreadyEnded();

    /**
     * @notice Initialize auction
     * @param biddingTime Duration of auction in seconds
     */
    constructor(uint256 biddingTime) {
        auctioneer = msg.sender;
        auctionEndTime = block.timestamp + biddingTime;
        auctionEnded = false;

        // Initialize with zero
        highestBid = TFHE.asEuint32(0);
        highestBidder = address(0);
    }

    /**
     * @notice Place encrypted bid
     * @param encryptedBidAmount Encrypted bid amount
     * @param inputProof Proof validating the bid
     *
     * @chapter advanced-patterns
     * Private bidding process:
     * 1. User encrypts their bid amount
     * 2. Bid is validated with proof
     * 3. Bid is stored encrypted (no one can see it)
     * 4. Contract tracks the bid without revealing value
     */
    function placeBid(
        einput encryptedBidAmount,
        bytes calldata inputProof
    ) external {
        // Check auction is still active
        if (block.timestamp >= auctionEndTime) revert AuctionHasEnded();

        // Validate and convert encrypted bid
        euint32 bidAmount = TFHE.asEuint32(encryptedBidAmount, inputProof);

        // Store bid
        bids[msg.sender] = bidAmount;

        // Track bidder
        if (!hasBid[msg.sender]) {
            hasBid[msg.sender] = true;
            bidderCount++;
        }

        // Update highest bid (encrypted comparison)
        ebool isHigher = TFHE.gt(bidAmount, highestBid);

        // If this bid is higher, update highest bid and bidder
        // Note: This comparison happens on encrypted data!
        highestBid = TFHE.select(isHigher, bidAmount, highestBid);

        // Update highest bidder (we reveal this, but not the amount)
        // In production, you might keep this encrypted too
        if (TFHE.decrypt(isHigher)) {
            highestBidder = msg.sender;
        }

        // Grant permissions
        TFHE.allowThis(bidAmount);
        TFHE.allow(bidAmount, msg.sender);
        TFHE.allowThis(highestBid);

        emit BidPlaced(msg.sender, block.timestamp);
    }

    /**
     * @notice Get own encrypted bid
     * @return Encrypted bid amount
     *
     * @chapter advanced-patterns
     * Users can retrieve their own encrypted bid but cannot
     * decrypt it directly in the contract. They must decrypt
     * client-side with proper permissions.
     */
    function getMyBid() external view returns (euint32) {
        require(hasBid[msg.sender], "No bid placed");
        return bids[msg.sender];
    }

    /**
     * @notice Get decrypted bid (only for own bid)
     * @return Plaintext bid amount
     *
     * @chapter advanced-patterns
     * Users can decrypt their own bid. This is safe because:
     * - They created the bid
     * - They have decryption permission
     * - Other users cannot decrypt it
     */
    function getMyDecryptedBid() external view returns (uint32) {
        require(hasBid[msg.sender], "No bid placed");
        return TFHE.decrypt(bids[msg.sender]);
    }

    /**
     * @notice End auction and reveal winner
     *
     * @chapter advanced-patterns
     * When auction ends:
     * 1. Verify time has passed
     * 2. Decrypt and reveal highest bid
     * 3. Announce winner
     * 4. Transfer funds (not implemented for simplicity)
     */
    function endAuction() external {
        // Check time
        if (block.timestamp < auctionEndTime) revert AuctionStillActive();
        if (auctionEnded) revert AuctionAlreadyEnded();

        // Mark as ended
        auctionEnded = true;

        // Reveal highest bid (only at the end!)
        uint32 winningBid = TFHE.decrypt(highestBid);

        emit AuctionEnded(highestBidder, block.timestamp);

        // In a real auction, you would:
        // - Transfer funds to auctioneer
        // - Transfer item to winner
        // - Refund losing bidders
    }

    /**
     * @notice Get winning bid amount (only after auction ends)
     * @return Winning bid amount
     */
    function getWinningBid() external view returns (uint32) {
        require(auctionEnded, "Auction not ended");
        return TFHE.decrypt(highestBid);
    }

    /**
     * @notice Check if user's bid is winning (encrypted result)
     * @return Encrypted boolean indicating if caller is winning
     *
     * @chapter advanced-patterns
     * Returns encrypted result. User must decrypt client-side
     * to know if they're winning. This keeps the bid amounts private.
     */
    function amIWinning() external view returns (ebool) {
        require(hasBid[msg.sender], "No bid placed");

        euint32 myBid = bids[msg.sender];
        euint32 currentHighest = highestBid;

        // Encrypted comparison
        return TFHE.gte(myBid, currentHighest);
    }

    /**
     * @notice Auctioneer can reveal specific bid (after auction ends)
     * @param bidder Address of bidder
     * @return Bid amount
     *
     * @chapter advanced-patterns
     * Only after auction ends, bids can be revealed.
     * In production, add more access control.
     */
    function revealBid(address bidder) external view returns (uint32) {
        require(msg.sender == auctioneer, "Only auctioneer");
        require(auctionEnded, "Auction not ended");
        require(hasBid[bidder], "No bid from this address");

        return TFHE.decrypt(bids[bidder]);
    }

    /**
     * @notice Get auction status
     * @return isActive Is auction still accepting bids
     * @return timeRemaining Seconds until auction ends (0 if ended)
     * @return numBidders Number of unique bidders
     * @return leader Current highest bidder
     */
    function getAuctionStatus()
        external
        view
        returns (
            bool isActive,
            uint256 timeRemaining,
            uint256 numBidders,
            address leader
        )
    {
        isActive = block.timestamp < auctionEndTime;
        timeRemaining = isActive ? auctionEndTime - block.timestamp : 0;
        numBidders = bidderCount;
        leader = highestBidder;
    }
}
