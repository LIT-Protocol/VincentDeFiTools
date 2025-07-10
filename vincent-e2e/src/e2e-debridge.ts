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
import { bundledVincentTool as deBridgeTool } from "../../vincent-packages/tools/debridge/dist/index.js";
import { bundledVincentTool as erc20ApproveTool } from "@lit-protocol/vincent-tool-erc20-approval";
import { ethers } from "ethers";
import {
  setupEthFunding,
  addTestResult,
  printTestSummary,
} from "./test-utils.js";

// ========================================
// NETWORK CONFIGURATION - ETH to Base Bridge Test
// ========================================
const SOURCE_NETWORK_NAME = "ethereum";
const DESTINATION_NETWORK_NAME = "base";

const NETWORK_CONFIG = {
  source: {
    network: SOURCE_NETWORK_NAME,
    chainId: "1", // Ethereum mainnet
    rpcUrlEnv: "ETHEREUM_RPC_URL",
    nativeToken: "0x0000000000000000000000000000000000000000", // ETH
    // Common ERC20 tokens on Ethereum for testing
    usdcToken: "0xA0b86a33E6441e1e0A8B32F168f0CbBAeE30Cdde", // USDC on Ethereum
    wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
  },
  destination: {
    network: DESTINATION_NETWORK_NAME,
    chainId: "8453", // Base
    rpcUrlEnv: "BASE_RPC_URL",
    nativeToken: "0x0000000000000000000000000000000000000000", // ETH on Base
    // Corresponding tokens on Base
    usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    wethToken: "0x4200000000000000000000000000000000000006", // WETH on Base
  },
} as const;

const CONFIRMATIONS_TO_WAIT = 2;
const BRIDGE_AMOUNT = "0.00001"; // 0.00001 ETH to bridge from Ethereum to Base

