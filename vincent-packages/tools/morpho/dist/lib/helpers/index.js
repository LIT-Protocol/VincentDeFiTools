import { ethers } from "ethers";
/**
 * Morpho Vault Addresses indexed by chain name
 * @deprecated Use dynamic vault discovery functions instead
 */
export const MORPHO_VAULT_ADDRESSES = {
    sepolia: {
        // Use dynamic vault discovery for Sepolia
        WETH_VAULT: "0x0000000000000000000000000000000000000000", // Placeholder - use getBestVaultsForAsset('WETH')
    },
    base: {
        // Use dynamic vault discovery for Base
        SEAMLESS_WETH_VAULT: "0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18", // Fallback - use getBestVaultsForAsset('WETH')
        IONIC_ECOSYSTEM_WETH_VAULT: "0x5A32099837D89E3a794a44fb131CBbAD41f87a8C", // Fallback - use getBestVaultsForAsset('WETH')
        GAUNTLET_USDC_CORE: "0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12", // Fallback - use getBestVaultsForAsset('USDC')
    },
};
/**
 * Test token addresses indexed by chain name
 */
export const TEST_TOKENS = {
    sepolia: {
        USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
        USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    },
    base: {
        USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        WETH: "0x4200000000000000000000000000000000000006",
        USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    },
};
export const CHAIN_IDS = {
    sepolia: 11155111,
    base: 8453,
};
/**
 * ERC4626 Vault ABI - Essential methods for Morpho vaults
 */
