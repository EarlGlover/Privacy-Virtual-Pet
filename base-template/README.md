# FHEVM Hardhat Example Template

This is a base template for creating FHEVM examples. It provides a minimal but complete Hardhat setup for developing and testing FHEVM smart contracts.

## Quick Start

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy

**Local Hardhat Network**:
```bash
npm run deploy:localhost
```

**Zama Devnet**:
```bash
npm run deploy:zama
```

**Sepolia Testnet**:
```bash
npm run deploy:sepolia
```

## Project Structure

```
├── contracts/              # Solidity contracts
│   └── [Contract].sol
├── test/                   # Test files
│   └── [Contract].test.ts
├── scripts/                # Deployment scripts
│   └── deploy.ts
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

## Environment Setup

Create a `.env` file in the root directory:

```env
# Wallet private key (testnet only!)
PRIVATE_KEY=your_private_key_here

# RPC endpoints (optional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
ZAMA_RPC_URL=https://devnet.zama.ai

# API keys (optional)
ETHERSCAN_API_KEY=your_api_key
```

## Supported Networks

- **Hardhat** (local development)
- **Localhost** (local Hardhat node)
- **Zama Devnet** (FHE testing)
- **Sepolia Testnet** (public testing)

## Useful Commands

### Start Local Node

```bash
npm run node
```

### Check Gas Usage

```bash
REPORT_GAS=true npm run test
```

### Clean Build

```bash
npm run clean
npm run compile
```

## FHEVM Resources

- [FHEVM Documentation](https://docs.zama.ai)
- [Zama Community](https://www.zama.ai/community)
- [GitHub Examples](https://github.com/zama-ai/fhevm)

## License

MIT
