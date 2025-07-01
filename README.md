# Vincent Aave Tool

A Vincent Scaffold SDK project for interacting with Aave v3 DeFi protocol through Lit Actions - enabling secure, decentralized lending and borrowing operations.

## What is this?

This project demonstrates how to build blockchain tools using the Vincent Scaffold SDK that execute on Lit Protocol's decentralized network. The Aave tool enables users to:

- **Supply** assets as collateral to earn interest
- **Borrow** assets against collateral
- **Repay** borrowed debt
- **Withdraw** supplied collateral

All operations are executed securely through Lit Actions with PKP (Programmable Key Pair) wallets.

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.vincent-sample .env

# Edit .env with your values:
# - ETH_SEPOLIA_RPC_URL: Your Sepolia RPC endpoint
# - TEST_FUNDER_PRIVATE_KEY: Private key with test tokens
```

### 2. Build and Test

```bash
# Install dependencies and build
npm install
npm run vincent:build

# Run end-to-end tests
npm run vincent:e2e
```

### 3. Example Usage

```typescript
import { VincentClient } from "@lit-protocol/vincent-sdk";

const client = new VincentClient();
await client.registerTool("./vincent-packages/tools/aave");

// Supply WETH as collateral
await client.execute("aave", {
  operation: "supply",
  asset: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", // WETH
  amount: "0.01",
  chain: "sepolia",
});
```

## Project Structure

```
vincent-packages/
├── tools/
│   └── aave/                    # Aave v3 integration tool
│       ├── src/lib/
│       │   ├── schemas.ts       # Zod validation schemas
│       │   ├── vincent-tool.ts  # Main implementation
│       │   └── helpers/         # Utility functions
│       └── README.md            # 📖 Detailed tool documentation
└── policies/                    # (Empty - policies can be added here)

vincent-e2e/
└── src/
    ├── e2e.ts                  # End-to-end test suite
    └── test-utils.ts           # Test utilities

vincent-scripts/                # Build and utility scripts
```

## Documentation

**📖 [Complete Aave Tool Documentation](./vincent-packages/tools/aave/README.md)**

The detailed documentation includes:

- Complete API reference
- Step-by-step usage examples
- DeFi workflow demonstrations
- Network configuration
- Error handling guide
- Development commands

## Supported Networks

- **Ethereum Sepolia Testnet** (Chain ID: 11155111)
- Aave v3 Pool: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`

### Test Tokens

- **WETH**: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`
- **USDC**: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`

## Key Features

- **Schema-First Validation**: Runtime type checking with Zod
- **Comprehensive Testing**: Full E2E workflow testing
- **PKP Integration**: Secure execution with Programmable Key Pairs
- **Gas Optimization**: Pre-validation and estimation
- **Error Handling**: Robust validation and user-friendly errors

## Development Commands

```bash
# Build all components
npm run vincent:build

# Reset test state
npm run vincent:reset

# Run E2E tests
npm run vincent:e2e
```

## About Vincent Scaffold SDK

The [Vincent Scaffold SDK](https://github.com/lit-protocol/vincent-scaffold-sdk) is a framework for building blockchain tools and policies that execute on Lit Actions - Lit Protocol's decentralized execution environment. It enables:

- Secure, decentralized transaction execution
- PKP wallet integration
- Cross-chain compatibility
- Governance and policy enforcement

## About Lit Protocol

[Lit Protocol](https://litprotocol.com) is a decentralized key management system that enables secure, programmable cryptography. PKPs (Programmable Key Pairs) allow for decentralized wallet operations without exposing private keys, making it ideal for automated DeFi interactions.

---

**Need Help?** Check the [detailed Aave tool documentation](./vincent-packages/tools/aave/README.md) for complete usage examples and troubleshooting.
