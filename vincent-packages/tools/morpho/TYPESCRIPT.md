# TypeScript Support for Morpho Vault Discovery

The Morpho tool provides comprehensive TypeScript support with excellent IDE experience through detailed type definitions and JSDoc comments.

## Primary Types

### 🔍 `getVaults(options?: VaultFilterOptions): Promise<MorphoVaultInfo[]>`

The main vault discovery function with full TypeScript support:

```typescript
import { getVaults, VaultFilterOptions, MorphoVaultInfo } from './lib/helpers';

// IDE will show autocomplete for all options
const vaults: MorphoVaultInfo[] = await getVaults({
  assetSymbol: "USDC",     // Autocomplete: "USDC" | "WETH" | "USDT" | string
  chainId: 8453,           // Type: number (supports all chain IDs)
  minNetApy: 5.0,          // Type: number
  sortBy: "netApy",        // Autocomplete: "netApy" | "totalAssets" | "totalAssetsUsd" | "creationTimestamp"
  sortOrder: "desc",       // Autocomplete: "asc" | "desc"
  limit: 10,               // Type: number
});
```

### 📊 `VaultFilterOptions` Interface

Complete filtering options with JSDoc documentation:

```typescript
interface VaultFilterOptions {
  // Asset filtering
  /** Filter by token symbol (e.g., "USDC", "WETH", "USDT") */
  assetSymbol?: TokenSymbol | string;
  /** Filter by specific token contract address */
  assetAddress?: string;

  // Chain filtering
  /** Chain identifier - supports chain name or ID */
  chain?: string | number;
  /** Specific chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, etc.) */
  chainId?: number;

  // Performance filtering
  /** Minimum Net APY percentage (after fees) */
  minNetApy?: number;
  /** Maximum Net APY percentage (after fees) */
  maxNetApy?: number;
  /** Minimum Total Value Locked in USD */
  minTvl?: number;
  /** Maximum Total Value Locked in USD */
  maxTvl?: number;

  // Vault status filtering
  /** Only include whitelisted vaults */
  whitelistedOnly?: boolean;
  /** Exclude low-activity vaults (< $100 TVL) */
  excludeIdle?: boolean;

  // Sorting and pagination
  /** Field to sort results by */
  sortBy?: VaultSortBy;
  /** Sort order: ascending or descending */
  sortOrder?: SortOrder;
  /** Maximum number of results to return */
  limit?: number;
}
```

### 🏛️ `MorphoVaultInfo` Interface

Comprehensive vault information with detailed property documentation:

```typescript
interface MorphoVaultInfo {
  /** Vault contract address (0x format) */
  address: string;
  /** Human-readable vault name */
  name: string;
  /** Vault token symbol */
  symbol: string;
  
  /** Underlying asset information */
  asset: {
    /** Asset contract address */
    address: string;
    /** Asset symbol (e.g., "USDC", "WETH") */
    symbol: string;
    /** Full asset name */
    name: string;
    /** Token decimals */
    decimals: number;
  };
  
  /** Blockchain information */
  chain: {
    /** Chain ID (1=Ethereum, 8453=Base, etc.) */
    id: number;
    /** Chain name ("ethereum", "base", etc.) */
    network: string;
  };
  
  /** Performance and financial metrics */
  metrics: {
    /** Gross APY percentage (before fees) */
    apy: number;
    /** Net APY percentage (after fees) - most accurate for users */
    netApy: number;
    /** Total assets in vault (in token units as string) */
    totalAssets: string;
    /** Total Value Locked in USD */
    totalAssetsUsd: number;
    /** Vault fee percentage */
    fee: number;
    /** Additional reward tokens and APRs */
    rewards?: Array<{
      /** Reward token address */
      asset: string;
      /** Supply APR for this reward */
      supplyApr: number;
      /** Yearly supply tokens amount */
      yearlySupplyTokens: string;
    }>;
  };
  
  /** Whether vault is whitelisted by Morpho */
  whitelisted: boolean;
  /** Vault creation timestamp */
  creationTimestamp: number;
  /** Whether vault has low activity (< $100 TVL) */
  isIdle?: boolean;
}
```

## Convenience Types

### 🚀 Pre-configured Filter Presets

```typescript
import { getVaultsByPreset, VAULT_FILTER_PRESETS } from './lib/helpers';

// Quick access to common search patterns
const highYieldVaults = await getVaultsByPreset("highYield");
const stableVaults = await getVaultsByPreset("stable", { 
  chainId: 8453  // Override to Base chain
});

// Access preset configurations
const config = VAULT_FILTER_PRESETS.highYield;
// {
//   minNetApy: 8.0,
//   minTvl: 1000000,
//   sortBy: "netApy",
//   sortOrder: "desc",
//   excludeIdle: true,
//   limit: 10
// }
```

### 📝 Helper Types

```typescript
// Supported token symbols
type TokenSymbol = "USDC" | "WETH" | "USDT";

// Sorting fields
type VaultSortBy = "netApy" | "totalAssets" | "totalAssetsUsd" | "creationTimestamp";

// Sort order
type SortOrder = "asc" | "desc";

// Chain identifiers
type ChainIdentifier = number | string;

// Supported chain IDs
type SupportedChainId = 1 | 8453 | 42161 | 10 | 137 | 11155111;

// Supported chain names
type SupportedChainName = "ethereum" | "base" | "arbitrum" | "optimism" | "polygon" | "sepolia";
```

## IDE Features

### ✨ Autocomplete & IntelliSense

Your IDE will provide:
- **Property suggestions** as you type
- **Type checking** for invalid values
- **JSDoc tooltips** explaining each option
- **Import suggestions** for all types

### 🔍 Example with IDE Support

```typescript
// As you type, IDE shows:
// - Available properties (assetSymbol, chainId, etc.)
// - Expected types (string, number, boolean)
// - Documentation tooltips
const options: VaultFilterOptions = {
  assetSymbol: "USDC",  // ✅ Valid token symbol
  chainId: 8453,        // ✅ Valid Base chain ID
  minNetApy: 5.0,       // ✅ Valid number
  sortBy: "netApy",     // ✅ Valid sort field - autocomplete suggests options
  sortOrder: "desc",    // ✅ Valid order - autocomplete suggests "asc" | "desc"
  excludeIdle: true,    // ✅ Valid boolean
};

// IDE will catch errors:
const badOptions: VaultFilterOptions = {
  chainId: "invalid",   // ❌ TypeScript error: string not assignable to number
  sortBy: "badField",   // ❌ TypeScript error: not a valid sort field
  minNetApy: "5%",      // ❌ TypeScript error: string not assignable to number
};
```

### 📚 Rich Documentation

Hover over any property or function to see:
- **Parameter descriptions** with examples
- **Return type information**
- **Usage examples** in JSDoc
- **Performance notes** and best practices

This comprehensive TypeScript support makes the Morpho vault discovery API intuitive and self-documenting for developers.