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
  MorphoOperation,
} from "./schemas";

import {
  MORPHO_SEPOLIA_ADDRESSES,
  MORPHO_ABI,
  ERC20_ABI,
  isValidAddress,
  parseAmount,
  validateOperationRequirements,
} from "./helpers";

import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";

export const vincentTool = createVincentTool({
  packageName: "@lit-protocol/vincent-tool-morpho" as const,
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async (
    { toolParams },
    { succeed, fail, delegation: { delegatorPkpInfo } }
  ) => {
    try {
      console.log("[@lit-protocol/vincent-tool-morpho/precheck]");
      console.log("[@lit-protocol/vincent-tool-morpho/precheck] params:", {
        toolParams,
      });

      const { operation, asset, amount, onBehalfOf, rpcUrl } = toolParams;

      // Validate operation
      if (!Object.values(MorphoOperation).includes(operation)) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid operation. Must be supply, withdraw, borrow, or repay",
        });
      }

      // Validate asset address
      if (!isValidAddress(asset)) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid asset address format",
        });
      }

      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid amount format or amount must be greater than 0",
        });
      }

      // Enhanced validation - connect to blockchain and validate everything the execute function would need
      console.log(
        "[@lit-protocol/vincent-tool-morpho/precheck] Starting enhanced validation..."
      );

      if (!rpcUrl) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] RPC URL is required for precheck",
        });
      }

      // Get provider
      let provider;
      try {
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-tool-morpho/precheck] Unable to obtain blockchain provider: ${
            error instanceof Error ? error.message : error.toString()
          }`,
        });
      }

      // Get PKP address
      const pkpAddress = delegatorPkpInfo.ethAddress;

      // Get asset decimals and validate asset exists
      let assetDecimals: number;
      let userBalance: string = "0";
      let allowance: string = "0";
      try {
        const assetContract = new ethers.Contract(asset, ERC20_ABI, provider);
        assetDecimals = await assetContract.decimals();
        userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
        allowance = (
          await assetContract.allowance(
            pkpAddress,
            MORPHO_SEPOLIA_ADDRESSES.MORPHO
          )
        ).toString();
      } catch (error) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid asset address or asset not found on network",
        });
      }

      // Convert amount using proper decimals
      const convertedAmount = parseAmount(amount, assetDecimals);

      // Get Morpho user position data
      let borrowCapacity: string = "0";
      try {
        const morphoContract = new ethers.Contract(
          MORPHO_SEPOLIA_ADDRESSES.MORPHO,
          MORPHO_ABI,
          provider
        );
        const positionData = await morphoContract.getUserPositionData(pkpAddress);
        borrowCapacity = positionData.availableBorrows.toString();
      } catch (error) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Failed to fetch Morpho position data",
        });
      }

      // Operation-specific validations
      const operationChecks = await validateOperationRequirements(
        operation,
        userBalance,
        allowance,
        borrowCapacity,
        convertedAmount
      );

      if (!operationChecks.valid) {
        return fail({
          error: `[@lit-protocol/vincent-tool-morpho/precheck] ${operationChecks.error}`,
        });
      }

      // Estimate gas for the operation
      let estimatedGas: number = 0;
      try {
        const morphoContract = new ethers.Contract(
          MORPHO_SEPOLIA_ADDRESSES.MORPHO,
          MORPHO_ABI,
          provider
        );
        const targetAddress = onBehalfOf || pkpAddress;
        const emptyData = "0x";

        switch (operation) {
          case MorphoOperation.SUPPLY:
            estimatedGas = (
              await morphoContract.estimateGas.supply(
                asset,
                convertedAmount,
                targetAddress,
                emptyData,
                { from: pkpAddress }
              )
            ).toNumber();
            break;
          case MorphoOperation.WITHDRAW:
            estimatedGas = (
              await morphoContract.estimateGas.withdraw(
                asset,
                convertedAmount,
                pkpAddress,
                emptyData,
                { from: pkpAddress }
              )
            ).toNumber();
            break;
          case MorphoOperation.BORROW:
            estimatedGas = (
              await morphoContract.estimateGas.borrow(
                asset,
                convertedAmount,
                targetAddress,
                emptyData,
                { from: pkpAddress }
              )
            ).toNumber();
            break;
          case MorphoOperation.REPAY:
            estimatedGas = (
              await morphoContract.estimateGas.repay(
                asset,
                convertedAmount,
                targetAddress,
                emptyData,
                { from: pkpAddress }
              )
            ).toNumber();
            break;
        }
      } catch (error) {
        console.warn(
          "[@lit-protocol/vincent-tool-morpho/precheck] Gas estimation failed:",
          error
        );
        return fail({
          error: `[@lit-protocol/vincent-tool-morpho/precheck] Gas estimation failed: ${
            error instanceof Error ? error.message : error.toString()
          }`,
        });
      }

      // Enhanced validation passed
      const successResult = {
        operationValid: true,
        assetValid: true,
        amountValid: true,
        userBalance,
        allowance,
        borrowCapacity,
        estimatedGas,
      };

      console.log(
        "[@lit-protocol/vincent-tool-morpho/precheck] Enhanced validation successful:",
        successResult
      );

      return succeed(successResult);
    } catch (error) {
      console.error("[@lit-protocol/vincent-tool-morpho/precheck] Error:", error);
      return fail({
        error: `[@lit-protocol/vincent-tool-morpho/precheck] Validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  },

  execute: async ({ toolParams }, { succeed, fail, delegation }) => {
    try {
      const { operation, asset, amount, onBehalfOf, chain, rpcUrl } = toolParams;

      console.log(
        "[@lit-protocol/vincent-tool-morpho/execute] Executing Morpho Tool",
        {
          operation,
          asset,
          amount,
        }
      );

      if (rpcUrl) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/execute] RPC URL is not permitted for execute. Use the `chain` parameter, and the Lit Nodes will provide the RPC URL for you with the Lit.Actions.getRpcUrl() function",
        });
      }

      // Get provider
      let provider;
      try {
        provider = new ethers.providers.JsonRpcProvider(
          await Lit.Actions.getRpcUrl({ chain })
        );
      } catch (error) {
        console.error(
          "[@lit-protocol/vincent-tool-morpho/execute] Provider error:",
          error
        );
        throw new Error(
          "Unable to obtain blockchain provider for Morpho operations"
        );
      }

      const { chainId } = await provider.getNetwork();

      // get decimals of asset
      const assetContract = new ethers.Contract(asset, ERC20_ABI, provider);
      const assetDecimals = await assetContract.decimals();
      console.log(
        "[@lit-protocol/vincent-tool-morpho/execute] Asset decimals:",
        assetDecimals
      );
      const convertedAmount = parseAmount(amount, assetDecimals);
      console.log(
        "[@lit-protocol/vincent-tool-morpho/execute] Converted amount:",
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
        "[@lit-protocol/vincent-tool-morpho/execute] PKP Address:",
        pkpAddress
      );

      // Prepare transaction based on operation
      let txHash: string;

      switch (operation) {
        case MorphoOperation.SUPPLY:
          txHash = await executeSupply(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        case MorphoOperation.WITHDRAW:
          txHash = await executeWithdraw(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            pkpAddress,
            chainId
          );
          break;

        case MorphoOperation.BORROW:
          txHash = await executeBorrow(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        case MorphoOperation.REPAY:
          txHash = await executeRepay(
            provider,
            pkpPublicKey,
            asset,
            convertedAmount,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      console.log(
        "[@lit-protocol/vincent-tool-morpho/execute] Morpho operation successful",
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
      });
    } catch (error) {
      console.error(
        "[@lit-protocol/vincent-tool-morpho/execute] Morpho operation failed",
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
 * Execute Morpho Supply operation
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
    "[@lit-protocol/vincent-tool-morpho/executeSupply] Starting supply operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);
  const emptyData = "0x";

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: MORPHO_ABI,
    contractAddress: MORPHO_SEPOLIA_ADDRESSES.MORPHO,
    functionName: "supply",
    args: [asset, amount, onBehalfOf, emptyData],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}

/**
 * Execute Morpho Withdraw operation
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
    "[@lit-protocol/vincent-tool-morpho/executeWithdraw] Starting withdraw operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);
  const emptyData = "0x";

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: MORPHO_ABI,
    contractAddress: MORPHO_SEPOLIA_ADDRESSES.MORPHO,
    functionName: "withdraw",
    args: [asset, amount, to, emptyData],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}

/**
 * Execute Morpho Borrow operation
 */
async function executeBorrow(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  onBehalfOf: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeBorrow] Starting borrow operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);
  const emptyData = "0x";

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: MORPHO_ABI,
    contractAddress: MORPHO_SEPOLIA_ADDRESSES.MORPHO,
    functionName: "borrow",
    args: [asset, amount, onBehalfOf, emptyData],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}

/**
 * Execute Morpho Repay operation
 */
async function executeRepay(
  provider: any,
  pkpPublicKey: string,
  asset: string,
  amount: string,
  onBehalfOf: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeRepay] Starting repay operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);
  const emptyData = "0x";

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: MORPHO_ABI,
    contractAddress: MORPHO_SEPOLIA_ADDRESSES.MORPHO,
    functionName: "repay",
    args: [asset, amount, onBehalfOf, emptyData],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}