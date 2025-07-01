/**
 * AAVE v3 Protocol Constants for Ethereum Sepolia Testnet
 */
export const AAVE_V3_SEPOLIA_ADDRESSES = {
  POOL: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
  POOL_ADDRESSES_PROVIDER: "0x0496275d34753A48320CA58103d5220d394FF77F",
} as const;

/**
 * Common test token addresses on Ethereum Sepolia for AAVE v3
 */
export const SEPOLIA_TEST_TOKENS = {
  USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  WETH: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
  AAVE: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
  WBTC: "0x29f2D40B0605204364af54EC677bD022dA425d03",
} as const;

/**
 * AAVE v3 Pool Contract ABI - Essential methods only
 */
export const AAVE_POOL_ABI: any[] = [
  // Supply
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
      { internalType: "uint16", name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Withdraw
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Borrow
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "interestRateMode", type: "uint256" },
      { internalType: "uint16", name: "referralCode", type: "uint16" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Repay
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "interestRateMode", type: "uint256" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
    ],
    name: "repay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // getUserAccountData
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { internalType: "uint256", name: "totalCollateralBase", type: "uint256" },
      { internalType: "uint256", name: "totalDebtBase", type: "uint256" },
      {
        internalType: "uint256",
        name: "availableBorrowsBase",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentLiquidationThreshold",
        type: "uint256",
      },
      { internalType: "uint256", name: "ltv", type: "uint256" },
      { internalType: "uint256", name: "healthFactor", type: "uint256" },
    ],
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
 * Interest Rate Modes for AAVE
 */
export const INTEREST_RATE_MODE = {
  NONE: 0,
  STABLE: 1,
  VARIABLE: 2,
} as const;

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
  const factor = Math.pow(10, decimals);
  const parsed = parseFloat(amount) * factor;
  return Math.floor(parsed).toString();
}

/**
 * Utility function to format amount from wei
 */
export function formatAmount(amount: string, decimals: number = 18): string {
  const factor = Math.pow(10, decimals);
  const formatted = parseFloat(amount) / factor;
  return formatted.toString();
}

/**
 * Validate operation-specific requirements
 */
export async function validateOperationRequirements(
  operation: string,
  userBalance: string,
  allowance: string,
  borrowCapacity: string,
  convertedAmount: string,
  interestRateMode?: number
): Promise<{ valid: boolean; error?: string }> {
  const userBalanceBN = BigInt(userBalance);
  const allowanceBN = BigInt(allowance);
  const borrowCapacityBN = BigInt(borrowCapacity);
  const convertedAmountBN = BigInt(convertedAmount);

  switch (operation) {
    case "supply":
      // Check if user has enough balance
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for supply operation.  You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved AAVE to spend tokens
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for supply operation. Please approve AAVE to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    case "withdraw":
      // For withdraw, we need to check if user has enough aTokens (collateral)
      // This would require checking aToken balance, but for now we'll just check if they have any collateral
      if (borrowCapacityBN === 0n && userBalanceBN === 0n) {
        return {
          valid: false,
          error: "No collateral available for withdrawal",
        };
      }
      break;

    case "borrow":
      // Check if user has enough borrowing capacity
      if (borrowCapacityBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient borrowing capacity.  You have ${borrowCapacity} and need ${convertedAmount}`,
        };
      }
      break;

    case "repay":
      // Check if user has enough balance to repay
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for repay operation.  You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved AAVE to spend tokens for repayment
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for repay operation. Please approve AAVE to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    default:
      return { valid: false, error: `Unsupported operation: ${operation}` };
  }

  return { valid: true };
}
