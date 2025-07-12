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
  LitProtocolSigner,
  createEthersSignerFromLitProtocol,
  createAlchemySmartAccountClient,
  getAlchemyChainConfig,
} from "./helpers";

import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";
import { createModularAccountV2Client } from "@account-kit/smart-contracts";
import { alchemy } from "@account-kit/infra";

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

      const {
        operation,
        vaultAddress,
        amount,
        onBehalfOf,
        rpcUrl,
        chain,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      } = toolParams;

      // Validate operation
      if (!Object.values(MorphoOperation).includes(operation)) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/precheck] Invalid operation. Must be deposit, withdraw, or redeem",
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
        const vaultContract = new ethers.Contract(
          vaultAddress,
          ERC4626_VAULT_ABI,
          provider
        );
        vaultAssetAddress = await vaultContract.asset();
        vaultShares = (await vaultContract.balanceOf(pkpAddress)).toString();

        const assetContract = new ethers.Contract(
          vaultAssetAddress,
          ERC20_ABI,
          provider
        );
        userBalance = (await assetContract.balanceOf(pkpAddress)).toString();
        allowance = (
          await assetContract.allowance(pkpAddress, vaultAddress)
        ).toString();

        if (operation === MorphoOperation.REDEEM) {
          // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
          assetDecimals = await vaultContract.decimals();
        } else {
          assetDecimals = await assetContract.decimals();
        }
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-tool-morpho/precheck] Invalid vault address or vault not found on network: ${error}`,
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
        const vaultContract = new ethers.Contract(
          vaultAddress,
          ERC4626_VAULT_ABI,
          provider
        );
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
          case MorphoOperation.REDEEM:
            estimatedGas = (
              await vaultContract.estimateGas.redeem(
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
      console.error(
        "[@lit-protocol/vincent-tool-morpho/precheck] Error:",
        error
      );
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
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
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

      if (
        alchemyGasSponsor &&
        (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId)
      ) {
        return fail({
          error:
            "[@lit-protocol/vincent-tool-morpho/execute] Alchemy gas sponsor is enabled, but missing Alchemy API key or policy ID",
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
      const vaultContract = new ethers.Contract(
        vaultAddress,
        ERC4626_VAULT_ABI,
        provider
      );
      const vaultAssetAddress = await vaultContract.asset();
      const assetContract = new ethers.Contract(
        vaultAssetAddress,
        ERC20_ABI,
        provider
      );
      let assetDecimals: number;
      if (operation === MorphoOperation.REDEEM) {
        // we're redeeming shares, so need to use the decimals from the shares contract, not the assets contract
        assetDecimals = await vaultContract.decimals();
      } else {
        assetDecimals = await assetContract.decimals();
      }

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
          if (
            alchemyGasSponsor &&
            alchemyGasSponsorApiKey &&
            alchemyGasSponsorPolicyId
          ) {
            txHash = await executeDepositWithGasSponsorship(
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              onBehalfOf || pkpAddress,
              chainId,
              alchemyGasSponsorApiKey,
              alchemyGasSponsorPolicyId
            );
          } else {
            txHash = await executeDeposit(
              provider,
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              onBehalfOf || pkpAddress,
              chainId
            );
          }
          break;

        case MorphoOperation.WITHDRAW:
          if (
            alchemyGasSponsor &&
            alchemyGasSponsorApiKey &&
            alchemyGasSponsorPolicyId
          ) {
            txHash = await executeWithdrawWithGasSponsorship(
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              pkpAddress,
              chainId,
              alchemyGasSponsorApiKey,
              alchemyGasSponsorPolicyId
            );
          } else {
            txHash = await executeWithdraw(
              provider,
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              pkpAddress,
              chainId
            );
          }
          break;

        case MorphoOperation.REDEEM:
          if (
            alchemyGasSponsor &&
            alchemyGasSponsorApiKey &&
            alchemyGasSponsorPolicyId
          ) {
            txHash = await executeRedeemWithGasSponsorship(
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              pkpAddress,
              chainId,
              alchemyGasSponsorApiKey,
              alchemyGasSponsorPolicyId
            );
          } else {
            txHash = await executeRedeem(
              provider,
              pkpPublicKey,
              vaultAddress,
              convertedAmount,
              pkpAddress,
              chainId
            );
          }
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

  // Create LitProtocolSigner and wrap it for ethers.js
  const litSigner = new LitProtocolSigner({
    pkpPublicKey,
    chainId,
  });
  const signer = createEthersSignerFromLitProtocol(litSigner, provider);

  // Create contract instance with the signer
  const vaultContract = new ethers.Contract(
    vaultAddress,
    ERC4626_VAULT_ABI,
    signer
  );

  // Execute the deposit transaction
  const tx = await vaultContract.deposit(amount, receiver);

  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeDeposit] Transaction sent:",
    tx.hash
  );

  return tx.hash;
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

  // Create LitProtocolSigner and wrap it for ethers.js
  const litSigner = new LitProtocolSigner({
    pkpPublicKey,
    chainId,
  });
  const signer = createEthersSignerFromLitProtocol(litSigner, provider);

  // Create contract instance with the signer
  const vaultContract = new ethers.Contract(
    vaultAddress,
    ERC4626_VAULT_ABI,
    signer
  );

  // Execute the withdraw transaction
  const tx = await vaultContract.withdraw(amount, owner, owner);

  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeWithdraw] Transaction sent:",
    tx.hash
  );

  return tx.hash;
}

/**
 * Execute Morpho Vault Redeem operation
 */
async function executeRedeem(
  provider: any,
  pkpPublicKey: string,
  vaultAddress: string,
  shares: string,
  owner: string,
  chainId: number
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeRedeem] Starting redeem operation"
  );

  const callerAddress = ethers.utils.computeAddress(pkpPublicKey);

  // Create LitProtocolSigner and wrap it for ethers.js
  const litSigner = new LitProtocolSigner({
    pkpPublicKey,
    chainId,
  });
  const signer = createEthersSignerFromLitProtocol(litSigner, provider);

  // Create contract instance with the signer
  const vaultContract = new ethers.Contract(
    vaultAddress,
    ERC4626_VAULT_ABI,
    signer
  );

  // Execute the redeem transaction
  const tx = await vaultContract.redeem(shares, owner, owner);

  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeRedeem] Transaction sent:",
    tx.hash
  );

  return tx.hash;
}

/**
 * Execute Morpho Vault Deposit operation with gas sponsorship
 */
async function executeDepositWithGasSponsorship(
  pkpPublicKey: string,
  vaultAddress: string,
  amount: string,
  receiver: string,
  chainId: number,
  alchemyApiKey: string,
  policyId: string
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] Starting EIP-7702 sponsored deposit operation"
  );

  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] Using EIP-7702 gas sponsorship",
    { vaultAddress, amount, receiver, policyId }
  );

  try {
    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] Creating Smart Account Client",
      { chainId }
    );

    // Create the Smart Account Client with EIP-7702 mode
    const smartAccountClient = await createAlchemySmartAccountClient({
      alchemyApiKey,
      chainId,
      pkpPublicKey,
      policyId,
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] Smart Account Client created"
    );

    // Prepare the deposit user operation
    const userOperation = {
      target: vaultAddress as `0x${string}`,
      value: 0n,
      data: encodeFunctionData({
        abi: ERC4626_VAULT_ABI,
        functionName: "deposit",
        args: [amount, receiver],
      }),
    };

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] User operation prepared",
      userOperation
    );

    const uoStructResponse = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "buildUserOperation",
      },
      async () => {
        try {
          const uoStruct = await smartAccountClient.buildUserOperation({
            uo: userOperation,
            account: smartAccountClient.account,
          });
          // Properly serialize BigInt with a "type" tag
          return JSON.stringify(uoStruct, (_, v) =>
            typeof v === "bigint" ? { type: "BigInt", value: v.toString() } : v
          );
        } catch (e) {
          console.log("Failed to build user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoStructResponse === "") {
      throw new Error("Failed to build user operation");
    }

    // Custom reviver to convert {type: "BigInt", value: "..."} back to BigInt
    const uoStruct = JSON.parse(uoStructResponse, (_, v) => {
      if (
        v &&
        typeof v === "object" &&
        v.type === "BigInt" &&
        typeof v.value === "string"
      ) {
        return BigInt(v.value);
      }
      return v;
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] User operation struct prepared for signing",
      uoStruct
    );

    const signedUserOperation = await smartAccountClient.signUserOperation({
      account: smartAccountClient.account,
      uoStruct,
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] User operation signed",
      signedUserOperation
    );

    const entryPoint = smartAccountClient.account.getEntryPoint();

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] Prepared user operation for EIP-7702",
      { userOperation }
    );
    const uoHash = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "sendWithAlchemy",
      },
      async () => {
        try {
          // Send the user operation with EIP-7702 delegation
          const userOpResult = await smartAccountClient.sendRawUserOperation(
            signedUserOperation,
            entryPoint.address
          );

          console.log(
            "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] User operation sent",
            { userOpHash: userOpResult }
          );

          return userOpResult;
        } catch (e) {
          console.log("Failed to send user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoHash === "") {
      throw new Error("Failed to send user operation");
    }

    return uoHash;
  } catch (error) {
    console.error(
      "[@lit-protocol/vincent-tool-morpho/executeDepositWithGasSponsorship] EIP-7702 operation failed:",
      error
    );
    throw error;
  }
}

/**
 * Execute Morpho Vault Withdraw operation with gas sponsorship
 */
async function executeWithdrawWithGasSponsorship(
  pkpPublicKey: string,
  vaultAddress: string,
  amount: string,
  owner: string,
  chainId: number,
  alchemyApiKey: string,
  policyId: string
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] Using EIP-7702 gas sponsorship",
    { vaultAddress, amount, owner, policyId }
  );

  try {
    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] Creating Smart Account Client",
      { chainId }
    );

    const smartAccountClient = await createAlchemySmartAccountClient({
      pkpPublicKey,
      chainId,
      alchemyApiKey,
      policyId,
    });

    // Prepare the withdraw user operation
    const userOperation = {
      target: vaultAddress as `0x${string}`,
      value: 0n,
      data: encodeFunctionData({
        abi: ERC4626_VAULT_ABI,
        functionName: "withdraw",
        args: [amount, owner, owner],
      }),
    };

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] Prepared user operation for EIP-7702",
      { userOperation }
    );

    const uoStructResponse = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "buildUserOperation",
      },
      async () => {
        try {
          const uoStruct = await smartAccountClient.buildUserOperation({
            uo: userOperation,
            account: smartAccountClient.account,
          });
          // Properly serialize BigInt with a "type" tag
          return JSON.stringify(uoStruct, (_, v) =>
            typeof v === "bigint" ? { type: "BigInt", value: v.toString() } : v
          );
        } catch (e) {
          console.log("Failed to build user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoStructResponse === "") {
      throw new Error("Failed to build user operation");
    }

    // Custom reviver to convert {type: "BigInt", value: "..."} back to BigInt
    const uoStruct = JSON.parse(uoStructResponse, (_, v) => {
      if (
        v &&
        typeof v === "object" &&
        v.type === "BigInt" &&
        typeof v.value === "string"
      ) {
        return BigInt(v.value);
      }
      return v;
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] User operation struct prepared for signing",
      uoStruct
    );

    const signedUserOperation = await smartAccountClient.signUserOperation({
      account: smartAccountClient.account,
      uoStruct,
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] User operation signed",
      signedUserOperation
    );

    const entryPoint = smartAccountClient.account.getEntryPoint();

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] Prepared user operation for EIP-7702",
      { userOperation }
    );
    const uoHash = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "sendWithAlchemy",
      },
      async () => {
        try {
          // Send the user operation with EIP-7702 delegation
          const userOpResult = await smartAccountClient.sendRawUserOperation(
            signedUserOperation,
            entryPoint.address
          );

          console.log(
            "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] User operation sent",
            { userOpHash: userOpResult }
          );

          return userOpResult;
        } catch (e) {
          console.log("Failed to send user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoHash === "") {
      throw new Error("Failed to send user operation");
    }

    return uoHash;
  } catch (error) {
    console.error(
      "[@lit-protocol/vincent-tool-morpho/executeWithdrawWithGasSponsorship] EIP-7702 operation failed:",
      error
    );
    throw error;
  }
}

/**
 * Execute Morpho Vault Redeem operation with gas sponsorship
 */
async function executeRedeemWithGasSponsorship(
  pkpPublicKey: string,
  vaultAddress: string,
  shares: string,
  owner: string,
  chainId: number,
  alchemyApiKey: string,
  policyId: string
): Promise<string> {
  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] Starting EIP-7702 sponsored redeem operation"
  );

  console.log(
    "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] Using EIP-7702 gas sponsorship",
    { vaultAddress, shares, owner, policyId }
  );

  try {
    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] Creating Smart Account Client",
      { chainId }
    );

    // Create the Smart Account Client with EIP-7702 mode
    const smartAccountClient = await createAlchemySmartAccountClient({
      alchemyApiKey,
      chainId,
      pkpPublicKey,
      policyId,
    });

    // Prepare the redeem user operation
    const userOperation = {
      target: vaultAddress as `0x${string}`,
      value: 0n,
      data: encodeFunctionData({
        abi: ERC4626_VAULT_ABI,
        functionName: "redeem",
        args: [shares, owner, owner],
      }),
    };

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] Prepared user operation for EIP-7702",
      { userOperation }
    );

    const uoStructResponse = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "buildUserOperation",
      },
      async () => {
        try {
          const uoStruct = await smartAccountClient.buildUserOperation({
            uo: userOperation,
            account: smartAccountClient.account,
          });
          // Properly serialize BigInt with a "type" tag
          return JSON.stringify(uoStruct, (_, v) =>
            typeof v === "bigint" ? { type: "BigInt", value: v.toString() } : v
          );
        } catch (e) {
          console.log("Failed to build user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoStructResponse === "") {
      throw new Error("Failed to build user operation");
    }

    // Custom reviver to convert {type: "BigInt", value: "..."} back to BigInt
    const uoStruct = JSON.parse(uoStructResponse, (_, v) => {
      if (
        v &&
        typeof v === "object" &&
        v.type === "BigInt" &&
        typeof v.value === "string"
      ) {
        return BigInt(v.value);
      }
      return v;
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] User operation struct prepared for signing",
      uoStruct
    );

    const signedUserOperation = await smartAccountClient.signUserOperation({
      account: smartAccountClient.account,
      uoStruct,
    });

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] User operation signed",
      signedUserOperation
    );

    const entryPoint = smartAccountClient.account.getEntryPoint();

    console.log(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] Prepared user operation for EIP-7702",
      { userOperation }
    );
    const uoHash = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "sendWithAlchemy",
      },
      async () => {
        try {
          // Send the user operation with EIP-7702 delegation
          const userOpResult = await smartAccountClient.sendRawUserOperation(
            signedUserOperation,
            entryPoint.address
          );

          console.log(
            "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] User operation sent",
            { userOpHash: userOpResult }
          );

          return userOpResult;
        } catch (e) {
          console.log("Failed to send user operation, error below");
          console.log(e);
          console.log(e.stack);
          return "";
        }
      }
    );

    if (uoHash === "") {
      throw new Error("Failed to send user operation");
    }

    return uoHash;
  } catch (error) {
    console.error(
      "[@lit-protocol/vincent-tool-morpho/executeRedeemWithGasSponsorship] EIP-7702 operation failed:",
      error
    );
    throw error;
  }
}

/**
 * Helper function to encode function data using ethers.js Interface
 */
function encodeFunctionData({
  abi,
  functionName,
  args,
}: {
  abi: any[];
  functionName: string;
  args: any[];
}): `0x${string}` {
  const iface = new ethers.utils.Interface(abi);
  return iface.encodeFunctionData(functionName, args) as `0x${string}`;
}
