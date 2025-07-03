# Vincent DeFi Tools

A collection of Vincent Scaffold SDK tools for interacting with leading DeFi protocols through Lit Actions - enabling secure, decentralized finance operations.

## What is this?

This project demonstrates how to build comprehensive blockchain tools using the Vincent Scaffold SDK that execute on Lit Protocol's decentralized network. The DeFi tools enable users to:

### AAVE Protocol Integration

- **Supply** assets as collateral to earn interest
- **Borrow** assets against collateral
- **Repay** borrowed debt
- **Withdraw** supplied collateral

### Morpho Protocol Integration

- **Deposit** assets into yield-generating vaults
- **Redeem** vault shares for underlying assets

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
npm run vincent:e2e:aave              # AAVE tool tests
npm run vincent:e2e:morpho       # Morpho tool tests
npm run vincent:e2e:aave-plus-morpho  # Combined workflow tests
```

### 3. Example Usage

```typescript
import { VincentClient } from "@lit-protocol/vincent-sdk";

const client = new VincentClient();

// Register both tools
await client.registerTool("./vincent-packages/tools/aave");
await client.registerTool("./vincent-packages/tools/morpho");

// AAVE: Supply WETH as collateral
await client.execute("aave", {
  operation: "supply",
  asset: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", // WETH
  amount: "0.01",
  chain: "sepolia",
});

// Morpho: Deposit WETH into vault
await client.execute("morpho", {
  operation: "deposit",
  vaultAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458", // WETH vault
  amount: "0.001",
  chain: "base",
});
```

## Project Structure

```
vincent-packages/
├── tools/
│   ├── aave/                    # Aave v3 lending protocol tool
│   │   ├── src/lib/
│   │   │   ├── schemas.ts       # Zod validation schemas
│   │   │   ├── vincent-tool.ts  # Main implementation
│   │   │   └── helpers/         # Utility functions
│   │   └── README.md            # 📖 Detailed AAVE documentation
│   └── morpho/                  # Morpho Blue vault protocol tool
│       ├── src/lib/
│       │   ├── schemas.ts       # Zod validation schemas
│       │   ├── vincent-tool.ts  # Main implementation
│       │   └── helpers/         # Utility functions
│       └── README.md            # 📖 Detailed Morpho documentation
└── policies/                    # (Empty - policies can be added here)

vincent-e2e/
└── src/
    ├── e2e-aave.ts             # AAVE end-to-end tests
    ├── e2e-morpho.ts           # Morpho end-to-end tests
    ├── e2e-aave-plus-morpho.ts # Combined workflow tests
    └── test-utils/             # Test utilities

vincent-scripts/                # Build and utility scripts
```

## Documentation

### Tool Documentation

**📖 [AAVE Tool Documentation](./vincent-packages/tools/aave/README.md)** - Complete lending protocol integration
**📖 [Morpho Tool Documentation](./vincent-packages/tools/morpho/README.md)** - Complete vault protocol integration

Each tool includes:

- Complete API reference
- Step-by-step usage examples
- DeFi workflow demonstrations
- Network configuration
- Error handling guide
- Development commands

### Combined Workflows

The E2E tests demonstrate powerful cross-protocol workflows:

- **AAVE + Morpho**: Borrow from AAVE → deposit to Morpho → redeem from Morpho → repay AAVE

## Supported Networks

### AAVE Protocol

- **Ethereum Sepolia Testnet** (Chain ID: 11155111)
- Aave v3 Pool: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`

### Morpho Protocol

- **Base Mainnet** (Chain ID: 8453)
- Example USDC Vault: `0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12`

### Tokens

**Sepolia (AAVE)**

- WETH: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`
- USDC: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`

**Base (Morpho)**

- WETH: `0x4200000000000000000000000000000000000006`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

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
npm run vincent:e2e                    # AAVE protocol tests
npm run vincent:e2e:morpho             # Morpho protocol tests
npm run vincent:e2e:aave-plus-morpho   # Combined DeFi workflow tests
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

**Need Help?** Check the detailed documentation:

- [AAVE Tool Documentation](./vincent-packages/tools/aave/README.md)
- [Morpho Tool Documentation](./vincent-packages/tools/morpho/README.md)
