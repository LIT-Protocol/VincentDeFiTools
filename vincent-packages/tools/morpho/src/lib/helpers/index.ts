import { ethers } from "ethers";

/**
 * Well-known token addresses across different chains
 * Using official Circle USDC and canonical WETH addresses
 */
export const WELL_KNOWN_TOKENS = {
  // Ethereum mainnet
  1: {
    USDC: "0xA0b86991c6218A36c1D19D4a2e9Eb0cE3606eB48", // Circle USDC
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Canonical WETH
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Tether USDT
  },
  // Base
  8453: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native USDC on Base
    WETH: "0x4200000000000000000000000000000000000006", // WETH on Base
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // USDT on Base
  },
  // Arbitrum One
  42161: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Native USDC on Arbitrum
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
  },
  // Optimism
  10: {
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Native USDC on Optimism
    WETH: "0x4200000000000000000000000000000000000006", // WETH on Optimism
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT on Optimism
  },
  // Polygon
  137: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC on Polygon
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
  },
  // Sepolia testnet
  11155111: {
    USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Test USDC on Sepolia
    WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", // Test WETH on Sepolia
    USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", // Test USDT on Sepolia
  },
} as const;

/**
 * Supported chain IDs and their names
 */
export const SUPPORTED_CHAINS = {
  1: "ethereum",
  8453: "base",
  42161: "arbitrum",
  10: "optimism",
  137: "polygon",
  11155111: "sepolia",
} as const;

/**
 * Chain names to IDs mapping for backwards compatibility
 */
export const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  sepolia: 11155111,
} as const;

/**
 * ERC4626 Vault ABI - Essential methods for Morpho vaults
 */
