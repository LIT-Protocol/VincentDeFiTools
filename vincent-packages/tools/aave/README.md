# Vincent Aave Tool

A comprehensive DeFi tool for interacting with Aave v3 protocol on Ethereum, built for the Vincent Scaffold SDK and Lit Actions execution environment.

## Overview

The Vincent Aave Tool enables secure, decentralized interactions with the Aave v3 lending protocol through Lit Actions. It supports all core Aave operations: supplying assets as collateral, borrowing against collateral, repaying debt, and withdrawing assets.

## Supported Operations

- **SUPPLY** - Deposit assets as collateral to earn interest
- **WITHDRAW** - Remove supplied assets from the protocol  
- **BORROW** - Borrow assets against collateral with variable or stable interest rates
- **REPAY** - Repay borrowed debt

## Usage Examples

### Basic Supply Operation

```typescript
import { VincentClient } from '@lit-protocol/vincent-sdk';

const client = new VincentClient();
await client.registerTool('./vincent-packages/tools/aave');

// Supply WETH as collateral
await client.execute('aave', {
  operation: "supply",
  asset: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", // WETH on Sepolia
  amount: "0.01",
  chain: "sepolia"
});
```

### Complete DeFi Workflow

```typescript
// 1. First approve WETH for Aave Pool (using approve tool)
await client.execute('approve', {
  chainId: 11155111,
  tokenAddress: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  spenderAddress: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Aave Pool
  tokenAmount: 0.01,
  tokenDecimals: 18
});

// 2. Supply WETH as collateral
await client.execute('aave', {
  operation: "supply",
  asset: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  amount: "0.01", 
  chain: "sepolia"
});

// 3. Borrow USDC against collateral
await client.execute('aave', {
  operation: "borrow",
  asset: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // USDC on Sepolia
  amount: "1.0",
  interestRateMode: 2, // Variable rate
  chain: "sepolia"
});

// 4. Approve USDC for repayment
await client.execute('approve', {
  chainId: 11155111,
  tokenAddress: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  spenderAddress: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  tokenAmount: 1.1, // Slightly more for interest
  tokenDecimals: 6
});

// 5. Repay USDC debt
await client.execute('aave', {
  operation: "repay",
  asset: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  amount: "1.1",
  interestRateMode: 2,
  chain: "sepolia"
});

// 6. Withdraw WETH collateral
await client.execute('aave', {
  operation: "withdraw",
  asset: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  amount: "0.01",
  chain: "sepolia"
});
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | `"supply" \| "withdraw" \| "borrow" \| "repay"` | ✅ | The Aave operation to perform |
| `asset` | `string` | ✅ | Token contract address (0x format) |
| `amount` | `string` | ✅ | Amount as string (e.g., "1.5") |
| `chain` | `string` | ✅ | Chain identifier ("sepolia", etc.) |
| `interestRateMode` | `1 \| 2` | ❌ | Interest rate mode: 1=Stable, 2=Variable (for borrow/repay only) |
| `onBehalfOf` | `string` | ❌ | Address to perform operation on behalf of |
| `rpcUrl` | `string` | ❌ | Custom RPC URL (for precheck validation) |

## Network Configuration

### Ethereum Sepolia Testnet
- **Aave v3 Pool**: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- **Chain ID**: `11155111`

### Test Tokens
- **WETH**: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`
- **USDC**: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`

## Prerequisites

### Environment Setup
```bash
# Copy environment template
cp .env.vincent-sample .env

# Configure RPC and test wallet
ETH_SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
TEST_FUNDER_PRIVATE_KEY=your_test_private_key_here
```

### Token Approvals
Before supplying or repaying, tokens must be approved for the Aave Pool contract. Use the Vincent approve tool:

```typescript
await client.execute('approve', {
  chainId: 11155111,
  tokenAddress: "0x...", // Token to approve
  spenderAddress: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Aave Pool
  tokenAmount: amount,
  tokenDecimals: decimals
});
```

## Development Commands

```bash
# Build the tool
npm run build

# Build all tools and policies
npm run vincent:build

# Run E2E tests
npm run vincent:e2e

# Reset test state
npm run vincent:e2e:reset
```

## Error Handling

The tool includes comprehensive validation:

- **Balance Checks**: Verifies sufficient token balance before operations
- **Allowance Validation**: Ensures proper token approvals
- **Gas Estimation**: Pre-validates transaction gas requirements
- **Aave Protocol Checks**: Validates borrowing capacity and health factors

## Testing

The tool includes comprehensive E2E tests that demonstrate:

- Complete supply → borrow → repay → withdraw workflow
- Balance verification before/after operations  
- Aave protocol state tracking
- Error handling and edge cases

Run tests with:
```bash
npm run vincent:e2e
```

## Architecture Notes

- Built on Vincent Scaffold SDK framework
- Executes in Lit Actions environment with Node.js constraints
- Uses Zod schemas for runtime validation
- Integrates with PKP (Programmable Key Pair) wallets
- Schema-first development approach