export const ERC4626_VAULT_ABI = [
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
export const ERC20_ABI = [
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
 * Get Morpho vault addresses for a specific chain
 */
export function getMorphoVaultAddresses(chain) {
    const chainKey = chain.toLowerCase();
    if (!(chainKey in MORPHO_VAULT_ADDRESSES)) {
        throw new Error(`Unsupported chain: ${chain}. Supported chains: ${Object.keys(MORPHO_VAULT_ADDRESSES).join(", ")}`);
    }
    return MORPHO_VAULT_ADDRESSES[chainKey];
}
/**
 * Get test token addresses for a specific chain
 */
export function getTestTokens(chain) {
    const chainKey = chain.toLowerCase();
    if (!(chainKey in TEST_TOKENS)) {
        throw new Error(`Unsupported chain: ${chain}. Supported chains: ${Object.keys(TEST_TOKENS).join(", ")}`);
    }
    return TEST_TOKENS[chainKey];
}
/**
 * Utility function to validate Ethereum address
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Utility function to parse amount with decimals
 */
export function parseAmount(amount, decimals = 18) {
    return ethers.utils.parseUnits(amount, decimals).toString();
}
/**
 * Utility function to format amount from wei
 */
export function formatAmount(amount, decimals = 18) {
    return ethers.utils.formatUnits(amount, decimals);
}
/**
 * Validate operation-specific requirements for Morpho vaults
 */
export async function validateOperationRequirements(operation, userBalance, allowance, vaultShares, convertedAmount) {
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
 * Morpho GraphQL API Client
 */
export class MorphoVaultClient {
    apiUrl = 'https://blue-api.morpho.org/graphql';
    /**
     * Fetch vault data from Morpho GraphQL API
     */
    async fetchVaultData(query, variables) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.errors) {
                throw new Error(`GraphQL error: ${data.errors.map((e) => e.message).join(', ')}`);
            }
            return data.data;
        }
        catch (error) {
            console.error('Failed to fetch vault data:', error);
            throw error;
        }
    }
    /**
     * Get all vaults with comprehensive information
     */
    async getAllVaults(options = {}) {
        const query = `
      query GetAllVaults($first: Int, $orderBy: VaultOrderBy, $orderDirection: OrderDirection) {
        vaults(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
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
            orderBy: this.mapSortBy(options.sortBy || 'totalAssetsUsd'),
            orderDirection: options.sortOrder === 'asc' ? 'Asc' : 'Desc',
        };
        const data = await this.fetchVaultData(query, variables);
        const vaults = data.vaults.items.map((vault) => this.mapVaultData(vault));
        return this.filterVaults(vaults, options);
    }
    /**
     * Get vaults by asset (token)
     */
    async getVaultsByAsset(assetAddress, options = {}) {
        const allVaults = await this.getAllVaults(options);
        return allVaults.filter(vault => vault.asset.address.toLowerCase() === assetAddress.toLowerCase());
    }
    /**
     * Get vaults by chain
     */
    async getVaultsByChain(chainId, options = {}) {
        const allVaults = await this.getAllVaults(options);
        return allVaults.filter(vault => vault.chain.id === chainId);
    }
    /**
     * Get top vaults by APY
     */
    async getTopVaultsByApy(limit = 10, minTvl = 0) {
        return this.getAllVaults({
            sortBy: 'apy',
            sortOrder: 'desc',
            limit,
            minTvl,
            excludeIdle: true,
        });
    }
    /**
     * Get top vaults by TVL
     */
    async getTopVaultsByTvl(limit = 10) {
        return this.getAllVaults({
            sortBy: 'totalAssetsUsd',
            sortOrder: 'desc',
            limit,
            excludeIdle: true,
        });
    }
    /**
     * Search vaults by name, symbol, or asset
     */
    async searchVaults(searchOptions) {
        const allVaults = await this.getAllVaults({ limit: 1000 });
        if (!searchOptions.query) {
            return allVaults.slice(0, searchOptions.limit || 50);
        }
        const query = searchOptions.query.toLowerCase();
        const filtered = allVaults.filter(vault => vault.name.toLowerCase().includes(query) ||
            vault.symbol.toLowerCase().includes(query) ||
            vault.asset.symbol.toLowerCase().includes(query) ||
            vault.asset.name.toLowerCase().includes(query));
        return filtered.slice(0, searchOptions.limit || 50);
    }
    /**
     * Get vault details by address
     */
    async getVaultByAddress(address, chainId) {
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
            return data.vaultByAddress ? this.mapVaultData(data.vaultByAddress) : null;
        }
        catch (error) {
            console.error(`Failed to fetch vault ${address}:`, error);
            return null;
        }
    }
    /**
     * Get best vaults for a specific asset
     */
    async getBestVaultsForAsset(assetSymbol, limit = 5) {
        const vaults = await this.getAllVaults({
            sortBy: 'apy',
            sortOrder: 'desc',
            limit: 100,
            minTvl: 10000, // Minimum $10k TVL
            excludeIdle: true,
        });
        return vaults
            .filter(vault => vault.asset.symbol.toLowerCase() === assetSymbol.toLowerCase())
            .slice(0, limit);
    }
    /**
     * Map vault data from GraphQL response
     */
    mapVaultData(vault) {
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
                totalAssets: vault.state.totalAssets || '0',
                totalAssetsUsd: vault.state.totalAssetsUsd || 0,
                fee: vault.state.fee || 0,
                rewards: vault.state.rewards?.map((reward) => ({
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
     * Filter vaults based on options
     */
    filterVaults(vaults, options) {
        let filtered = vaults;
        if (options.minApy !== undefined) {
            filtered = filtered.filter(vault => vault.metrics.apy >= options.minApy);
        }
        if (options.maxApy !== undefined) {
            filtered = filtered.filter(vault => vault.metrics.apy <= options.maxApy);
        }
        if (options.minTotalAssets !== undefined) {
            filtered = filtered.filter(vault => parseFloat(vault.metrics.totalAssets) >= options.minTotalAssets);
        }
        if (options.maxTotalAssets !== undefined) {
            filtered = filtered.filter(vault => parseFloat(vault.metrics.totalAssets) <= options.maxTotalAssets);
        }
        if (options.minTvl !== undefined) {
            filtered = filtered.filter(vault => vault.metrics.totalAssetsUsd >= options.minTvl);
        }
        if (options.maxTvl !== undefined) {
            filtered = filtered.filter(vault => vault.metrics.totalAssetsUsd <= options.maxTvl);
        }
        if (options.assetSymbol) {
            filtered = filtered.filter(vault => vault.asset.symbol.toLowerCase() === options.assetSymbol.toLowerCase());
        }
        if (options.assetAddress) {
            filtered = filtered.filter(vault => vault.asset.address.toLowerCase() === options.assetAddress.toLowerCase());
        }
        if (options.whitelistedOnly) {
            filtered = filtered.filter(vault => vault.whitelisted);
        }
        if (options.excludeIdle) {
            filtered = filtered.filter(vault => !vault.isIdle);
        }
        if (options.chain !== undefined) {
            const chainId = typeof options.chain === 'string' ? CHAIN_IDS[options.chain] : options.chain;
            filtered = filtered.filter(vault => vault.chain.id === chainId);
        }
        return filtered;
    }
    /**
     * Map sortBy option to GraphQL enum
     */
    mapSortBy(sortBy) {
        switch (sortBy) {
            case 'apy':
                return 'NetApy';
            case 'totalAssets':
                return 'TotalAssets';
            case 'totalAssetsUsd':
                return 'TotalAssetsUsd';
            case 'creationTimestamp':
                return 'CreationTimestamp';
            default:
                return 'TotalAssetsUsd';
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
export async function getBestVaultsForAsset(assetSymbol, limit = 5) {
    return morphoVaultClient.getBestVaultsForAsset(assetSymbol, limit);
}
/**
 * Helper function to get top vaults by APY
 */
export async function getTopVaultsByApy(limit = 10, minTvl = 10000) {
    return morphoVaultClient.getTopVaultsByApy(limit, minTvl);
}
/**
 * Helper function to get top vaults by TVL
 */
export async function getTopVaultsByTvl(limit = 10) {
    return morphoVaultClient.getTopVaultsByTvl(limit);
}
/**
 * Helper function to search vaults
 */
export async function searchVaults(query, limit = 20) {
    return morphoVaultClient.searchVaults({ query, limit });
}
/**
 * Helper function to get vaults by chain
 */
export async function getVaultsByChain(chainId, options = {}) {
    return morphoVaultClient.getVaultsByChain(chainId, options);
}
/**
 * Updated function to get vault addresses from the API instead of hardcoded
 */
export async function getTopVaultAddresses(chain, limit = 5) {
    const chainId = CHAIN_IDS[chain.toLowerCase()];
    if (!chainId) {
        throw new Error(`Unsupported chain: ${chain}`);
    }
    const vaults = await morphoVaultClient.getVaultsByChain(chainId, {
        sortBy: 'totalAssetsUsd',
        sortOrder: 'desc',
        limit,
        excludeIdle: true,
    });
    return vaults.map(vault => vault.address);
}
/**
 * Get the best vault address for a specific asset on a chain
 */
export async function getBestVaultAddress(asset, chain) {
    const vaults = await getBestVaultsForAsset(asset, 1);
    const chainId = CHAIN_IDS[chain.toLowerCase()];
    const chainVault = vaults.find(vault => vault.chain.id === chainId);
    return chainVault ? chainVault.address : null;
}
/**
 * Dynamic vault discovery function that replaces hardcoded addresses
 */
export async function getVaultAddressForAsset(asset, chain) {
    try {
        const vaultAddress = await getBestVaultAddress(asset, chain);
        if (vaultAddress) {
            return vaultAddress;
        }
        // Fallback to hardcoded addresses if API fails
        console.warn(`Failed to get dynamic vault for ${asset} on ${chain}, using fallback`);
        const fallbackVaults = getMorphoVaultAddresses(chain);
        // Map asset to fallback vault
        if (asset.toLowerCase() === 'weth' && 'SEAMLESS_WETH_VAULT' in fallbackVaults) {
            return fallbackVaults.SEAMLESS_WETH_VAULT;
        }
        if (asset.toLowerCase() === 'usdc' && 'GAUNTLET_USDC_CORE' in fallbackVaults) {
            return fallbackVaults.GAUNTLET_USDC_CORE;
        }
        throw new Error(`No vault found for asset ${asset} on chain ${chain}`);
    }
    catch (error) {
        console.error(`Error getting vault for ${asset} on ${chain}:`, error);
        throw error;
    }
}
