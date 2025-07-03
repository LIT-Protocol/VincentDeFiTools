/**
 * Morpho Vault Addresses indexed by chain name
 */
export const MORPHO_VAULT_ADDRESSES = {
    sepolia: {
        // Test vault addresses for Sepolia (to be updated with actual addresses)
        WETH_VAULT: "0x0000000000000000000000000000000000000000", // Placeholder
    },
    base: {
        // Known Morpho vault addresses on Base
        SEAMLESS_WETH_VAULT: "0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18",
        IONIC_ECOSYSTEM_WETH_VAULT: "0x5A32099837D89E3a794a44fb131CBbAD41f87a8C",
        GAUNTLET_USDC_CORE: "0xc0c5689e6f4D256E861F65465b691aeEcC0dEb12",
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
    const factor = Math.pow(10, decimals);
    const parsed = parseFloat(amount) * factor;
    return Math.floor(parsed).toString();
}
/**
 * Utility function to format amount from wei
 */
export function formatAmount(amount, decimals = 18) {
    const factor = Math.pow(10, decimals);
    const formatted = parseFloat(amount) / factor;
    return formatted.toString();
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
