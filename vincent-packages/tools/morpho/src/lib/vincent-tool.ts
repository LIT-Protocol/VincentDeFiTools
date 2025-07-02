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
  ERC4626_VAULT_ABI,
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

      const { operation, vaultAddress, amount, onBehalfOf, rpcUrl, chain } =
        toolParams;

      // Validate operation
      if (!Object.values(MorphoOperation).includes(operation)) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid operation. Must be deposit or withdraw",
        });
      }

      // Validate vault address
      if (!isValidAddress(vaultAddress)) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid vault address format",
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

      // Get vault info and validate vault exists
      let vaultAssetAddress: string;
      let assetDecimals: number;
      let userBalance: string = "0";
      let allowance: string = "0";
      let vaultShares: string = "0";
      
      try {
        const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
        vaultAssetAddress = await vaultContract.asset();
        vaultShares = (await vaultContract.balanceOf(pkpAddress)).toString();
        
        const assetContract = new ethers.Contract(vaultAssetAddress, ERC20_ABI, provider);
        assetDecimals = await assetContract.decimals();
        userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
        allowance = (
          await assetContract.allowance(pkpAddress, vaultAddress)
        ).toString();
      } catch (error) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid vault address or vault not found on network",
        });
      }

      // Convert amount using proper decimals
      const convertedAmount = parseAmount(amount, assetDecimals);

      // Operation-specific validations
      const operationChecks = await validateOperationRequirements(
        operation,
        userBalance,
        allowance,
        vaultShares,
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
        const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
        const targetAddress = onBehalfOf || pkpAddress;

        switch (operation) {
          case MorphoOperation.DEPOSIT:
            estimatedGas = (
              await vaultContract.estimateGas.deposit(
                convertedAmount,
                targetAddress,
                { from: pkpAddress }
              )
            ).toNumber();
            break;
          case MorphoOperation.WITHDRAW:
            estimatedGas = (
              await vaultContract.estimateGas.withdraw(
                convertedAmount,
                pkpAddress,
                pkpAddress,
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
        vaultValid: true,
        amountValid: true,
        userBalance,
        allowance,
        vaultShares,
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
      const {
        operation,
        vaultAddress,
        amount,
        onBehalfOf,
        chain,
        rpcUrl,
      } = toolParams;

      console.log(
        "[@lit-protocol/vincent-tool-morpho/execute] Executing Morpho Tool",
        {
          operation,
          vaultAddress,
          amount,
          chain,
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

      // Get vault asset address and decimals
      const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
      const vaultAssetAddress = await vaultContract.asset();
      const assetContract = new ethers.Contract(vaultAssetAddress, ERC20_ABI, provider);
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
        case MorphoOperation.DEPOSIT:
          txHash = await executeDeposit(
            provider,
            pkpPublicKey,
            vaultAddress,
            convertedAmount,
            onBehalfOf || pkpAddress,
            chainId
          );
          break;

        case MorphoOperation.WITHDRAW:
          txHash = await executeWithdraw(
            provider,
            pkpPublicKey,
            vaultAddress,
            convertedAmount,
            pkpAddress,
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
          vaultAddress,
          amount,
        }
      );

      return succeed({
        txHash,
        operation,
        vaultAddress,
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
 * Execute Morpho Vault Deposit operation
 */
async function executeDeposit(
  provider: any,
  pkpPublicKey: string,
  vaultAddress: string,
  amount: string,
  receiver: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeDeposit] Starting deposit operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: ERC4626_VAULT_ABI,
    contractAddress: vaultAddress,
    functionName: "deposit",
    args: [amount, receiver],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}

/**
 * Execute Morpho Vault Withdraw operation
 */
async function executeWithdraw(
  provider: any,
  pkpPublicKey: string,
  vaultAddress: string,
  amount: string,
  owner: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeWithdraw] Starting withdraw operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  const txHash = await laUtils.transaction.handler.contractCall({
    provider,
    pkpPublicKey,
    callerAddress,
    abi: ERC4626_VAULT_ABI,
    contractAddress: vaultAddress,
    functionName: "withdraw",
    args: [amount, owner, owner],
    chainId,
    gasBumpPercentage: 10,
  });

  return txHash;
}
