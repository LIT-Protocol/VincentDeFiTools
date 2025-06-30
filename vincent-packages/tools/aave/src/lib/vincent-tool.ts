import {
  createVincentTool,
  supportedPoliciesForTool,
} from "@lit-protocol/vincent-tool-sdk";
import "@lit-protocol/vincent-tool-sdk/internal";

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
  AaveOperation,
} from "./schemas";

import {
  AAVE_V3_SEPOLIA_ADDRESSES,
  AAVE_POOL_ABI,
  ERC20_ABI,
  INTEREST_RATE_MODE,
  isValidAddress,
  parseAmount,
} from "./helpers";

import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";

export const vincentTool = createVincentTool({
  packageName: "@lit-protocol/vincent-tool-aave" as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail }) => {
    console.log("[@lit-protocol/vincent-tool-aave/precheck]");
    console.log("[@lit-protocol/vincent-tool-aave/precheck] params:", {
      toolParams,
    });

    const { operation, asset, amount, interestRateMode } = toolParams;

    // Validate operation
    if (!Object.values(AaveOperation).includes(operation)) {
      return fail({
        error:
          "[@lit-protocol/vincent-tool-aave/precheck] Invalid operation. Must be supply, withdraw, borrow, or repay",
      });
    }

    // Validate asset address
    if (!isValidAddress(asset)) {
      return fail({
        error:
          "[@lit-protocol/vincent-tool-aave/precheck] Invalid asset address format",
      });
    }

    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return fail({
        error:
          "[@lit-protocol/vincent-tool-aave/precheck] Invalid amount format or amount must be greater than 0",
      });
    }

    // Validate interest rate mode for borrow operations
    if (operation === AaveOperation.BORROW) {
      if (
        !interestRateMode ||
        (interestRateMode !== INTEREST_RATE_MODE.STABLE &&
          interestRateMode !== INTEREST_RATE_MODE.VARIABLE)
      ) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-aave/precheck] Interest rate mode is required for borrow operations (1 = Stable, 2 = Variable)",
        });
      }
    }

    // Basic validation passed
    const successResult = {
      operationValid: true,
      assetValid: true,
      amountValid: true,
    };

    console.log(
      "[@lit-protocol/vincent-tool-aave/precheck] Success result:",
      successResult
    );
    const successResponse = succeed(successResult);
    console.log(
      "[@lit-protocol/vincent-tool-aave/precheck] Success response:",
      JSON.stringify(successResponse, null, 2)
    );
    return successResponse;
  },

  execute: async ({ toolParams }, { succeed, fail, delegation }) => {
    try {
      const { operation, asset, amount, interestRateMode, onBehalfOf, chain } =
        toolParams;

      console.log(
        "[@lit-protocol/vincent-tool-aave/execute] Executing AAVE Tool",
        {
          operation,
          asset,
          amount,
          interestRateMode,
        }
      );

      // Get provider - for AAVE operations, we need to work with Sepolia testnet
      // The Vincent framework typically uses Yellowstone, but AAVE is deployed on Sepolia
      let provider;
      try {
        // For now, try to get the default provider, but this will need configuration
        // In a real deployment, this would be configured via Vincent SDK settings
        provider = new ethers.providers.JsonRpcProvider(
          await Lit.Actions.getRpcUrl({ chain })
        );
        console.log("provider", provider);
        console.log(
          "[@lit-protocol/vincent-tool-aave/execute] Using configured provider"
        );
      } catch (error) {
        console.error(
          "[@lit-protocol/vincent-tool-aave/execute] Provider error:",
          error
        );
        throw new Error(
          "Unable to obtain blockchain provider for AAVE operations"
        );
      }

      const { chainId } = await provider.getNetwork();

      // get decimals of asset
      const assetContract = new ethers.Contract(asset, ERC20_ABI, provider);
      const assetDecimals = await assetContract.decimals();
      console.log(
        "[@lit-protocol/vincent-tool-aave/execute] Asset decimals:",
        assetDecimals
      );
      const convertedAmount = parseAmount(amount, assetDecimals);
      console.log(
        "[@lit-protocol/vincent-tool-aave/execute] Converted amount:",
        convertedAmount
      );

      // Get PKP public key from delegation context
      const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
      if (!pkpPublicKey) {
        throw new Error("PKP public key not available from delegation context");
      }

      // Get PKP address using ethers utils
      const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);
      console.log(
        "[@lit-protocol/vincent-tool-aave/execute] PKP Address:",
        pkpAddress
      );

      // Prepare transaction based on operation
      let txHash: string;

      switch (operation) {
        case AaveOperation.SUPPLY:
          txHash = await executeSupply(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        case AaveOperation.WITHDRAW:
          txHash = await executeWithdraw(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            pkpAddress,
            chainId
          );
          break;

        case AaveOperation.BORROW:
          if (!interestRateMode) {
            throw new Error(
              "Interest rate mode is required for borrow operations"
            );
          }
          txHash = await executeBorrow(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            interestRateMode,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        case AaveOperation.REPAY:
          txHash = await executeRepay(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            interestRateMode || INTEREST_RATE_MODE.VARIABLE,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      console.log(
        "[@lit-protocol/vincent-tool-aave/execute] AAVE operation successful",
        {
          txHash,
          operation,
          asset,
          amount,
        }
      );

      return succeed({
        txHash,
        operation,
        asset,
        amount,
        timestamp: Date.now(),
        interestRateMode: interestRateMode,
      });
    } catch (error) {
      console.error(
        "[@lit-protocol/vincent-tool-aave/execute] AAVE operation failed",
        error
      );

      return fail({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  },
});

/**
 * Execute AAVE Supply operation
 */
async function executeSupply(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  onBehalfOf: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-aave/executeSupply] Starting supply operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  // Now supply to AAVE
  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: AAVE_POOL_ABI,
    contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
    functionName: "supply",
    args: [asset, amount, onBehalfOf, 0],
    chainId,
  });

  return txHash;
}

/**
 * Execute AAVE Withdraw operation
 */
async function executeWithdraw(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  to: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-aave/executeWithdraw] Starting withdraw operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: AAVE_POOL_ABI,
    contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
    functionName: "withdraw",
    args: [asset, amount, to],
    chainId,
  });

  return txHash;
}

/**
 * Execute AAVE Borrow operation
 */
async function executeBorrow(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  interestRateMode: number,
  onBehalfOf: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-aave/executeBorrow] Starting borrow operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: AAVE_POOL_ABI,
    contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
    functionName: "borrow",
    args: [asset, amount, interestRateMode, 0, onBehalfOf],
    chainId,
  });

  return txHash;
}

/**
 * Execute AAVE Repay operation
 */
async function executeRepay(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  rateMode: number,
  onBehalfOf: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-aave/executeRepay] Starting repay operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  // Now repay the debt
  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: AAVE_POOL_ABI,
    contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
    functionName: "repay",
    args: [asset, amount, rateMode, onBehalfOf],
    chainId,
  });

  return txHash;
}
