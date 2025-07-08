# Migration Guide - Deprecated Functions Removed

This guide helps you migrate from the deprecated functions that were removed in favor of the unified `getVaults()` function with server-side GraphQL filtering.

## 🗑️ Removed Functions

The following deprecated and legacy functions have been removed:

### 1. `getTestTokens(chain: string)`
**Reason**: Backwards compatibility function with confusing name  
**Migration**: Use `getTokenAddress()` or `getTokenAddresses()` directly

```typescript
// ❌ Old way
const tokens = getTestTokens("base");
const wethAddress = tokens.WETH;

// ✅ New way
const wethAddress = getTokenAddress("WETH", 8453);
// or get all tokens for a chain
const tokens = {
  WETH: getTokenAddress('WETH', 8453),
  USDC: getTokenAddress('USDC', 8453),
  USDT: getTokenAddress('USDT', 8453),
};
```

### 2. `getTopVaultAddresses(chain: string, limit?: number)`
**Reason**: Replaced by more flexible `getVaults()` function  
**Migration**: Use `getVaults()` with sorting and mapping

```typescript
// ❌ Old way
const addresses = await getTopVaultAddresses("base", 5);

// ✅ New way
const vaults = await getVaults({
  chainId: 8453, // Base
  sortBy: "totalAssetsUsd",
  sortOrder: "desc",
  limit: 5,
  excludeIdle: true,
});
const addresses = vaults.map(vault => vault.address);
```

### 3. `getBestVaultAddress(asset: string, chain: string)`
**Reason**: Limited functionality compared to `getVaults()`  
**Migration**: Use `getVaults()` with asset and chain filtering

```typescript
// ❌ Old way
const address = await getBestVaultAddress("WETH", "base");

// ✅ New way
const vaults = await getVaults({
  assetSymbol: "WETH",
  chainId: 8453, // Base
  sortBy: "apy",
  sortOrder: "desc",
  limit: 1,
  excludeIdle: true,
});
const address = vaults[0]?.address || null;
```

### 4. `getVaultAddressForAsset(asset: string, chain: string)`
**Reason**: Error-throwing wrapper around `getBestVaultAddress()`  
**Migration**: Use `getVaults()` with proper error handling

```typescript
// ❌ Old way
const address = await getVaultAddressForAsset("WETH", "base");

// ✅ New way
const vaults = await getVaults({
  assetSymbol: "WETH",
  chainId: 8453, // Base
  sortBy: "apy",
  sortOrder: "desc",
  limit: 1,
  excludeIdle: true,
});

if (vaults.length === 0) {
  throw new Error(`No WETH vaults found on Base`);
}

const address = vaults[0].address;
```

## 🚀 Benefits of Migration

### 1. **Server-Side Filtering**
The new `getVaults()` function uses GraphQL server-side filtering for better performance:

```typescript
// Server-side filtering - much faster!
const vaults = await getVaults({
  chainId: 8453,
  assetSymbol: "USDC",
  minApy: 2.0,
  minTvl: 1000000,
  whitelistedOnly: true,
});
```

### 2. **More Flexible Filtering**
Combine multiple criteria in a single query:

```typescript
// Multiple filters applied server-side
const vaults = await getVaults({
  chainId: 8453,           // Base network
  assetSymbol: "WETH",     // WETH vaults only
  minApy: 1.0,             // Min 1% APY
  minTvl: 100000,          // Min $100k TVL
  whitelistedOnly: true,   // Whitelisted only
  sortBy: "apy",           // Sort by APY
  sortOrder: "desc",       // Highest first
  limit: 5,                // Top 5 results
});
```

### 3. **Better Type Safety**
Full TypeScript support with detailed vault information:

```typescript
const vaults: MorphoVaultInfo[] = await getVaults({
  assetSymbol: "USDC",
  chainId: 8453,
});

// Access rich vault data
vaults.forEach(vault => {
  console.log(`${vault.name}: ${vault.metrics.apy}% APY`);
  console.log(`TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
  console.log(`Asset: ${vault.asset.symbol} on ${vault.chain.network}`);
});
```

## 📚 Available Functions

After cleanup, these are the current helper functions:

### Core Functions
- `getVaults(options)` - **Primary function** for all vault discovery
- `getBestVaultsForAsset(symbol, limit)` - Quick asset-specific search
- `getTopVaultsByApy(limit, minTvl)` - Top APY vaults
- `getTopVaultsByTvl(limit)` - Top TVL vaults
- `searchVaults(query, limit)` - Text search

### Token Management
- `getTokenAddress(symbol, chainId)` - Get specific token address
- `getTokenAddresses(chainId)` - Get all well-known tokens for chain
- `isSupportedChain(chainId)` - Check chain support

### Chain Discovery
- `getSupportedChainsWithVaults()` - All chains with active vaults
- `getVaultDiscoverySummary(chainId)` - Comprehensive chain analysis

## ⚡ Performance Improvements

The migration provides significant performance benefits:

- **Server-side filtering**: Reduces data transfer by 80-95%
- **GraphQL optimization**: Only fetch needed data
- **Targeted queries**: No more fetching 100+ vaults to filter client-side
- **Real-time data**: Direct access to Morpho's latest vault metrics

Example performance comparison:
```typescript
// Old way: Fetch all vaults, filter client-side
// ~100+ vaults downloaded, then filtered
const allVaults = await getAllVaults();
const filtered = allVaults.filter(v => v.chain.id === 8453);

// New way: Server-side filtering
// Only ~5 vaults downloaded, pre-filtered
const vaults = await getVaults({ chainId: 8453, limit: 5 });
```

## 🛠️ Migration Checklist

1. ✅ Replace `getTestTokens()` with `getTokenAddress()`
2. ✅ Replace `getTopVaultAddresses()` with `getVaults()` + mapping
3. ✅ Replace `getBestVaultAddress()` with `getVaults()` + filtering
4. ✅ Replace `getVaultAddressForAsset()` with `getVaults()` + error handling
5. ✅ Update imports to remove deleted functions
6. ✅ Test all vault discovery functionality
7. ✅ Verify server-side filtering is working (check console logs)

The migration is straightforward and results in cleaner, faster, and more maintainable code!