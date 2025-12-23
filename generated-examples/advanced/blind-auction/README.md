# Blind Auction - Advanced FHEVM Pattern

A completely private auction system where **all bids remain encrypted** until the auction ends. No one, not even the auctioneer, can see bid amounts during the auction.

## Overview

This blind auction demonstrates:
- ✅ **Complete Privacy**: Bids are encrypted on-chain
- ✅ **Fair Bidding**: No front-running possible
- ✅ **Encrypted Winner Selection**: Comparison happens on encrypted data
- ✅ **Verifiable Results**: Winner is proven without revealing all bids
- ✅ **Real-World Pattern**: Production-ready auction logic

## How It Works

### 1. Bidding Phase (Private)
```solidity
// User encrypts their bid
const encryptedBid = await fhevm.encrypt32(1000);

// Place bid with proof
await auction.placeBid(encryptedBid.handle, encryptedBid.proof);

// ✅ Bid is now encrypted on-chain
// ❌ No one can see the amount (not even the auctioneer)
```

### 2. During Auction (Still Private)
```solidity
// Contract compares bids using FHE
ebool isHigher = TFHE.gt(newBid, currentHighestBid);

// Updates highest bid without decryption
highestBid = TFHE.select(isHigher, newBid, currentHighestBid);

// 🔒 All comparisons happen on encrypted data
```

### 3. After Auction Ends (Reveal)
```solidity
// Only now are bids decrypted
await auction.endAuction();

// Get winning bid
const winningBid = await auction.getWinningBid(); // Now revealed
```

## Key Features

### Complete Privacy
- **During Auction**: All bids are encrypted
  - Auctioneer cannot see bids
  - Other bidders cannot see bids
  - Contract logic works on encrypted data

- **After Auction**: Controlled revelation
  - Winner and winning bid are revealed
  - Losing bids can stay private
  - Selective revelation by auctioneer

### Fair Auction
- ❌ **No Front-Running**: Future bids cannot be based on seeing current bids
- ❌ **No Bid Manipulation**: Bids are cryptographically validated
- ✅ **Verifiable Winner**: Winner selection is transparent and verifiable

## Contract Functions

### Placing Bids
```solidity
function placeBid(
    einput encryptedBidAmount,
    bytes calldata inputProof
) external
```
Place an encrypted bid with cryptographic proof.

### Checking Status
```solidity
// Get your own bid (encrypted)
function getMyBid() external view returns (euint32)

// Check if you're winning (encrypted result)
function amIWinning() external view returns (ebool)

// Get auction status
function getAuctionStatus() external view returns (...)
```

### Ending Auction
```solidity
// End auction and reveal winner
function endAuction() external

// Get winning bid (only after auction ends)
function getWinningBid() external view returns (uint32)
```

## Usage Example

### Deploy Auction
```typescript
// 1 hour auction
const auction = await ethers.deployContract("BlindAuction", [3600]);
```

### Place Bids
```typescript
// Initialize FHEVM
const fhevm = await createInstance({ chainId, publicKey });

// Alice bids 1000
const alice_bid = fhevm.encrypt32(1000);
await auction.connect(alice).placeBid(alice_bid.handle, alice_bid.proof);

// Bob bids 1500
const bob_bid = fhevm.encrypt32(1500);
await auction.connect(bob).placeBid(bob_bid.handle, bob_bid.proof);

// Carol bids 800
const carol_bid = fhevm.encrypt32(800);
await auction.connect(carol).placeBid(carol_bid.handle, carol_bid.proof);

// 🔒 All bids are encrypted!
// No one knows who bid what
```

### Check Status (During Auction)
```typescript
// Alice checks if she's winning
const amIWinning = await auction.connect(alice).amIWinning();
// Returns encrypted boolean - Alice must decrypt client-side

// Get auction status
const status = await auction.getAuctionStatus();
console.log("Bidders:", status.numBidders); // 3
console.log("Leader:", status.leader); // Bob's address (but amount is secret!)
```

### End Auction
```typescript
// After auction time expires
await auction.endAuction();

// Reveal winner and amount
const winner = await auction.highestBidder(); // Bob
const winningBid = await auction.getWinningBid(); // 1500

console.log(`${winner} won with bid of ${winningBid}`);
```

## Privacy Guarantees

| Information | During Auction | After Auction |
|------------|----------------|---------------|
| Bid Amounts | 🔒 Encrypted | 🔒 Encrypted (unless revealed) |
| Highest Bidder | 🔓 Public | 🔓 Public |
| Winning Amount | 🔒 Encrypted | 🔓 Revealed |
| Losing Bids | 🔒 Encrypted | 🔒 Can stay encrypted |

## Advanced Patterns Demonstrated

### 1. Encrypted Comparisons
```solidity
ebool isHigher = TFHE.gt(newBid, currentHighestBid);
```
Compare without revealing values.

### 2. Conditional Updates
```solidity
highestBid = TFHE.select(isHigher, newBid, currentHighestBid);
```
Update based on encrypted condition.

### 3. Selective Decryption
```solidity
// Decrypt only when needed
if (auctionEnded) {
    return TFHE.decrypt(highestBid);
}
```

### 4. Permission Management
```solidity
// Bidder can see own bid
TFHE.allow(bidAmount, msg.sender);

// Contract can compare bids
TFHE.allowThis(bidAmount);
```

## Security Considerations

### ✅ Secure
- Bids validated with input proofs
- Encrypted comparisons prevent information leakage
- Time-based auction end prevents manipulation
- Winner selection is deterministic and verifiable

### ⚠️ Production Enhancements
For production, consider adding:
- Minimum bid increments
- Bid deposit/escrow system
- Automatic refunds for losing bidders
- Multiple auction items
- Reserve prices (encrypted)
- Bid withdrawal mechanism

## Testing

```bash
npm test
```

Tests verify:
- ✅ Bids are accepted and stored encrypted
- ✅ Winner is correctly determined
- ✅ Privacy is maintained during auction
- ✅ Revelation works after auction ends
- ✅ Access control is enforced

## Extensions

### Possible Enhancements

1. **Second-Price Auction**: Winner pays second-highest bid
2. **Multi-Item Auction**: Multiple items with separate bidding
3. **Reserve Price**: Minimum price (encrypted)
4. **Automatic Refunds**: Return funds to losing bidders
5. **Bid History**: Encrypted bid timeline
6. **Proxy Bidding**: Automatic bid increments up to max

### Example: Second-Price Auction
```solidity
// Winner pays second-highest bid
euint32 secondHighest = findSecondHighest();
euint32 paymentAmount = TFHE.min(highestBid, secondHighest);
```

## Real-World Applications

- **Art Auctions**: Private bidding for valuable items
- **Government Contracts**: Fair procurement
- **Spectrum Auctions**: Telecom frequency bidding
- **Real Estate**: Private property bids
- **NFT Auctions**: Confidential NFT sales

## Resources

- [FHEVM Advanced Patterns](https://docs.zama.ai/fhevm/guides/advanced)
- [Auction Design Theory](https://en.wikipedia.org/wiki/Auction_theory)
- [FHE in Finance](https://docs.zama.ai/fhevm/use-cases/finance)

---

**This is a complete, working blind auction using FHEVM!** 🎉

Adapt it for your use case and enjoy truly private, fair auctions on blockchain.
