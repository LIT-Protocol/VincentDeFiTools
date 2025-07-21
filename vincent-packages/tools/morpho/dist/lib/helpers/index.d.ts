/**
 * Well-known token addresses across different chains
 * Using official Circle USDC and canonical WETH addresses
 */
export declare const WELL_KNOWN_TOKENS: {
    readonly 1: {
        readonly USDC: "0xA0b86991c6218A36c1D19D4a2e9Eb0cE3606eB48";
        readonly WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        readonly USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    };
    readonly 8453: {
        readonly USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        readonly WETH: "0x4200000000000000000000000000000000000006";
        readonly USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
    };
    readonly 42161: {
        readonly USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
        readonly WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
        readonly USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
    };
    readonly 10: {
        readonly USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
        readonly WETH: "0x4200000000000000000000000000000000000006";
        readonly USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58";
    };
    readonly 137: {
        readonly USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
        readonly WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
        readonly USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    };
    readonly 11155111: {
        readonly USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
        readonly WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
        readonly USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
    };
};
/**
 * Supported chain IDs and their names
 */
export declare const SUPPORTED_CHAINS: {
    readonly 1: "ethereum";
    readonly 8453: "base";
    readonly 42161: "arbitrum";
    readonly 10: "optimism";
    readonly 137: "polygon";
    readonly 11155111: "sepolia";
};
/**
 * Chain names to IDs mapping for backwards compatibility
 */
export declare const CHAIN_IDS: {
    readonly ethereum: 1;
    readonly base: 8453;
    readonly arbitrum: 42161;
    readonly optimism: 10;
    readonly polygon: 137;
    readonly sepolia: 11155111;
};
/**
 * ERC4626 Vault ABI - Essential methods for Morpho vaults
 */
export declare const ERC4626_VAULT_ABI: any[];
/**
 * ERC20 Token ABI - Essential methods only
 */
export declare const ERC20_ABI: any[];
/**
 * Supported chain type
 */
export type SupportedChainId = keyof typeof WELL_KNOWN_TOKENS;
export type SupportedChainName = keyof typeof CHAIN_IDS;
/**
 * Supported token symbols for vault filtering
 */
export type TokenSymbol = "USDC" | "WETH" | "USDT";
/**
 * Supported sorting fields for vault queries
 */
export type VaultSortBy = "netApy" | "totalAssets" | "totalAssetsUsd" | "creationTimestamp";
/**
 * Sort order options
 */
export type SortOrder = "asc" | "desc";
/**
 * Chain identifier (can be chain ID number or chain name string)
 */
export type ChainIdentifier = number | string;
/**
 * Common vault filtering presets for quick searches
 */
export type VaultFilterPresets = {
    /** Find high-yield vaults across all chains */
    highYield: VaultFilterOptions;
    /** Find stable, low-risk vaults */
    stable: VaultFilterOptions;
    /** Find vaults with high TVL */
    highTvl: VaultFilterOptions;
};
/**
 * Pre-configured filter presets for common use cases
 */
export declare const VAULT_FILTER_PRESETS: VaultFilterPresets;
/**
 * Get well-known token addresses for a specific chain
 */
export declare function getTokenAddresses(chainId: number): {
    readonly USDC: "0xA0b86991c6218A36c1D19D4a2e9Eb0cE3606eB48";
    readonly WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    readonly USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7";
} | {
    readonly USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    readonly WETH: "0x4200000000000000000000000000000000000006";
    readonly USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
} | {
    readonly USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
    readonly WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    readonly USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
} | {
    readonly USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
    readonly WETH: "0x4200000000000000000000000000000000000006";
    readonly USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58";
} | {
    readonly USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    readonly WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
    readonly USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
} | {
    readonly USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    readonly WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
    readonly USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
};
/**
 * Get token address for a specific token symbol and chain
 */
export declare function getTokenAddress(symbol: string, chainId: number): string;
/**
 * Check if a chain is supported by Morpho
 */
export declare function isSupportedChain(chainId: number): boolean;
/**
 * Get all supported chain IDs
 */
export declare function getSupportedChainIds(): number[];
/**
 * Get chain name from chain ID
 */
export declare function getChainName(chainId: number): string;
/**
 * Utility function to validate Ethereum address
 */
export declare function isValidAddress(address: string): boolean;
/**
 * Utility function to parse amount with decimals
 */
export declare function parseAmount(amount: string, decimals?: number): string;
/**
 * Utility function to format amount from wei
 */
