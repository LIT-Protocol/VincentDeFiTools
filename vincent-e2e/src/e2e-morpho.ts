import {
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(true);

import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
// Tools and Policies that we will be testing
import { vincentPolicyMetadata as sendLimitPolicyMetadata } from "../../vincent-packages/policies/send-counter-limit/dist/index.js";
import { bundledVincentTool as morphoTool } from "../../vincent-packages/tools/morpho/dist/index.js";
import { bundledVincentTool as erc20ApproveTool } from "@lit-protocol/vincent-tool-erc20-approval";
import { ethers } from "ethers";
import {
  getMorphoVaultAddresses,
  getTestTokens,
  CHAIN_IDS,
} from "../../vincent-packages/tools/morpho/dist/lib/helpers/index.js";
import {
  setupWethFunding,
  setupEthFunding,
  addTestResult,
  printTestSummary,
} from "./test-utils.js";

// ========================================
// NETWORK CONFIGURATION - CHANGE THIS TO TEST ON OTHER NETWORKS
// ========================================
const NETWORK_NAME = "base"; // Options: "sepolia", "base"

const NETWORK_CONFIG = {
  // Network to test on
  network: NETWORK_NAME,

  // Chain ID for the network
  chainId: CHAIN_IDS[NETWORK_NAME],

  // RPC URL environment variable
  rpcUrlEnv: `${NETWORK_NAME.toUpperCase()}_RPC_URL`,

  // Get addresses dynamically based on chain
  get morphoVaultAddresses() {
    return getMorphoVaultAddresses(NETWORK_NAME);
  },
  get testTokens() {
    return getTestTokens(NETWORK_NAME);
  },

  // Convenience getters for commonly used addresses
  get wethVaultAddress() {
    return this.morphoVaultAddresses.SEAMLESS_WETH_VAULT;
  },
  get wethAddress() {
    return this.testTokens.WETH;
  },
} as const;

const VAULT_ASSET_DECIMALS = 18; // WETH has 18 decimals
const CONFIRMATIONS_TO_WAIT = 2;

(async () => {
  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts, chainClient } = await init({
    network: "datil",
    deploymentStatus: "dev",
  });

  const rpcUrl = process.env[NETWORK_CONFIG.rpcUrlEnv];
  if (!rpcUrl) {
    throw new Error(
      `${NETWORK_CONFIG.rpcUrlEnv} is not set - can't test on ${NETWORK_CONFIG.network} without an RPC URL`
    );
  }

  if (!process.env.TEST_FUNDER_PRIVATE_KEY) {
    throw new Error(
      `TEST_FUNDER_PRIVATE_KEY is not set - can't test on ${NETWORK_CONFIG.network} without a funder private key`
    );
  }

  const networkProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

  /**
   * ====================================
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */

  const morphoToolClient = getVincentToolClient({
    bundledVincentTool: morphoTool,
    ethersSigner: accounts.delegatee.ethersWallet,
  });

  const approveToolClient = getVincentToolClient({
    bundledVincentTool: erc20ApproveTool,
    ethersSigner: accounts.delegatee.ethersWallet,
  });

  /**
   * ====================================
   * Prepare the IPFS CIDs for the tools and policies
   * NOTE: All arrays below are parallel - each index corresponds to the same tool.
   * ❗️If you change the policy parameter values, you will need to reset the state file.
   * You can do this by running: npm run vincent:reset
   * ====================================
   */
  const appConfig = createAppConfig(
    {
      toolIpfsCids: [morphoTool.ipfsCid, erc20ApproveTool.ipfsCid],
      toolPolicies: [
        [
          // No policies for Morpho tool for now
        ],
        [
          // No policies for ERC20 Approval tool
        ],
      ],
      toolPolicyParameterNames: [
        [], // No policy parameter names for morphoTool
        [], // No policy parameter names for approveTool
      ],
      toolPolicyParameterTypes: [
        [], // No policy parameter types for morphoTool
        [], // No policy parameter types for approveTool
      ],
      toolPolicyParameterValues: [
        [], // No policy parameter values for morphoTool
        [], // No policy parameter values for approveTool
      ],
    },

    // Debugging options
    {
      cidToNameMap: {
        [morphoTool.ipfsCid]: "Morpho Tool",
        [sendLimitPolicyMetadata.ipfsCid]: "Send Limit Policy",
        [erc20ApproveTool.ipfsCid]: "ERC20 Approval Tool",
      },
      debug: true,
    }
  );

  /**
   * Collect all IPFS CIDs for tools and policies that need to be:
   * 1. Authorised during agent wallet PKP minting
   * 2. Permitted as authentication methods for the PKP
   */
  const toolAndPolicyIpfsCids = [
    morphoTool.ipfsCid,
    erc20ApproveTool.ipfsCid,
    sendLimitPolicyMetadata.ipfsCid,
  ];

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) mint an Agent Wallet PKP
   * ====================================
   */
  const agentWalletPkp = await accounts.agentWalletPkpOwner.mintAgentWalletPkp({
    toolAndPolicyIpfsCids: toolAndPolicyIpfsCids,
  });
  console.log("toolAndPolicyIpfsCids", toolAndPolicyIpfsCids);
  console.log("appConfig.TOOL_IPFS_CIDS", appConfig.TOOL_IPFS_CIDS);

  console.log("🤖 Agent Wallet PKP:", agentWalletPkp);

  /**
   * ====================================
   * 🦹‍♀️ (App Manager Account) Register Vincent app with delegatee
   * ====================================
   */
  const { appId, appVersion } = await chainClient.registerApp({
    toolIpfsCids: appConfig.TOOL_IPFS_CIDS,
    toolPolicies: appConfig.TOOL_POLICIES,
    toolPolicyParameterNames: appConfig.TOOL_POLICY_PARAMETER_NAMES,
    toolPolicyParameterTypes: appConfig.TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ Vincent app registered:", { appId, appVersion });

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit PKP to use the app version
   * ====================================
   */
  await chainClient.permitAppVersion({
    pkpTokenId: agentWalletPkp.tokenId,
    appId,
    appVersion,
    toolIpfsCids: appConfig.TOOL_IPFS_CIDS,
    policyIpfsCids: appConfig.TOOL_POLICIES,
    policyParameterNames: appConfig.TOOL_POLICY_PARAMETER_NAMES,
    policyParameterValues: appConfig.TOOL_POLICY_PARAMETER_VALUES,
    policyParameterTypes: appConfig.TOOL_POLICY_PARAMETER_TYPES,
  });

  console.log("✅ PKP permitted to use app version");

  /**
   * ====================================
   * 👦🏻 (Agent Wallet PKP Owner) Permit auth methods for the agent wallet PKP
   * ====================================
   */
  const permittedAuthMethodsTxHashes =
    await accounts.agentWalletPkpOwner.permittedAuthMethods({
      agentWalletPkp: agentWalletPkp,
      toolAndPolicyIpfsCids: toolAndPolicyIpfsCids,
    });

  console.log(
    "✅ Permitted Auth Methods Tx hashes:",
    permittedAuthMethodsTxHashes
  );

  /**
   * ====================================
   * Validate delegatee permissions (debugging)
   * ====================================
   */
  // Test 1: Morpho Tool Validation
  try {
    let validation = await chainClient.validateToolExecution({
      delegateeAddress: accounts.delegatee.ethersWallet.address,
      pkpTokenId: agentWalletPkp.tokenId,
      toolIpfsCid: morphoTool.ipfsCid,
    });

    console.log("✅ Morpho Tool execution validation:", validation);

    if (!validation.isPermitted) {
      throw new Error(
        `Delegatee is not permitted to execute morpho tool for PKP for IPFS CID: ${
          morphoTool.ipfsCid
        }. Validation: ${JSON.stringify(validation, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )}`
      );
    }
    addTestResult("Morpho Tool Validation", true);
  } catch (error) {
    addTestResult("Morpho Tool Validation", false, error.message);
  }

  // ========================================
  // WETH and ETH Funding Setup
  // ========================================
  const WETH_DEPOSIT_AMOUNT = "0.001"; // 0.001 WETH to deposit

  const { wethContract, wethDecimals } = await setupWethFunding(
    networkProvider,
    agentWalletPkp.ethAddress,
    process.env.TEST_FUNDER_PRIVATE_KEY,
    addTestResult,
    CONFIRMATIONS_TO_WAIT,
    NETWORK_CONFIG.network,
    WETH_DEPOSIT_AMOUNT
  );

  await setupEthFunding(
    networkProvider,
    agentWalletPkp.ethAddress,
    process.env.TEST_FUNDER_PRIVATE_KEY,
    addTestResult,
    CONFIRMATIONS_TO_WAIT,
    NETWORK_CONFIG.network
  );

  // ========================================
  // Morpho Tool Testing - Complete Workflow
  // ========================================
  console.log("🧪 Testing Morpho Tool - Vault Workflow");
  console.log("📋 Workflow: Deposit WETH → Redeem vault shares for WETH + rewards");

  // Store initial balances for comparison throughout the workflow
  let initialWethBalance: ethers.BigNumber = ethers.BigNumber.from(0);

  // Test: Initial Balance Check
  try {
    console.log("🔍 Recording initial token balances...");

    // Get initial balances
    initialWethBalance = await wethContract.balanceOf(
      agentWalletPkp.ethAddress
    );
    const initialWethFormatted = ethers.utils.formatEther(initialWethBalance);

    console.log(`   Initial WETH balance: ${initialWethFormatted} WETH`);

    // Verify PKP has sufficient WETH for the test
    const requiredWethBalance = ethers.utils.parseEther(WETH_DEPOSIT_AMOUNT);
    if (initialWethBalance.lt(requiredWethBalance)) {
      throw new Error(
        `Insufficient WETH balance. Required: ${WETH_DEPOSIT_AMOUNT} WETH, Available: ${initialWethFormatted} WETH`
      );
    }

    addTestResult("Initial Balance Check", true);
  } catch (error) {
    console.error("❌ Initial balance check failed:", error.message);
    addTestResult("Initial Balance Check", false, error.message);
  }

  // ========================================
  // ERC20 Approval for WETH (required for Morpho Vault Deposit)
  // ========================================
  console.log("🛂 Approving WETH for Morpho vault via ERC20 Approval Tool");

  try {
    const approveWethParams = {
      chainId: NETWORK_CONFIG.chainId,
      tokenAddress: NETWORK_CONFIG.wethAddress,
      spenderAddress: NETWORK_CONFIG.wethVaultAddress,
      tokenAmount: parseFloat(WETH_DEPOSIT_AMOUNT),
      tokenDecimals: wethDecimals,
      rpcUrl: rpcUrl,
    };

    const approveWethPrecheck = await approveToolClient.precheck(
      approveWethParams,
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(APPROVE-PRECHECK-WETH): ",
      JSON.stringify(approveWethPrecheck, null, 2)
    );

    if (approveWethPrecheck.success) {
      const approveWethExecute = await approveToolClient.execute(
        approveWethParams,
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(APPROVE-EXECUTE-WETH): ",
        JSON.stringify(approveWethExecute, null, 2)
      );

      if (approveWethExecute.success) {
        console.log("✅ WETH approval executed successfully");
        if (approveWethExecute.result.approvalTxHash) {
          console.log(
            "🔍 Waiting for WETH approval transaction confirmation..."
          );
          // wait for transaction confirmation
          const receipt = await networkProvider.waitForTransaction(
            approveWethExecute.result.approvalTxHash,
            CONFIRMATIONS_TO_WAIT,
            180000
          );
          if (receipt.status === 0) {
            throw new Error(
              `WETH approval transaction reverted: ${approveWethExecute.result.approvalTxHash}`
            );
          }
          console.log(
            `   WETH approval confirmed in block ${receipt.blockNumber}`
          );
        }
        addTestResult("ERC20 Approve WETH", true);
      } else {
        console.log("❌ WETH approval execution failed:", approveWethExecute);
        addTestResult(
          "ERC20 Approve WETH",
          false,
          JSON.stringify(approveWethExecute, null, 2)
        );
      }
    } else {
      const errMsg = approveWethPrecheck.error || "Unknown precheck error";
      console.log("❌ WETH approval precheck failed:", errMsg);
      addTestResult("ERC20 Approve WETH", false, errMsg);
    }
  } catch (error) {
    console.log("❌ WETH approval unexpected error:", error.message || error);
    addTestResult(
      "ERC20 Approve WETH",
      false,
      error.message || error.toString()
    );
  }

  // ========================================
  // STEP 1: Deposit WETH to Morpho Vault
  // ========================================
  console.log("(MORPHO-STEP-1) Deposit WETH to vault");

  console.log(`   Depositing ${WETH_DEPOSIT_AMOUNT} WETH to vault`);
  console.log(`   Vault Address: ${NETWORK_CONFIG.wethVaultAddress}`);

  // Morpho Deposit Operation
  try {
    const morphoDepositPrecheckRes = await morphoToolClient.precheck(
      {
        operation: "deposit",
        vaultAddress: NETWORK_CONFIG.wethVaultAddress,
        amount: WETH_DEPOSIT_AMOUNT,
        rpcUrl: rpcUrl,
        chain: NETWORK_CONFIG.network,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(MORPHO-PRECHECK-DEPOSIT): ",
      JSON.stringify(morphoDepositPrecheckRes, null, 2)
    );

    if (
      morphoDepositPrecheckRes.success &&
      !("error" in morphoDepositPrecheckRes.result)
    ) {
      console.log("✅ (MORPHO-PRECHECK-DEPOSIT) WETH deposit precheck passed");

      // Execute the deposit operation
      console.log("🚀 (MORPHO-DEPOSIT) Executing WETH deposit operation...");

      const morphoDepositExecuteRes = await morphoToolClient.execute(
        {
          operation: "deposit",
          vaultAddress: NETWORK_CONFIG.wethVaultAddress,
          amount: WETH_DEPOSIT_AMOUNT,
          chain: NETWORK_CONFIG.network,
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(MORPHO-EXECUTE-DEPOSIT): ",
        JSON.stringify(morphoDepositExecuteRes, null, 2)
      );

      if (morphoDepositExecuteRes.success) {
        console.log("✅ (MORPHO-STEP-1) WETH deposit completed successfully!");
        console.log(`   Tx hash: ${morphoDepositExecuteRes.result.txHash}`);

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for deposit transaction confirmation...");
          const receipt = await networkProvider.waitForTransaction(
            morphoDepositExecuteRes.result.txHash,
            CONFIRMATIONS_TO_WAIT,
            180000
          );
          if (receipt.status === 0) {
            throw new Error(
              `Morpho deposit transaction reverted: ${morphoDepositExecuteRes.result.txHash}`
            );
          }
          console.log(
            `   ✅ Deposit transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed",
            confirmError.message
          );
          throw confirmError;
        }

        // Verify balance after deposit
        try {
          console.log("🔍 Verifying WETH balance after deposit...");

          const postDepositBalance = await wethContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const postDepositBalanceFormatted =
            ethers.utils.formatEther(postDepositBalance);
          console.log(
            `   Post-deposit WETH balance: ${postDepositBalanceFormatted} WETH`
          );

          // Expected: balance should be reduced by the deposited amount
          const depositedAmount = ethers.utils.parseEther(WETH_DEPOSIT_AMOUNT);
          const expectedBalance = initialWethBalance.sub(depositedAmount);
          const expectedBalanceFormatted =
            ethers.utils.formatEther(expectedBalance);

          console.log(
            `   Expected WETH balance: ${expectedBalanceFormatted} WETH`
          );

          if (postDepositBalance.eq(expectedBalance)) {
            console.log("✅ WETH balance correctly reduced after deposit");
            addTestResult("Morpho Deposit WETH", true);
          } else {
            const errorMsg = `Balance mismatch after deposit. Expected: ${expectedBalanceFormatted} WETH, Got: ${postDepositBalanceFormatted} WETH`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("Morpho Deposit WETH", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after deposit:",
            balanceError.message
          );
          addTestResult(
            "Morpho Deposit WETH",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Deposit execution failed: ${
          morphoDepositExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (MORPHO-STEP-1) WETH deposit failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(morphoDepositExecuteRes, null, 2)
        );
        addTestResult("Morpho Deposit WETH", false, errorMsg);
      }
    } else {
      const errorMsg = `Deposit precheck failed: ${
        "error" in morphoDepositPrecheckRes ? morphoDepositPrecheckRes.error : "Unknown precheck error"
      }`;
      console.log("❌ (MORPHO-PRECHECK-DEPOSIT)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(morphoDepositPrecheckRes, null, 2)
      );
      addTestResult("Morpho Deposit WETH", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `Morpho Deposit operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (MORPHO-DEPOSIT) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("Morpho Deposit WETH", false, errorMsg);
  }

  // ========================================
  // STEP 2: Redeem vault shares for WETH + rewards
  // ========================================
  console.log("(MORPHO-STEP-2) Redeem vault shares for WETH + rewards");

  // Get vault contract to check user shares
  const vaultContract = new ethers.Contract(
    NETWORK_CONFIG.wethVaultAddress,
    [
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    networkProvider
  );

  // Get the user's vault shares
  const userVaultShares = await vaultContract.balanceOf(agentWalletPkp.ethAddress);
  const userVaultSharesFormatted = ethers.utils.formatEther(userVaultShares);
  
  console.log(`   User vault shares: ${userVaultSharesFormatted} shares`);
  console.log(`   Redeeming all vault shares for WETH + rewards`);

  // Morpho Redeem Operation
  try {
    const morphoRedeemPrecheckRes = await morphoToolClient.precheck(
      {
        operation: "redeem",
        vaultAddress: NETWORK_CONFIG.wethVaultAddress,
        amount: userVaultSharesFormatted, // Pass shares amount for redeem
        rpcUrl: rpcUrl,
        chain: NETWORK_CONFIG.network,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(MORPHO-PRECHECK-REDEEM): ",
      JSON.stringify(morphoRedeemPrecheckRes, null, 2)
    );

    if (
      morphoRedeemPrecheckRes.success &&
      !("error" in morphoRedeemPrecheckRes.result)
    ) {
      console.log(
        "✅ (MORPHO-PRECHECK-REDEEM) Share redeem precheck passed"
      );

      // Execute the redeem operation
      console.log("🚀 (MORPHO-REDEEM) Executing share redeem operation...");

      const morphoRedeemExecuteRes = await morphoToolClient.execute(
        {
          operation: "redeem",
          vaultAddress: NETWORK_CONFIG.wethVaultAddress,
          amount: userVaultSharesFormatted,
          chain: NETWORK_CONFIG.network,
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(MORPHO-EXECUTE-REDEEM): ",
        JSON.stringify(morphoRedeemExecuteRes, null, 2)
      );

      if (morphoRedeemExecuteRes.success) {
        console.log("✅ (MORPHO-STEP-2) Share redeem completed successfully!");
        console.log(
          `   Transaction Hash: ${morphoRedeemExecuteRes.result.txHash}`
        );

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for redeem transaction confirmation...");

          const receipt = await networkProvider.waitForTransaction(
            morphoRedeemExecuteRes.result.txHash,
            CONFIRMATIONS_TO_WAIT,
            180000
          );
          if (receipt.status === 0) {
            throw new Error(
              `Morpho redeem transaction reverted: ${morphoRedeemExecuteRes.result.txHash}`
            );
          }
          console.log(
            `   ✅ Redeem transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed",
            confirmError.message
          );
          throw confirmError;
        }

        // Verify WETH balance after redeem
        try {
          console.log("🔍 Verifying WETH balance after redeem...");

          const postRedeemBalance = await wethContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const postRedeemBalanceFormatted =
            ethers.utils.formatEther(postRedeemBalance);
          console.log(
            `   Post-redeem WETH balance: ${postRedeemBalanceFormatted} WETH`
          );

          // Expected: balance should be at least initial amount (may be more due to rewards)
          console.log(`   Initial WETH balance: ${ethers.utils.formatEther(initialWethBalance)} WETH`);
          
          if (postRedeemBalance.gte(initialWethBalance)) {
            const rewardsEarned = postRedeemBalance.sub(initialWethBalance);
            const rewardsFormatted = ethers.utils.formatEther(rewardsEarned);
            console.log(
              `✅ WETH balance returned to at least initial amount. Rewards earned: ${rewardsFormatted} WETH`
            );
            addTestResult("Morpho Redeem WETH", true);
          } else {
            const errorMsg = `Balance less than initial after redeem. Expected: >= ${ethers.utils.formatEther(initialWethBalance)} WETH, Got: ${postRedeemBalanceFormatted} WETH`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("Morpho Redeem WETH", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after redeem:",
            balanceError.message
          );
          addTestResult(
            "Morpho Redeem WETH",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Redeem execution failed: ${
          morphoRedeemExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (MORPHO-STEP-2) Share redeem failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(morphoRedeemExecuteRes, null, 2)
        );
        addTestResult("Morpho Redeem WETH", false, errorMsg);
      }
    } else {
      const errorMsg = `Redeem precheck failed: ${
        "error" in morphoRedeemPrecheckRes ? morphoRedeemPrecheckRes.error : "Unknown precheck error"
      }`;
      console.log("❌ (MORPHO-PRECHECK-REDEEM)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(morphoRedeemPrecheckRes, null, 2)
      );
      addTestResult("Morpho Redeem WETH", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `Morpho Redeem operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (MORPHO-REDEEM) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("Morpho Redeem WETH", false, errorMsg);
  }

  // ========================================
  // Print Test Summary and Exit
  // ========================================
  const allTestsPassed = printTestSummary();
  process.exit(allTestsPassed ? 0 : 1);
})();
