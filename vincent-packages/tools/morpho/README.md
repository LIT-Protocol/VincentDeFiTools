# Vincent Morpho Tool

A comprehensive DeFi tool for interacting with Morpho Blue vaults and ERC4626 tokenized vaults, built for the Vincent Scaffold SDK and Lit Actions execution environment.

## Overview

The Vincent Morpho Tool enables secure, decentralized interactions with Morpho Blue vaults through Lit Actions. It supports vault deposit and redemption operations for yield farming and liquidity provision on Base network.

## Supported Operations

- **DEPOSIT** - Deposit assets into Morpho vaults to earn yield  
- **REDEEM** - Redeem vault shares for underlying assets

## Usage Examples

### Basic Deposit Operation

```typescript
import { VincentClient } from '@lit-protocol/vincent-sdk';

const client = new VincentClient();
await client.registerTool('./vincent-packages/tools/morpho');

// Deposit WETH into Morpho vault
await client.execute('morpho', {
  operation: "deposit",
  vaultAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458", // WETH vault on Base
  amount: "0.001",
  chain: "base"
});
```

### Complete Vault Workflow

```typescript
// 1. First approve WETH for Morpho vault (using approve tool)
await client.execute('approve', {
  chainId: 8453,
  tokenAddress: "0x4200000000000000000000000000000000000006", // WETH on Base
  spenderAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458", // WETH vault
  tokenAmount: 0.001,
  tokenDecimals: 18
});

// 2. Deposit WETH into vault
await client.execute('morpho', {
  operation: "deposit",
  vaultAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458",
  amount: "0.001",
  chain: "base"
});

// 3. Later, redeem vault shares for WETH + yield
await client.execute('morpho', {
  operation: "redeem", 
  vaultAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458",
  amount: "1000000000000000", // Share amount from vault balance
  chain: "base"
});
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | `"deposit" \| "redeem"` | ✅ | The vault operation to perform |
| `vaultAddress` | `string` | ✅ | Morpho vault contract address (0x format) |
| `amount` | `string` | ✅ | Amount as string (assets for deposit, shares for redeem) |
| `chain` | `string` | ✅ | Chain identifier ("base") |
| `receiver` | `string` | ❌ | Address to receive tokens (defaults to sender) |
| `rpcUrl` | `string` | ❌ | Custom RPC URL (for precheck validation) |

## Network Configuration

### Base Mainnet
- **Chain ID**: `8453`
- **WETH Token**: `0x4200000000000000000000000000000000000006`
- **WETH Vault**: `0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458` (Seamless WETH vault)
- **USDC Token**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **USDC Vault**: `0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12` (USDC vault)

## Prerequisites

### Environment Setup
```bash
# Copy environment template
cp .env.vincent-sample .env

# Configure RPC and test wallet
BASE_RPC_URL=your_base_rpc_url_here
TEST_FUNDER_PRIVATE_KEY=your_test_private_key_here
```

### Token Approvals
Before depositing, underlying tokens must be approved for the vault contract. Use the Vincent approve tool:

```typescript
await client.execute('approve', {
  chainId: 8453,
  tokenAddress: "0x4200000000000000000000000000000000000006", // WETH
  spenderAddress: "0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458", // WETH Vault
  tokenAmount: amount,
  tokenDecimals: 18
});
```

## Development Commands

```bash
# Build the tool
npm run build

# Build all tools and policies  
npm run vincent:build

# Run E2E tests
npm run vincent:e2e:morpho

# Reset test state
npm run vincent:e2e:reset
```

## Vault Operations

### Deposit 
- **Deposit**: Specify exact asset amount to deposit, receive corresponding vault shares

### Redeem  
- **Redeem**: Specify exact share amount to redeem, receive corresponding underlying assets

## Error Handling

The tool includes comprehensive validation:

- **Balance Checks**: Verifies sufficient token/share balance before operations
- **Allowance Validation**: Ensures proper token approvals for deposits
- **Vault State Checks**: Validates vault shares and balances
- **ERC4626 Compliance**: Ensures vault follows standard interface

## Testing

The tool includes comprehensive E2E tests that demonstrate:

- Complete deposit → redeem workflow with WETH on Base network
- Vault share accounting and yield accrual
- Balance verification before/after operations
- Integration with AAVE + Morpho combined workflows

Run tests with:
```bash
npm run vincent:e2e:morpho
npm run vincent:e2e:aave-plus-morpho  # Combined workflow
```

## ERC4626 Vault Standard

Morpho vaults implement the ERC4626 tokenized vault standard:

- **Assets**: Underlying tokens (e.g., USDC)
- **Shares**: Vault tokens representing ownership
- **Exchange Rate**: Dynamic rate between assets and shares
- **Yield**: Automatically compounds into share value

## Architecture Notes

- Built on Vincent Scaffold SDK framework
- Executes in Lit Actions environment with Node.js constraints  
- Uses Zod schemas for runtime validation
- Integrates with PKP (Programmable Key Pair) wallets
- Schema-first development approach
- ERC4626 vault interface compliance