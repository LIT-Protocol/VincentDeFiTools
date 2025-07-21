/**
 * Test token addresses indexed by chain name
 */
export declare const TEST_TOKENS: {
    readonly sepolia: {
        readonly USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
        readonly WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
        readonly USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
        readonly AAVE: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a";
        readonly WBTC: "0x29f2D40B0605204364af54EC677bD022dA425d03";
    };
    readonly base: {
        readonly USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        readonly WETH: "0x4200000000000000000000000000000000000006";
        readonly USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
        readonly AAVE: "0xEB4c2781e4ebA804CE9a9803C67d0893436bB27D";
        readonly WBTC: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c";
    };
};
export declare const CHAIN_IDS: {
    readonly sepolia: 11155111;
    readonly base: 8453;
};
/**
 * AAVE v3 Pool Contract ABI - Essential methods only
 */
export declare const AAVE_POOL_ABI: any[];
/**
 * ERC20 Token ABI - Essential methods only
 */
export declare const ERC20_ABI: any[];
/**
 * Interest Rate Modes for AAVE
 */
export declare const INTEREST_RATE_MODE: {
    readonly NONE: 0;
    readonly STABLE: 1;
    readonly VARIABLE: 2;
};
/**
 * Chain name to Aave Address Book mapping
 */
export declare const CHAIN_TO_AAVE_ADDRESS_BOOK: Record<string, () => any>;
/**
 * Supported chain names
 */
export type SupportedChain = keyof typeof CHAIN_TO_AAVE_ADDRESS_BOOK;
/**
 * Get AAVE addresses for a specific chain using the Aave Address Book
 */
export declare function getAaveAddresses(chain: string): {
    POOL: any;
    POOL_ADDRESSES_PROVIDER: any;
};
/**
 * Get test token addresses for a specific chain
 */
export declare function getTestTokens(chain: string): any;
/**
 * Get available markets (asset addresses) for a specific chain using the Aave Address Book
 */
export declare function getAvailableMarkets(chain: string): Record<string, string>;
/**
 * Get all supported chains
 */
export declare function getSupportedChains(): string[];
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
 * Validate operation-specific requirements
 */
export declare function validateOperationRequirements(operation: string, userBalance: string, allowance: string, borrowCapacity: string, convertedAmount: string, _interestRateMode?: number): Promise<{
    valid: boolean;
    error?: string;
}>;
//# sourceMappingURL=index.d.ts.map