export const ERC4626_VAULT_ABI: any[] = [
  // Deposit
  {
    inputs: [
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Withdraw
  {
    inputs: [
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Redeem
  {
    inputs: [
      { internalType: "uint256", name: "shares", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "redeem",
    outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Asset (underlying token address)
  {
    inputs: [],
    name: "asset",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // Balance of shares
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Convert assets to shares
  {
    inputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
    name: "convertToShares",
    outputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Convert shares to assets
  {
    inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ internalType: "uint256", name: "assets", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Total assets managed by the vault
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * ERC20 Token ABI - Essential methods only
 */
export const ERC20_ABI: any[] = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

/**
 * Supported chain type
 */
export type SupportedChainId = keyof typeof WELL_KNOWN_TOKENS;
export type SupportedChainName = keyof typeof CHAIN_IDS;

/**
 * Get well-known token addresses for a specific chain
 */
export function getTokenAddresses(chainId: number) {
  if (!(chainId in WELL_KNOWN_TOKENS)) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(
        WELL_KNOWN_TOKENS
      ).join(", ")}`
    );
  }
  return WELL_KNOWN_TOKENS[chainId as SupportedChainId];
}

/**
 * Get token address for a specific token symbol and chain
 */
export function getTokenAddress(symbol: string, chainId: number): string {
  const tokens = getTokenAddresses(chainId);
  const upperSymbol = symbol.toUpperCase() as keyof typeof tokens;

  if (!(upperSymbol in tokens)) {
    throw new Error(
      `Token ${symbol} not found on chain ${chainId}. Available tokens: ${Object.keys(
        tokens
      ).join(", ")}`
    );
  }

  return tokens[upperSymbol];
}

/**
 * Check if a chain is supported by Morpho
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in WELL_KNOWN_TOKENS;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(WELL_KNOWN_TOKENS).map(Number);
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  return (
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] ||
    `chain-${chainId}`
  );
}

/**
 * Utility function to validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Utility function to parse amount with decimals
 */
export function parseAmount(amount: string, decimals: number = 18): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

/**
 * Utility function to format amount from wei
 */
export function formatAmount(amount: string, decimals: number = 18): string {
  return ethers.utils.formatUnits(amount, decimals);
}

/**
 * Validate operation-specific requirements for Morpho vaults
 */
export async function validateOperationRequirements(
  operation: string,
  userBalance: string,
  allowance: string,
  vaultShares: string,
  convertedAmount: string
): Promise<{ valid: boolean; error?: string }> {
  const userBalanceBN = BigInt(userBalance);
  const allowanceBN = BigInt(allowance);
  const vaultSharesBN = BigInt(vaultShares);
  const convertedAmountBN = BigInt(convertedAmount);

  switch (operation) {
    case "deposit":
      // Check if user has enough balance
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for deposit operation. You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved vault to spend tokens
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for deposit operation. Please approve vault to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    case "withdraw":
      // For withdraw, we need to check if user has enough vault shares
      if (vaultSharesBN === 0n) {
        return {
          valid: false,
          error: "No vault shares available for withdrawal",
        };
      }
      // Note: We'll need to convert the amount to shares in the actual implementation
      break;

    case "redeem":
      // For redeem, we need to check if user has enough vault shares
      if (vaultSharesBN === 0n) {
        return {
          valid: false,
          error: "No vault shares available for redeem",
        };
      }
      // For redeem, the amount is in shares, so check directly
      if (vaultSharesBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient vault shares for redeem operation. You have ${vaultShares} shares and need ${convertedAmount} shares`,
        };
      }
      break;

    default:
      return { valid: false, error: `Unsupported operation: ${operation}` };
  }

  return { valid: true };
}

/**
 * Morpho Vault Information Interface
 */
export interface MorphoVaultInfo {
  address: string;
  name: string;
  symbol: string;
  asset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  chain: {
    id: number;
    network: string;
  };
  metrics: {
    apy: number;
    netApy: number;
    totalAssets: string;
    totalAssetsUsd: number;
    fee: number;
    rewards?: Array<{
      asset: string;
      supplyApr: number;
      yearlySupplyTokens: string;
    }>;
  };
  whitelisted: boolean;
  creationTimestamp: number;
  isIdle?: boolean;
}

/**
 * Unified Vault Filter Options
 * Supports filtering by asset, chain, performance metrics, and more
 */
export interface VaultFilterOptions {
  // Asset filtering
  assetSymbol?: string;
  assetAddress?: string;

  // Chain filtering (supports both name and ID for flexibility)
  chain?: string | number;
  chainId?: number;

  // Performance filtering
  minApy?: number;
  maxApy?: number;
  minTotalAssets?: number;
  maxTotalAssets?: number;
  minTvl?: number; // Minimum TVL in USD
  maxTvl?: number; // Maximum TVL in USD

  // Vault status filtering
  whitelistedOnly?: boolean;
  excludeIdle?: boolean;

  // Sorting and pagination
  sortBy?: "apy" | "totalAssets" | "totalAssetsUsd" | "creationTimestamp";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

/**
 * Vault Search Options
 */
export interface VaultSearchOptions {
  query?: string; // Search in name, symbol, or asset
  chains?: Array<string | number>;
  limit?: number;
  offset?: number;
}

/**
 * Morpho GraphQL API Client
 */
export class MorphoVaultClient {
  private readonly apiUrl = "https://blue-api.morpho.org/graphql";

  /**
   * Fetch vault data from Morpho GraphQL API
   */
  private async fetchVaultData(query: string, variables?: any): Promise<any> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} and body: ${body}`
        );
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(
          `GraphQL error: ${data.errors.map((e: any) => e.message).join(", ")}`
        );
      }

      return data.data;
    } catch (error) {
      console.error("Failed to fetch vault data:", error);
      throw error;
    }
  }

  /**
   * Get all vaults with comprehensive information
   * Now uses proper server-side filtering via GraphQL VaultFilters
   */
  async getAllVaults(
    options: VaultFilterOptions = {}
  ): Promise<MorphoVaultInfo[]> {
    console.log("getAllVaults", options);

    // Build GraphQL where clause from options
    const whereClause = this.buildVaultFilters(options);

    const query = `
      query GetAllVaults($first: Int, $orderBy: VaultOrderBy, $orderDirection: OrderDirection, $where: VaultFilters) {
        vaults(first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
          items {
            address
            name
            symbol
            whitelisted
            creationTimestamp
            asset {
              address
              symbol
              name
              decimals
            }
            chain {
              id
              network
            }
            state {
              apy
              netApy
              totalAssets
              totalAssetsUsd
              fee
              rewards {
                asset {
                  address
                  symbol
                }
                supplyApr
                yearlySupplyTokens
              }
            }
          }
        }
      }
    `;

    const variables = {
      first: options.limit || 100,
      orderBy: this.mapSortBy(options.sortBy || "totalAssetsUsd"),
      orderDirection: options.sortOrder === "asc" ? "Asc" : "Desc",
      where: whereClause,
    };

    const data = await this.fetchVaultData(query, variables);
    const vaults = data.vaults.items.map((vault: any) =>
      this.mapVaultData(vault)
    );

    console.log("vaults after server-side filtering", vaults.length);

    // Apply only remaining client-side filters not supported by GraphQL
    const filtered = this.applyRemainingClientFilters(vaults, options);
    console.log("vaults after additional client filtering", filtered.length);
    return filtered;
  }

  /**
   * Unified function to get vaults with flexible filtering
   * Supports filtering by asset, chain, and all other options
   */
  async getVaults(
    options: VaultFilterOptions = {}
  ): Promise<MorphoVaultInfo[]> {
    // If specific asset or chain filters are provided, enhance the options
    const enhancedOptions = { ...options };

    // Handle chain filtering - support both chainId and chain name/ID
    if (options.chainId) {
      enhancedOptions.chain = options.chainId;
    }

    return this.getAllVaults(enhancedOptions);
  }

  /**
   * Get top vaults by APY
   */
  async getTopVaultsByApy(
    limit: number = 10,
    minTvl: number = 0
  ): Promise<MorphoVaultInfo[]> {
    return this.getAllVaults({
      sortBy: "apy",
      sortOrder: "desc",
      limit,
      minTvl,
      excludeIdle: true,
    });
  }

  /**
   * Get top vaults by TVL
   */
  async getTopVaultsByTvl(limit: number = 10): Promise<MorphoVaultInfo[]> {
    return this.getAllVaults({
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit,
      excludeIdle: true,
    });
  }

  /**
   * Search vaults by name, symbol, or asset
   */
  async searchVaults(
    searchOptions: VaultSearchOptions
  ): Promise<MorphoVaultInfo[]> {
    const allVaults = await this.getAllVaults({ limit: 1000 });

    if (!searchOptions.query) {
      return allVaults.slice(0, searchOptions.limit || 50);
    }

    const query = searchOptions.query.toLowerCase();
    const filtered = allVaults.filter(
      (vault) =>
        vault.name.toLowerCase().includes(query) ||
        vault.symbol.toLowerCase().includes(query) ||
        vault.asset.symbol.toLowerCase().includes(query) ||
        vault.asset.name.toLowerCase().includes(query)
    );

    return filtered.slice(0, searchOptions.limit || 50);
  }

  /**
   * Get vault details by address
   */
  async getVaultByAddress(
    address: string,
    chainId: number
  ): Promise<MorphoVaultInfo | null> {
    const query = `
      query GetVaultByAddress($address: String!, $chainId: Int!) {
        vaultByAddress(address: $address, chainId: $chainId) {
          address
          name
          symbol
          whitelisted
          creationTimestamp
          asset {
            address
            symbol
            name
            decimals
          }
          chain {
            id
            network
          }
          state {
            apy
            netApy
            totalAssets
            totalAssetsUsd
            fee
            rewards {
              asset {
                address
                symbol
              }
              supplyApr
              yearlySupplyTokens
            }
          }
        }
      }
    `;

    const variables = { address, chainId };

    try {
      const data = await this.fetchVaultData(query, variables);
      return data.vaultByAddress
        ? this.mapVaultData(data.vaultByAddress)
        : null;
    } catch (error) {
      console.error(`Failed to fetch vault ${address}:`, error);
      return null;
    }
  }

  /**
   * Get best vaults for a specific asset
   */
  async getBestVaultsForAsset(
    assetSymbol: string,
    limit: number = 5
  ): Promise<MorphoVaultInfo[]> {
    const vaults = await this.getAllVaults({
      sortBy: "apy",
      sortOrder: "desc",
      limit: 100,
      minTvl: 10000, // Minimum $10k TVL
      excludeIdle: true,
    });

    return vaults
      .filter(
        (vault) =>
          vault.asset.symbol.toLowerCase() === assetSymbol.toLowerCase()
      )
      .slice(0, limit);
  }

  /**
   * Map vault data from GraphQL response
   */
  private mapVaultData(vault: any): MorphoVaultInfo {
    return {
      address: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      asset: {
        address: vault.asset.address,
        symbol: vault.asset.symbol,
        name: vault.asset.name,
        decimals: vault.asset.decimals,
      },
      chain: {
        id: vault.chain.id,
        network: vault.chain.network,
      },
      metrics: {
        apy: vault.state.apy || 0,
        netApy: vault.state.netApy || 0,
        totalAssets: vault.state.totalAssets || "0",
        totalAssetsUsd: vault.state.totalAssetsUsd || 0,
        fee: vault.state.fee || 0,
        rewards:
          vault.state.rewards?.map((reward: any) => ({
            asset: reward.asset.address,
            supplyApr: reward.supplyApr,
            yearlySupplyTokens: reward.yearlySupplyTokens,
          })) || [],
      },
      whitelisted: vault.whitelisted,
      creationTimestamp: vault.creationTimestamp,
      isIdle: vault.state.totalAssetsUsd < 100, // Consider vaults with < $100 TVL as idle
    };
  }

  /**
   * Build GraphQL VaultFilters from filter options
   * Uses proper server-side filtering for better performance
   */
  private buildVaultFilters(options: VaultFilterOptions): any {
    const filters: any = {};

    // Chain filtering - server-side supported
    if (options.chain !== undefined || options.chainId !== undefined) {
      let targetChainId: number | undefined;

      if (options.chainId !== undefined) {
        targetChainId = options.chainId;
      } else if (options.chain !== undefined) {
        targetChainId =
          typeof options.chain === "string"
            ? CHAIN_IDS[options.chain as keyof typeof CHAIN_IDS]
            : options.chain;
      }

      if (targetChainId !== undefined) {
        filters.chainId_in = [targetChainId];
      }
    }

    // Asset filtering - server-side supported
    if (options.assetAddress) {
      filters.assetAddress_in = [options.assetAddress.toLowerCase()];
    }

    if (options.assetSymbol) {
      filters.assetSymbol_in = [options.assetSymbol.toUpperCase()];
    }

    // Whitelisted status filtering - server-side supported
    if (options.whitelistedOnly) {
      filters.whitelisted = true;
    }

    // APY filtering - server-side supported
    if (options.minApy !== undefined) {
      filters.apy_gte = options.minApy;
    }

    if (options.maxApy !== undefined) {
      filters.apy_lte = options.maxApy;
    }

    // TVL filtering - server-side supported
    if (options.minTvl !== undefined) {
      filters.totalAssetsUsd_gte = options.minTvl;
    }

    if (options.maxTvl !== undefined) {
      filters.totalAssetsUsd_lte = options.maxTvl;
    }

    // Total assets filtering - server-side supported
    if (options.minTotalAssets !== undefined) {
      filters.totalAssets_gte = options.minTotalAssets.toString();
    }

    if (options.maxTotalAssets !== undefined) {
      filters.totalAssets_lte = options.maxTotalAssets.toString();
    }

    console.log("Built VaultFilters:", filters);

    // Return null if no filters to avoid empty where clause
    return Object.keys(filters).length > 0 ? filters : null;
  }

  /**
   * Apply remaining client-side filters not supported by GraphQL
   * Only handles computed properties like isIdle
   */
  private applyRemainingClientFilters(
    vaults: MorphoVaultInfo[],
    options: VaultFilterOptions
  ): MorphoVaultInfo[] {
    let filtered = vaults;

    // Idle vault filtering (computed client-side)
    if (options.excludeIdle) {
      filtered = filtered.filter((vault) => !vault.isIdle);
    }

    return filtered;
  }

  /**
   * Map sortBy option to GraphQL enum
   */
  private mapSortBy(sortBy: string): string {
    switch (sortBy) {
      case "apy":
        return "NetApy";
      case "totalAssets":
        return "TotalAssets";
      case "totalAssetsUsd":
        return "TotalAssetsUsd";
      case "creationTimestamp":
        return "CreationTimestamp";
      default:
        return "TotalAssetsUsd";
    }
  }
}

/**
 * Create a singleton instance of MorphoVaultClient
 */
export const morphoVaultClient = new MorphoVaultClient();

/**
 * Helper function to get best vaults for a specific asset
 */
export async function getBestVaultsForAsset(
  assetSymbol: string,
  limit: number = 5
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getBestVaultsForAsset(assetSymbol, limit);
}

/**
 * Helper function to get top vaults by APY
 */
export async function getTopVaultsByApy(
  limit: number = 10,
  minTvl: number = 10000
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getTopVaultsByApy(limit, minTvl);
}

/**
 * Helper function to get top vaults by TVL
 */
export async function getTopVaultsByTvl(
  limit: number = 10
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getTopVaultsByTvl(limit);
}

/**
 * Helper function to search vaults
 */
export async function searchVaults(
  query: string,
  limit: number = 20
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.searchVaults({ query, limit });
}

/**
 * Unified function to get vaults with flexible filtering
 * Supports filtering by asset, chain, performance metrics, and more
 */
export async function getVaults(
  options: VaultFilterOptions = {}
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getVaults(options);
}

/**
 * Get supported chains with active vaults
 */
export async function getSupportedChainsWithVaults(): Promise<
  { chainId: number; name: string; vaultCount: number }[]
> {
  const supportedChains = getSupportedChainIds();
  const results = [];

  for (const chainId of supportedChains) {
    try {
      const vaults = await morphoVaultClient.getVaults({
        chainId,
        limit: 1,
        excludeIdle: true,
      });

      if (vaults.length > 0) {
        // Get total count
        const allVaults = await morphoVaultClient.getVaults({
          chainId,
          limit: 1000,
          excludeIdle: true,
        });

        results.push({
          chainId,
          name: getChainName(chainId),
          vaultCount: allVaults.length,
        });
      }
    } catch (error) {
      console.warn(
        `Could not fetch vaults for chain ${chainId}:`,
        error.message
      );
    }
  }

  return results.sort((a, b) => b.vaultCount - a.vaultCount);
}

/**
 * Get vault discovery summary for a chain
 */
export async function getVaultDiscoverySummary(chainId: number) {
  try {
    const [topByTvl, topByApy, assetBreakdown] = await Promise.all([
      morphoVaultClient.getVaults({
        chainId,
        sortBy: "totalAssetsUsd",
        sortOrder: "desc",
        limit: 5,
        excludeIdle: true,
      }),
      morphoVaultClient.getVaults({
        chainId,
        sortBy: "apy",
        sortOrder: "desc",
        limit: 5,
        excludeIdle: true,
      }),
      morphoVaultClient.getVaults({
        chainId,
        limit: 1000,
        excludeIdle: true,
      }),
    ]);

    // Group by asset
    const assetGroups = assetBreakdown.reduce((acc, vault) => {
      const symbol = vault.asset.symbol;
      if (!acc[symbol]) {
        acc[symbol] = { count: 0, totalTvl: 0, maxApy: 0 };
      }
      acc[symbol].count++;
      acc[symbol].totalTvl += vault.metrics.totalAssetsUsd;
      acc[symbol].maxApy = Math.max(acc[symbol].maxApy, vault.metrics.apy);
      return acc;
    }, {} as Record<string, { count: number; totalTvl: number; maxApy: number }>);

    return {
      chainId,
      chainName: getChainName(chainId),
      totalVaults: assetBreakdown.length,
      totalTvl: assetBreakdown.reduce(
        (sum, v) => sum + v.metrics.totalAssetsUsd,
        0
      ),
      topVaultsByTvl: topByTvl,
      topVaultsByApy: topByApy,
      assetBreakdown: Object.entries(assetGroups)
        .map(([symbol, data]) => ({ symbol, ...data }))
        .sort((a, b) => b.totalTvl - a.totalTvl),
    };
  } catch (error) {
    console.error(`Error getting vault summary for chain ${chainId}:`, error);
    throw error;
  }
}