export declare function formatAmount(amount: string, decimals?: number): string;
/**
 * Validate operation-specific requirements for Morpho vaults
 */
export declare function validateOperationRequirements(operation: string, userBalance: string, allowance: string, vaultShares: string, convertedAmount: string): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * Comprehensive Morpho Vault Information
 *
 * Contains all vault details including address, asset info, chain data,
 * performance metrics, and status information.
 *
 * @example
 * ```typescript
 * const vaults = await getVaults({ limit: 1 });
 * const vault = vaults[0];
 *
 * console.log(`Vault: ${vault.name}`);
 * console.log(`Asset: ${vault.asset.symbol}`);
 * console.log(`Chain: ${vault.chain.network}`);
 * console.log(`Net APY: ${vault.metrics.netApy}%`);
 * console.log(`TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
 * ```
 */
export interface MorphoVaultInfo {
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
/**
 * Unified Vault Filter Options for the getVaults() function
 *
 * Supports comprehensive filtering by asset, chain, performance metrics, and more.
 * All filters use server-side GraphQL queries for optimal performance.
 *
 * @example
 * ```typescript
 * // Find high-yield USDC vaults on Base
 * const vaults = await getVaults({
 *   assetSymbol: "USDC",
 *   chainId: 8453,
 *   minNetApy: 0.05,
 *   sortBy: "netApy",
 *   sortOrder: "desc",
 *   limit: 10
 * });
 * ```
 */
export interface VaultFilterOptions {
    /** Filter by token symbol (e.g., "USDC", "WETH", "USDT") */
    assetSymbol?: TokenSymbol | string;
    /** Filter by specific token contract address */
    assetAddress?: string;
    /** Chain identifier - supports chain name or ID */
    chain?: string | number;
    /** Specific chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, etc.) */
    chainId?: number;
    /** Minimum Net APY percentage (after fees) */
    minNetApy?: number;
    /** Maximum Net APY percentage (after fees) */
    maxNetApy?: number;
    /** Minimum total assets in vault (in token units) */
    minTotalAssets?: number;
    /** Maximum total assets in vault (in token units) */
    maxTotalAssets?: number;
    /** Minimum Total Value Locked in USD */
    minTvl?: number;
    /** Maximum Total Value Locked in USD */
    maxTvl?: number;
    /** Only include whitelisted vaults */
    whitelistedOnly?: boolean;
    /** Exclude low-activity vaults (< $100 TVL) */
    excludeIdle?: boolean;
    /** Field to sort results by */
    sortBy?: VaultSortBy;
    /** Sort order: ascending or descending */
    sortOrder?: SortOrder;
    /** Maximum number of results to return */
    limit?: number;
}
/**
 * Vault Search Options
 */
export interface VaultSearchOptions {
    query?: string;
    chains?: Array<string | number>;
    limit?: number;
    offset?: number;
}
/**
 * Morpho GraphQL API Client
 */
export declare class MorphoVaultClient {
    private readonly apiUrl;
    /**
     * Fetch vault data from Morpho GraphQL API
     */
    private fetchVaultData;
    /**
     * Get all vaults with comprehensive information
     * Now uses proper server-side filtering via GraphQL VaultFilters
     */
    getAllVaults(options?: VaultFilterOptions): Promise<MorphoVaultInfo[]>;
    /**
     * Unified function to get vaults with flexible filtering
     * Supports filtering by asset, chain, and all other options
     */
    getVaults(options?: VaultFilterOptions): Promise<MorphoVaultInfo[]>;
    /**
     * Get top vaults by APY
     */
    getTopVaultsByNetApy(limit?: number, minTvl?: number): Promise<MorphoVaultInfo[]>;
    /**
     * Get top vaults by TVL
     */
    getTopVaultsByTvl(limit?: number): Promise<MorphoVaultInfo[]>;
    /**
     * Search vaults by name, symbol, or asset
     */
    searchVaults(searchOptions: VaultSearchOptions): Promise<MorphoVaultInfo[]>;
    /**
     * Get vault details by address
     */
    getVaultByAddress(address: string, chainId: number): Promise<MorphoVaultInfo | null>;
    /**
     * Get best vaults for a specific asset
     */
    getBestVaultsForAsset(assetSymbol: string, limit?: number): Promise<MorphoVaultInfo[]>;
    /**
     * Map vault data from GraphQL response
     */
    private mapVaultData;
    /**
     * Build GraphQL VaultFilters from filter options
     * Uses proper server-side filtering for better performance
     */
    private buildVaultFilters;
    /**
     * Apply remaining client-side filters not supported by GraphQL
     * Only handles computed properties like isIdle
     */
    private applyRemainingClientFilters;
    /**
     * Map sortBy option to GraphQL enum
     */
    private mapSortBy;
}
/**
 * Create a singleton instance of MorphoVaultClient
 */
export declare const morphoVaultClient: MorphoVaultClient;
/**
 * Helper function to get best vaults for a specific asset
 */
export declare function getBestVaultsForAsset(assetSymbol: string, limit?: number): Promise<MorphoVaultInfo[]>;
/**
 * Helper function to get top vaults by APY
 */
export declare function getTopVaultsByNetApy(limit?: number, minTvl?: number): Promise<MorphoVaultInfo[]>;
/**
 * Helper function to get top vaults by TVL
 */
export declare function getTopVaultsByTvl(limit?: number): Promise<MorphoVaultInfo[]>;
/**
 * Helper function to search vaults
 */
export declare function searchVaults(query: string, limit?: number): Promise<MorphoVaultInfo[]>;
/**
 * 🚀 **Quick Vault Search with Presets**
 *
 * Get vaults using pre-configured filter presets for common use cases.
 *
 * @param preset - Pre-configured filter preset
 * @param overrides - Additional options to override preset defaults
 * @returns Promise resolving to array of vault information
 *
 * @example
 * ```typescript
 * // Find high-yield vaults
 * const highYieldVaults = await getVaultsByPreset("highYield");
 *
 * // Find high-yield USDC vaults specifically
 * const usdcHighYield = await getVaultsByPreset("highYield", {
 *   assetSymbol: "USDC"
 * });
 *
 * // Find stable vaults on Base chain
 * const stableBaseVaults = await getVaultsByPreset("stable", {
 *   chainId: 8453
 * });
 * ```
 */
export declare function getVaultsByPreset(preset: keyof VaultFilterPresets, overrides?: Partial<VaultFilterOptions>): Promise<MorphoVaultInfo[]>;
/**
 * 🔍 **Primary Vault Discovery Function**
 *
 * Get Morpho vaults with comprehensive filtering and sorting options.
 * Uses server-side GraphQL queries for optimal performance.
 *
 * @param options - Vault filtering and sorting options
 * @returns Promise resolving to array of vault information
 *
 * @example
 * ```typescript
 * // Find best USDC vaults across all chains
 * const topVaults = await getVaults({
 *   assetSymbol: "USDC",
 *   minNetApy: 0.05,
 *   minTvl: 1000000,
 *   sortBy: "netApy",
 *   sortOrder: "desc",
 *   limit: 5
 * });
 *
 * // Filter by specific chain
 * const baseVaults = await getVaults({
 *   chainId: 8453, // Base
 *   excludeIdle: true,
 *   sortBy: "totalAssetsUsd"
 * });
 *
 * // Search with multiple criteria
 * const premiumVaults = await getVaults({
 *   minNetApy: 10.0,
 *   minTvl: 5000000,
 *   whitelistedOnly: true,
 *   sortBy: "netApy",
 *   limit: 3
 * });
 * ```
 */
export declare function getVaults(options?: VaultFilterOptions): Promise<MorphoVaultInfo[]>;
/**
 * Get supported chains with active vaults
 */
export declare function getSupportedChainsWithVaults(): Promise<{
    chainId: number;
    name: string;
    vaultCount: number;
}[]>;
/**
 * Get vault discovery summary for a chain
 */
export declare function getVaultDiscoverySummary(chainId: number): Promise<{
    chainId: number;
    chainName: string;
    totalVaults: number;
    totalTvl: number;
    topVaultsByTvl: MorphoVaultInfo[];
    topVaultsByNetApy: MorphoVaultInfo[];
    assetBreakdown: {
        count: number;
        totalTvl: number;
        maxNetApy: number;
        symbol: string;
    }[];
}>;
/**
 * Generic function to execute any Morpho operation, with optional gas sponsorship
 */
export declare function executeMorphoOperation({ provider, pkpPublicKey, vaultAddress, functionName, args, chainId, alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId, }: {
    provider?: any;
    pkpPublicKey: string;
    vaultAddress: string;
    functionName: string;
    args: any[];
    chainId: number;
    alchemyGasSponsor?: boolean;
    alchemyGasSponsorApiKey?: string;
    alchemyGasSponsorPolicyId?: string;
}): Promise<string>;
//# sourceMappingURL=index.d.ts.map