(async () => {
  console.log("🌉 Starting deBridge Tool E2E Test - ETH to Base Bridge");
  console.log(
    `   Bridging ${BRIDGE_AMOUNT} ETH from ${SOURCE_NETWORK_NAME} to ${DESTINATION_NETWORK_NAME}`
  );

  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts, chainClient } = await init({
    network: "datil",
    deploymentStatus: "dev",
  });

  const sourceRpcUrl = process.env[NETWORK_CONFIG.source.rpcUrlEnv];
  if (!sourceRpcUrl) {
    throw new Error(
      `${NETWORK_CONFIG.source.rpcUrlEnv} is not set - can't test on ${NETWORK_CONFIG.source.network} without an RPC URL`
    );
  }

  const destinationRpcUrl = process.env[NETWORK_CONFIG.destination.rpcUrlEnv];
  if (!destinationRpcUrl) {
    throw new Error(
      `${NETWORK_CONFIG.destination.rpcUrlEnv} is not set - can't test on ${NETWORK_CONFIG.destination.network} without an RPC URL`
    );
  }

  if (!process.env.TEST_FUNDER_PRIVATE_KEY) {
    throw new Error(
      `TEST_FUNDER_PRIVATE_KEY is not set - can't test without a funder private key`
    );
  }

  const sourceProvider = new ethers.providers.JsonRpcProvider(sourceRpcUrl);
  const destinationProvider = new ethers.providers.JsonRpcProvider(
    destinationRpcUrl
  );

  /**
   * ====================================
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */

  const deBridgeToolClient = getVincentToolClient({
    bundledVincentTool: deBridgeTool,
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
      toolIpfsCids: [deBridgeTool.ipfsCid, erc20ApproveTool.ipfsCid],
      toolPolicies: [
        [
          // No policies for deBridge tool for now
        ],
        [
          // No policies for ERC20 Approval tool
        ],
      ],
      toolPolicyParameterNames: [
        [], // No policy parameter names for deBridgeTool
        [], // No policy parameter names for approveTool
      ],
      toolPolicyParameterTypes: [
        [], // No policy parameter types for deBridgeTool
        [], // No policy parameter types for approveTool
      ],
      toolPolicyParameterValues: [
        [], // No policy parameter values for deBridgeTool
        [], // No policy parameter values for approveTool
      ],
    },

    // Debugging options
    {
      cidToNameMap: {
        [deBridgeTool.ipfsCid]: "deBridge Tool",
        [erc20ApproveTool.ipfsCid]: "ERC20 Approval Tool",
        [sendLimitPolicyMetadata.ipfsCid]: "Send Limit Policy",
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
    deBridgeTool.ipfsCid,
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
  try {
    let validation = await chainClient.validateToolExecution({
      delegateeAddress: accounts.delegatee.ethersWallet.address,
      pkpTokenId: agentWalletPkp.tokenId,
      toolIpfsCid: deBridgeTool.ipfsCid,
    });

    console.log("✅ deBridge Tool execution validation:", validation);

    if (!validation.isPermitted) {
      throw new Error(
        `Delegatee is not permitted to execute deBridge tool for PKP for IPFS CID: ${
          deBridgeTool.ipfsCid
        }. Validation: ${JSON.stringify(validation, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )}`
      );
    }
    addTestResult("deBridge Tool Validation", true);
  } catch (error) {
    addTestResult("deBridge Tool Validation", false, error.message);
  }

  // ========================================
  // ETH Funding Setup for Source Chain (Ethereum)
  // ========================================
  const fundAmount = (parseFloat(BRIDGE_AMOUNT) + 0.002).toString(); // Bridge amount + extra for gas and fees
  await setupEthFunding(
    sourceProvider,
    agentWalletPkp.ethAddress,
    process.env.TEST_FUNDER_PRIVATE_KEY,
    addTestResult,
    CONFIRMATIONS_TO_WAIT,
    SOURCE_NETWORK_NAME,
    fundAmount
  );

  // ========================================
  // deBridge Tool Testing - Cross-Chain Bridge
  // ========================================
  console.log("🌉 Testing deBridge Tool - ETH to Base Bridge");
  console.log(
    `📋 Workflow: Bridge ${BRIDGE_AMOUNT} ETH from ${SOURCE_NETWORK_NAME} to ${DESTINATION_NETWORK_NAME}`
  );

  // Store initial balances for comparison
  let initialSourceBalance: ethers.BigNumber = ethers.BigNumber.from(0);
  let initialDestinationBalance: ethers.BigNumber = ethers.BigNumber.from(0);

  // Test: Initial Balance Check
  try {
    console.log("🔍 Recording initial balances on both chains...");

    // Get initial balances
    initialSourceBalance = await sourceProvider.getBalance(
      agentWalletPkp.ethAddress
    );
    initialDestinationBalance = await destinationProvider.getBalance(
      agentWalletPkp.ethAddress
    );

    const initialSourceFormatted =
      ethers.utils.formatEther(initialSourceBalance);
    const initialDestinationFormatted = ethers.utils.formatEther(
      initialDestinationBalance
    );

    console.log(
      `   Initial ${SOURCE_NETWORK_NAME} ETH balance: ${initialSourceFormatted} ETH`
    );
    console.log(
      `   Initial ${DESTINATION_NETWORK_NAME} ETH balance: ${initialDestinationFormatted} ETH`
    );

    // Verify PKP has sufficient ETH for the bridge + gas
    const requiredBalance = ethers.utils.parseEther(BRIDGE_AMOUNT);
    const gasBuffer = ethers.utils.parseEther("0.003"); // Extra for gas + debridge fee of 0.001
    const totalRequired = requiredBalance.add(gasBuffer);

    if (initialSourceBalance.lt(totalRequired)) {
      throw new Error(
        `Insufficient ETH balance on ${SOURCE_NETWORK_NAME}. Required: ${ethers.utils.formatEther(
          totalRequired
        )} ETH (including gas), Available: ${initialSourceFormatted} ETH`
      );
    }

    addTestResult("Initial Balance Check", true);
  } catch (error) {
    console.error("❌ Initial balance check failed:", error.message);
    addTestResult("Initial Balance Check", false, error.message);
    throw error; // Exit early if funding is insufficient
  }

  // ========================================
  // deBridge Cross-Chain Bridge Operation
  // ========================================
  console.log("🌉 Executing ETH to Base bridge via deBridge");

  try {
    const bridgeParams = {
      rpcUrl: sourceRpcUrl,
      sourceChain: NETWORK_CONFIG.source.chainId,
      destinationChain: NETWORK_CONFIG.destination.chainId,
      sourceToken: NETWORK_CONFIG.source.nativeToken,
      destinationToken: NETWORK_CONFIG.destination.nativeToken,
      amount: ethers.utils.parseEther(BRIDGE_AMOUNT).toString(),
      recipientAddress: agentWalletPkp.ethAddress, // Bridge to same address on destination
      operation: "BRIDGE" as const,
      slippageBps: 100, // 1% slippage tolerance
    };

    console.log("📋 Bridge Parameters:", {
      ...bridgeParams,
      amount: `${BRIDGE_AMOUNT} ETH (${bridgeParams.amount} wei)`,
    });

    // Step 1: Precheck
    console.log("🔍 Running deBridge precheck...");
    const bridgePrecheckRes = await deBridgeToolClient.precheck(bridgeParams, {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    });

    console.log(
      "(DEBRIDGE-PRECHECK): ",
      JSON.stringify(bridgePrecheckRes, null, 2)
    );

    if (bridgePrecheckRes.success && !("error" in bridgePrecheckRes.result)) {
      console.log("✅ deBridge precheck passed");

      // Log expected costs and destination amount
      const precheckData = bridgePrecheckRes.result.data;
      console.log(
        `   Estimated destination amount: ${ethers.utils.formatEther(
          precheckData.estimatedDestinationAmount
        )} ETH`
      );
      console.log(
        `   Protocol fee: ${ethers.utils.formatEther(
          precheckData.estimatedFees.protocolFee
        )} ETH`
      );
      console.log(
        `   Gas fee: ${ethers.utils.formatEther(
          precheckData.estimatedFees.gasFee
        )} ETH`
      );
      console.log(
        `   Total fees: ${ethers.utils.formatEther(
          precheckData.estimatedFees.totalFee
        )} ETH`
      );
      console.log(
        `   Estimated execution time: ${precheckData.estimatedExecutionTime} seconds`
      );

      // Step 2: Execute the bridge operation
      console.log("🚀 Executing bridge operation...");

      const bridgeExecuteRes = await deBridgeToolClient.execute(bridgeParams, {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      });

      console.log(
        "(DEBRIDGE-EXECUTE): ",
        JSON.stringify(bridgeExecuteRes, null, 2)
      );

      if (bridgeExecuteRes.success) {
        console.log("✅ Bridge transaction submitted successfully!");
        console.log(`   Tx hash: ${bridgeExecuteRes.result.data.txHash}`);

        if (bridgeExecuteRes.result.data.orderId) {
          console.log(`   Order ID: ${bridgeExecuteRes.result.data.orderId}`);
        }

        // Wait for source transaction confirmation
        try {
          console.log("⏳ Waiting for source transaction confirmation...");
          const receipt = await sourceProvider.waitForTransaction(
            bridgeExecuteRes.result.data.txHash,
            CONFIRMATIONS_TO_WAIT,
            300000 // 5 minute timeout
          );
          if (receipt.status === 0) {
            throw new Error(
              `Bridge transaction reverted: ${bridgeExecuteRes.result.data.txHash}`
            );
          }
          console.log(
            `   ✅ Source transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Source transaction confirmation failed",
            confirmError.message
          );
          throw confirmError;
        }

        // Verify source balance decreased
        try {
          console.log("🔍 Verifying source chain balance change...");

          const postBridgeSourceBalance = await sourceProvider.getBalance(
            agentWalletPkp.ethAddress
          );
          const postBridgeSourceFormatted = ethers.utils.formatEther(
            postBridgeSourceBalance
          );

          console.log(
            `   Post-bridge ${SOURCE_NETWORK_NAME} ETH balance: ${postBridgeSourceFormatted} ETH`
          );

          // Source balance should be reduced by at least the bridge amount
          const bridgeAmountBN = ethers.utils.parseEther(BRIDGE_AMOUNT);
          const expectedMaxSourceBalance =
            initialSourceBalance.sub(bridgeAmountBN);

          if (postBridgeSourceBalance.lte(expectedMaxSourceBalance)) {
            console.log("✅ Source balance correctly reduced");
            addTestResult("deBridge Source Transaction", true);
          } else {
            const errorMsg = `Source balance not reduced correctly. Expected <= ${ethers.utils.formatEther(
              expectedMaxSourceBalance
            )} ETH, Got: ${postBridgeSourceFormatted} ETH`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("deBridge Source Transaction", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify source balance:",
            balanceError.message
          );
          addTestResult(
            "deBridge Source Transaction",
            false,
            `Source balance verification failed: ${balanceError.message}`
          );
        }

        // Note about destination verification
        console.log(
          "📝 Note: deBridge is a cross-chain protocol that requires time for settlement."
        );
        console.log(
          "   The destination balance will update when the bridge order is fulfilled by solvers."
        );
        console.log(
          "   This typically takes 1-5 minutes depending on network conditions."
        );
        console.log(
          "   For production use, you would monitor the order status via deBridge API."
        );

        addTestResult("deBridge Bridge Execution", true);
      } else {
        const errorMsg = `Bridge execution failed: ${
          bridgeExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ Bridge execution failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(bridgeExecuteRes, null, 2)
        );
        addTestResult("deBridge Bridge Execution", false, errorMsg);
      }
    } else {
      const errorMsg = `Bridge precheck failed: ${
        "error" in bridgePrecheckRes
          ? bridgePrecheckRes.error
          : "Unknown precheck error"
      }`;
      console.log("❌ deBridge precheck failed:", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(bridgePrecheckRes, null, 2)
      );
      addTestResult("deBridge Bridge Execution", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `deBridge operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ deBridge bridge unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("deBridge Bridge Execution", false, errorMsg);
  }

  // ========================================
  // Print Test Summary and Exit
  // ========================================
  const allTestsPassed = printTestSummary();
  process.exit(allTestsPassed ? 0 : 1);
})();
