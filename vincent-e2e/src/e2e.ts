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
// Tools and Policies that we wil be testing
import { vincentPolicyMetadata as sendLimitPolicyMetadata } from "../../vincent-packages/policies/send-counter-limit/dist/index.js";
import { bundledVincentTool as aaveTool } from "../../vincent-packages/tools/aave/dist/index.js";
import { bundledVincentTool as erc20ApproveTool } from "@lit-protocol/vincent-tool-erc20-approval";
import { ethers } from "ethers";
import { AAVE_V3_SEPOLIA_ADDRESSES } from "../../vincent-packages/tools/aave/dist/lib/helpers/index.js";

// Test tracking system
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestResult[] = [];

function addTestResult(name: string, passed: boolean, error?: string) {
  testResults.push({ name, passed, error });
  const status = passed ? "✅" : "❌";
  console.log(`${status} TEST: ${name}${error ? ` - ${error}` : ""}`);

  // Stop execution immediately if a test fails
  if (!passed) {
    console.log("\n🛑 Test failed - stopping execution");
    printTestSummary();
    process.exit(1);
  }
}

function printTestSummary() {
  const passed = testResults.filter((t) => t.passed).length;
  const failed = testResults.filter((t) => !t.passed).length;
  const total = testResults.length;

  console.log("\n" + "=".repeat(60));
  console.log("🧪 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    testResults
      .filter((t) => !t.passed)
      .forEach((test) => {
        console.log(`  - ${test.name}: ${test.error || "Unknown error"}`);
      });
  }

  return failed === 0;
}

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

  if (!process.env.ETH_SEPOLIA_RPC_URL) {
    throw new Error(
      "ETH_SEPOLIA_RPC_URL is not set - can't test on Sepolia without an RPC URL"
    );
  }

  const sepoliaProvider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_SEPOLIA_RPC_URL
  );

  /**
   * ====================================
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */

  const aaveToolClient = getVincentToolClient({
    bundledVincentTool: aaveTool,
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
      toolIpfsCids: [
        // helloWorldTool.ipfsCid,
        aaveTool.ipfsCid,
        erc20ApproveTool.ipfsCid,
        // ...add more tool IPFS CIDs here
      ],
      toolPolicies: [
        // [
        //   // fooLimitPolicyMetadata.ipfsCid
        // ],
        [
          // No policies for AAVE tool for now
        ],
        [
          // No policies for ERC20 Approval tool
        ],
      ],
      toolPolicyParameterNames: [
        // [], // No policy parameter names for helloWorldTool
        [], // No policy parameter names for aaveTool
        [], // No policy parameter names for approveTool
      ],
      toolPolicyParameterTypes: [
        // [], // No policy parameter types for helloWorldTool
        [], // No policy parameter types for aaveTool
        [], // No policy parameter types for approveTool
      ],
      toolPolicyParameterValues: [
        // [], // No policy parameter values for helloWorldTool
        [], // No policy parameter values for aaveTool
        [], // No policy parameter values for approveTool
      ],
    },

    // Debugging options
    {
      cidToNameMap: {
        // [helloWorldTool.ipfsCid]: "Hello World Tool",
        [aaveTool.ipfsCid]: "AAVE Tool",
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
    // helloWorldTool.ipfsCid,
    aaveTool.ipfsCid,
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
  // Test 1: AAVE Tool Validation
  try {
    let validation = await chainClient.validateToolExecution({
      delegateeAddress: accounts.delegatee.ethersWallet.address,
      pkpTokenId: agentWalletPkp.tokenId,
      toolIpfsCid: aaveTool.ipfsCid,
    });

    console.log("✅ AAVE Tool execution validation:", validation);

    if (!validation.isPermitted) {
      throw new Error(
        `Delegatee is not permitted to execute aave tool for PKP for IPFS CID: ${
          aaveTool.ipfsCid
        }. Validation: ${JSON.stringify(validation, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )}`
      );
    }
    addTestResult("AAVE Tool Validation", true);
  } catch (error) {
    addTestResult("AAVE Tool Validation", false, error.message);
  }

  // ========================================
  // WETH Funding Setup for AAVE Testing
  // ========================================
  console.log("💰 Setting up WETH funding for AAVE tests");

  // Fund PKP with WETH from TEST_FUNDER_PRIVATE_KEY wallet
  const TEST_WETH_ADDRESS = "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c"; // WETH on Sepolia
  const WETH_FUND_AMOUNT = "0.01"; // 0.01 WETH
  const REQUIRED_WETH_BALANCE = ethers.utils.parseEther(WETH_FUND_AMOUNT);

  // Test 2: WETH Balance Check and Conditional Funding
  try {
    console.log("🔍 Checking PKP WETH balance");
    console.log(`   PKP Address: ${agentWalletPkp.ethAddress}`);
    console.log(`   WETH Contract: ${TEST_WETH_ADDRESS}`);

    // Create funder wallet using private key
    const funderWallet = new ethers.Wallet(
      process.env.TEST_FUNDER_PRIVATE_KEY ||
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      sepoliaProvider
    );

    // WETH contract ABI for transfer and balance functions
    const wethAbi = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
    ];
    const wethContract = new ethers.Contract(
      TEST_WETH_ADDRESS,
      wethAbi,
      funderWallet
    );

    // Check current PKP WETH balance
    const currentBalance = await wethContract.balanceOf(
      agentWalletPkp.ethAddress
    );
    const currentBalanceFormatted = ethers.utils.formatEther(currentBalance);
    console.log(`   Current PKP WETH balance: ${currentBalanceFormatted} WETH`);
    console.log(`   Required WETH balance: ${WETH_FUND_AMOUNT} WETH`);

    if (currentBalance.gte(REQUIRED_WETH_BALANCE)) {
      console.log(
        "✅ PKP already has sufficient WETH balance, skipping funding"
      );
      addTestResult("WETH Balance Check", true);
    } else {
      console.log("🏦 PKP needs WETH funding, proceeding with transfer");
      console.log(`   Funder Address: ${funderWallet.address}`);
      console.log(
        `   Transferring ${WETH_FUND_AMOUNT} WETH (${REQUIRED_WETH_BALANCE.toString()} wei)`
      );

      // Execute WETH transfer
      const transferTx = await wethContract.transfer(
        agentWalletPkp.ethAddress,
        REQUIRED_WETH_BALANCE
      );
      console.log(`   Transfer transaction hash: ${transferTx.hash}`);

      // Wait for transaction confirmation
      const receipt = await transferTx.wait();
      console.log(
        `   ✅ WETH transfer confirmed in block ${receipt.blockNumber}`
      );

      // Verify new balance
      const newBalance = await wethContract.balanceOf(
        agentWalletPkp.ethAddress
      );
      console.log(
        `   New PKP WETH balance: ${ethers.utils.formatEther(newBalance)} WETH`
      );

      addTestResult("WETH Funding Setup", true);
    }
  } catch (error) {
    console.error("❌ WETH funding setup failed:", error?.message || error);
    addTestResult(
      "WETH Funding Setup",
      false,
      error?.message || error.toString()
    );
  }

  // ========================================
  // ETH Gas Funding Setup for Sepolia
  // ========================================
  console.log("⛽ Setting up ETH gas funding for Sepolia operations");

  const ETH_FUND_AMOUNT = "0.01"; // 0.01 ETH
  const REQUIRED_ETH_BALANCE = ethers.utils.parseEther("0.002"); // 0.002 ETH threshold

  // Test 3: ETH Balance Check and Conditional Funding
  try {
    console.log("🔍 Checking PKP ETH balance for gas fees");
    console.log(`   PKP Address: ${agentWalletPkp.ethAddress}`);

    // Create funder wallet using private key
    const funderWallet = new ethers.Wallet(
      process.env.TEST_FUNDER_PRIVATE_KEY ||
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      sepoliaProvider
    );

    // Check current PKP ETH balance
    const currentEthBalance = await sepoliaProvider.getBalance(
      agentWalletPkp.ethAddress
    );
    const currentEthBalanceFormatted =
      ethers.utils.formatEther(currentEthBalance);
    console.log(
      `   Current PKP ETH balance: ${currentEthBalanceFormatted} ETH`
    );
    console.log(
      `   Required ETH balance threshold: ${ethers.utils.formatEther(
        REQUIRED_ETH_BALANCE
      )} ETH`
    );

    if (currentEthBalance.gte(REQUIRED_ETH_BALANCE)) {
      console.log(
        "✅ PKP already has sufficient ETH balance for gas, skipping funding"
      );
      addTestResult("ETH Balance Check", true);
    } else {
      console.log("⛽ PKP needs ETH funding for gas, proceeding with transfer");
      console.log(`   Funder Address: ${funderWallet.address}`);
      console.log(`   Transferring ${ETH_FUND_AMOUNT} ETH`);

      // Execute ETH transfer
      const transferTx = await funderWallet.sendTransaction({
        to: agentWalletPkp.ethAddress,
        value: ethers.utils.parseEther(ETH_FUND_AMOUNT),
        gasLimit: 21000,
      });
      console.log(`   Transfer transaction hash: ${transferTx.hash}`);

      // Wait for transaction confirmation
      const receipt = await transferTx.wait();
      console.log(
        `   ✅ ETH transfer confirmed in block ${receipt.blockNumber}`
      );

      // Verify new balance
      const newEthBalance = await sepoliaProvider.getBalance(
        agentWalletPkp.ethAddress
      );
      console.log(
        `   New PKP ETH balance: ${ethers.utils.formatEther(newEthBalance)} ETH`
      );

      addTestResult("ETH Funding Setup", true);
    }
  } catch (error) {
    console.error("❌ ETH funding setup failed:", error?.message || error);
    addTestResult(
      "ETH Funding Setup",
      false,
      error?.message || error.toString()
    );
  }

  // ========================================
  // AAVE Tool Testing - Complete Workflow
  // ========================================
  console.log("🧪 Testing AAVE Tool - Complete DeFi Workflow");
  console.log(
    "📋 Workflow: Supply WETH → Borrow USDC → Repay USDC → Withdraw WETH"
  );

  // Define constants for AAVE workflow
  const TEST_USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // USDC on Sepolia
  const WETH_SUPPLY_AMOUNT = "0.01"; // 0.01 WETH as collateral
  const USDC_BORROW_AMOUNT = "1.0"; // 1 USDC

  // Store initial balances for comparison throughout the workflow
  let initialWethBalance: ethers.BigNumber = ethers.BigNumber.from(0);
  let initialUsdcBalance: ethers.BigNumber = ethers.BigNumber.from(0);

  // Test: Initial Balance Check
  try {
    console.log("🔍 Recording initial token balances...");

    // WETH contract for balance checking
    const wethAbi = [
      "function balanceOf(address account) view returns (uint256)",
    ];
    const wethContract = new ethers.Contract(
      TEST_WETH_ADDRESS,
      wethAbi,
      sepoliaProvider
    );

    // USDC contract for balance checking
    const usdcAbi = [
      "function balanceOf(address account) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];
    const usdcContract = new ethers.Contract(
      TEST_USDC_ADDRESS,
      usdcAbi,
      sepoliaProvider
    );

    // Get initial balances
    initialWethBalance = await wethContract.balanceOf(
      agentWalletPkp.ethAddress
    );
    initialUsdcBalance = await usdcContract.balanceOf(
      agentWalletPkp.ethAddress
    );
    const usdcDecimals = await usdcContract.decimals();

    const initialWethFormatted = ethers.utils.formatEther(initialWethBalance);
    const initialUsdcFormatted = ethers.utils.formatUnits(
      initialUsdcBalance,
      usdcDecimals
    );

    console.log(`   Initial WETH balance: ${initialWethFormatted} WETH`);
    console.log(`   Initial USDC balance: ${initialUsdcFormatted} USDC`);

    // Verify PKP has sufficient WETH for the test
    const requiredWethBalance = ethers.utils.parseEther(WETH_SUPPLY_AMOUNT);
    if (initialWethBalance.lt(requiredWethBalance)) {
      throw new Error(
        `Insufficient WETH balance. Required: ${WETH_SUPPLY_AMOUNT} WETH, Available: ${initialWethFormatted} WETH`
      );
    }

    addTestResult("Initial Balance Check", true);
  } catch (error) {
    console.error("❌ Initial balance check failed:", error.message);
    addTestResult("Initial Balance Check", false, error.message);
  }

  // ========================================
  // ERC20 Approval for WETH (required for AAVE Supply)
  // ========================================
  console.log("🛂 Approving WETH for AAVE supply via ERC20 Approval Tool");

  try {
    const approveWethParams = {
      chainId: 11155111, // Sepolia
      tokenAddress: TEST_WETH_ADDRESS,
      spenderAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
      tokenAmount: parseFloat(WETH_SUPPLY_AMOUNT),
      tokenDecimals: 18,
      rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
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
          const receipt = await sepoliaProvider.waitForTransaction(
            approveWethExecute.result.approvalTxHash,
            1,
            180000
          );
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
  // STEP 1: Supply WETH as Collateral
  // ========================================
  console.log("(AAVE-STEP-1) Supply WETH as collateral");

  console.log(`   Supplying ${WETH_SUPPLY_AMOUNT} WETH as collateral`);
  console.log(`   WETH Address: ${TEST_WETH_ADDRESS}`);

  // Test 4: AAVE Supply Operation
  try {
    const aaveSupplyPrecheckRes = await aaveToolClient.precheck(
      {
        operation: "supply",
        asset: TEST_WETH_ADDRESS,
        amount: WETH_SUPPLY_AMOUNT,
        rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(AAVE-PRECHECK-SUPPLY): ",
      JSON.stringify(aaveSupplyPrecheckRes, null, 2)
    );

    if (aaveSupplyPrecheckRes.success) {
      console.log("✅ (AAVE-PRECHECK-SUPPLY) WETH supply precheck passed");

      // Execute the supply operation
      console.log("🚀 (AAVE-SUPPLY) Executing WETH supply operation...");

      const aaveSupplyExecuteRes = await aaveToolClient.execute(
        {
          operation: "supply",
          asset: TEST_WETH_ADDRESS,
          amount: WETH_SUPPLY_AMOUNT,
          chain: "sepolia",
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(AAVE-EXECUTE-SUPPLY): ",
        JSON.stringify(aaveSupplyExecuteRes, null, 2)
      );

      if (aaveSupplyExecuteRes.success) {
        console.log("✅ (AAVE-STEP-1) WETH supply completed successfully!");
        console.log(`   Tx hash: ${aaveSupplyExecuteRes.result.txHash}`);

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for supply transaction confirmation...");
          const receipt = await sepoliaProvider.waitForTransaction(
            aaveSupplyExecuteRes.result.txHash,
            1,
            180000
          ); // 1 confirmation, 3 minute timeout
          console.log(
            `   ✅ Supply transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed, proceeding anyway:",
            confirmError.message
          );
          // Add a small delay to let the transaction potentially propagate
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Verify balance after supply
        try {
          console.log("🔍 Verifying WETH balance after supply...");

          // WETH contract for balance checking
          const wethAbi = [
            "function balanceOf(address account) view returns (uint256)",
          ];
          const wethContract = new ethers.Contract(
            TEST_WETH_ADDRESS,
            wethAbi,
            sepoliaProvider
          );

          const postSupplyBalance = await wethContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const postSupplyBalanceFormatted =
            ethers.utils.formatEther(postSupplyBalance);
          console.log(
            `   Post-supply WETH balance: ${postSupplyBalanceFormatted} WETH`
          );

          // Expected: balance should be reduced by the supplied amount
          const suppliedAmount = ethers.utils.parseEther(WETH_SUPPLY_AMOUNT);
          const expectedBalance = initialWethBalance.sub(suppliedAmount);
          const expectedBalanceFormatted =
            ethers.utils.formatEther(expectedBalance);

          console.log(
            `   Expected WETH balance: ${expectedBalanceFormatted} WETH`
          );

          if (postSupplyBalance.eq(expectedBalance)) {
            console.log("✅ WETH balance correctly reduced after supply");
            addTestResult("AAVE Supply WETH", true);
          } else {
            const errorMsg = `Balance mismatch after supply. Expected: ${expectedBalanceFormatted} WETH, Got: ${postSupplyBalanceFormatted} WETH`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("AAVE Supply WETH", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after supply:",
            balanceError.message
          );
          addTestResult(
            "AAVE Supply WETH",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Supply execution failed: ${
          aaveSupplyExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (AAVE-STEP-1) WETH supply failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(aaveSupplyExecuteRes, null, 2)
        );
        addTestResult("AAVE Supply WETH", false, errorMsg);
      }
    } else {
      const errorMsg = `Supply precheck failed: ${
        aaveSupplyPrecheckRes.error || "Unknown precheck error"
      }`;
      console.log("❌ (AAVE-PRECHECK-SUPPLY)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(aaveSupplyPrecheckRes, null, 2)
      );
      addTestResult("AAVE Supply WETH", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `AAVE Supply operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (AAVE-SUPPLY) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("AAVE Supply WETH", false, errorMsg);
  }

  // ========================================
  // STEP 2: Borrow USDC against WETH collateral
  // ========================================
  console.log("(AAVE-STEP-2) Borrow USDC against WETH collateral");

  console.log(`   Borrowing ${USDC_BORROW_AMOUNT} USDC`);
  console.log(`   USDC Address: ${TEST_USDC_ADDRESS}`);

  // Test 5: AAVE Borrow Operation
  try {
    const aaveBorrowPrecheckRes = await aaveToolClient.precheck(
      {
        operation: "borrow",
        asset: TEST_USDC_ADDRESS,
        amount: USDC_BORROW_AMOUNT,
        interestRateMode: 2, // Variable rate
        rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(AAVE-PRECHECK-BORROW): ",
      JSON.stringify(aaveBorrowPrecheckRes, null, 2)
    );

    if (aaveBorrowPrecheckRes.success) {
      console.log("✅ (AAVE-PRECHECK-BORROW) USDC borrow precheck passed");

      // Execute the borrow operation
      console.log("🚀 (AAVE-BORROW) Executing USDC borrow operation...");

      const aaveBorrowExecuteRes = await aaveToolClient.execute(
        {
          operation: "borrow",
          asset: TEST_USDC_ADDRESS,
          amount: USDC_BORROW_AMOUNT,
          interestRateMode: 2, // Variable rate
          chain: "sepolia",
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(AAVE-EXECUTE-BORROW): ",
        JSON.stringify(aaveBorrowExecuteRes, null, 2)
      );

      if (aaveBorrowExecuteRes.success) {
        console.log("✅ (AAVE-STEP-2) USDC borrow completed successfully!");
        console.log(
          `   Transaction Hash: ${aaveBorrowExecuteRes.result.txHash}`
        );

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for borrow transaction confirmation...");

          const receipt = await sepoliaProvider.waitForTransaction(
            aaveBorrowExecuteRes.result.txHash,
            1,
            180000
          ); // 1 confirmation, 3 minute timeout
          console.log(
            `   ✅ Borrow transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed, proceeding anyway:",
            confirmError.message
          );
          // Add a small delay to let the transaction potentially propagate
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Verify USDC balance after borrow
        try {
          console.log("🔍 Verifying USDC balance after borrow...");

          // USDC contract for balance checking
          const usdcAbi = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
          ];
          const usdcContract = new ethers.Contract(
            TEST_USDC_ADDRESS,
            usdcAbi,
            sepoliaProvider
          );

          const postBorrowBalance = await usdcContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const decimals = await usdcContract.decimals();
          const postBorrowBalanceFormatted = ethers.utils.formatUnits(
            postBorrowBalance,
            decimals
          );
          console.log(
            `   Post-borrow USDC balance: ${postBorrowBalanceFormatted} USDC`
          );

          // Expected: balance should be increased by borrowed amount
          const borrowedAmount = ethers.utils.parseUnits(
            USDC_BORROW_AMOUNT,
            decimals
          );
          const expectedBalance = initialUsdcBalance.add(borrowedAmount);
          const expectedBalanceFormatted = ethers.utils.formatUnits(
            expectedBalance,
            decimals
          );

          console.log(
            `   Expected USDC balance: ${expectedBalanceFormatted} USDC`
          );

          if (postBorrowBalance.eq(expectedBalance)) {
            console.log("✅ USDC balance correctly increased after borrow");
            addTestResult("AAVE Borrow USDC", true);
          } else {
            const errorMsg = `Balance mismatch after borrow. Expected: ${expectedBalanceFormatted} USDC, Got: ${postBorrowBalanceFormatted} USDC`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("AAVE Borrow USDC", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after borrow:",
            balanceError.message
          );
          addTestResult(
            "AAVE Borrow USDC",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Borrow execution failed: ${
          aaveBorrowExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (AAVE-STEP-2) USDC borrow failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(aaveBorrowExecuteRes, null, 2)
        );
        addTestResult("AAVE Borrow USDC", false, errorMsg);
      }
    } else {
      const errorMsg = `Borrow precheck failed: ${
        aaveBorrowPrecheckRes.error || "Unknown precheck error"
      }`;
      console.log("❌ (AAVE-PRECHECK-BORROW)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(aaveBorrowPrecheckRes, null, 2)
      );
      addTestResult("AAVE Borrow USDC", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `AAVE Borrow operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (AAVE-BORROW) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("AAVE Borrow USDC", false, errorMsg);
  }

  // ========================================
  // ERC20 Approval for USDC (required for AAVE Repay)
  // ========================================
  console.log("🛂 Approving USDC for AAVE repay via ERC20 Approval Tool");

  try {
    const approveUsdcParams = {
      chainId: 11155111, // Sepolia
      tokenAddress: TEST_USDC_ADDRESS,
      spenderAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
      tokenAmount: parseFloat(USDC_BORROW_AMOUNT),
      tokenDecimals: 6,
      rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
    };

    const approveUsdcPrecheck = await approveToolClient.precheck(
      approveUsdcParams,
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(APPROVE-PRECHECK-USDC): ",
      JSON.stringify(approveUsdcPrecheck, null, 2)
    );

    if (approveUsdcPrecheck.success) {
      const approveUsdcExecute = await approveToolClient.execute(
        approveUsdcParams,
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(APPROVE-EXECUTE-USDC): ",
        JSON.stringify(approveUsdcExecute, null, 2)
      );

      if (approveUsdcExecute.success) {
        console.log("✅ USDC approval executed successfully");
        if (approveUsdcExecute.result.approvalTxHash) {
          console.log(
            "🔍 Waiting for USDC approval transaction confirmation..."
          );
          // wait for transaction confirmation
          const receipt = await sepoliaProvider.waitForTransaction(
            approveUsdcExecute.result.approvalTxHash,
            1,
            180000
          );
          console.log(
            `   USDC approval confirmed in block ${receipt.blockNumber}`
          );
        }
        addTestResult("ERC20 Approve USDC", true);
      } else {
        const errMsg = approveUsdcExecute.error || "Unknown execution error";
        console.log("❌ USDC approval execution failed:", errMsg);
        addTestResult("ERC20 Approve USDC", false, errMsg);
      }
    } else {
      const errMsg = approveUsdcPrecheck.error || "Unknown precheck error";
      console.log("❌ USDC approval precheck failed:", errMsg);
      addTestResult("ERC20 Approve USDC", false, errMsg);
    }
  } catch (error) {
    console.log("❌ USDC approval unexpected error:", error.message || error);
    addTestResult(
      "ERC20 Approve USDC",
      false,
      error.message || error.toString()
    );
  }

  // ========================================
  // STEP 3: Repay USDC Debt
  // ========================================
  console.log("(AAVE-STEP-3) Repay USDC debt");

  const USDC_REPAY_AMOUNT = USDC_BORROW_AMOUNT; // Repay full amount
  console.log(`   Repaying ${USDC_REPAY_AMOUNT} USDC`);

  // Test 6: AAVE Repay Operation
  try {
    const aaveRepayPrecheckRes = await aaveToolClient.precheck(
      {
        operation: "repay",
        asset: TEST_USDC_ADDRESS,
        amount: USDC_REPAY_AMOUNT,
        interestRateMode: 2, // Variable rate
        rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(AAVE-PRECHECK-REPAY): ",
      JSON.stringify(aaveRepayPrecheckRes, null, 2)
    );

    if (aaveRepayPrecheckRes.success) {
      console.log("✅ (AAVE-PRECHECK-REPAY) USDC repay precheck passed");

      // Execute the repay operation
      console.log("🚀 (AAVE-REPAY) Executing USDC repay operation...");

      const aaveRepayExecuteRes = await aaveToolClient.execute(
        {
          operation: "repay",
          asset: TEST_USDC_ADDRESS,
          amount: USDC_REPAY_AMOUNT,
          interestRateMode: 2, // Variable rate
          chain: "sepolia",
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(AAVE-EXECUTE-REPAY): ",
        JSON.stringify(aaveRepayExecuteRes, null, 2)
      );

      if (aaveRepayExecuteRes.success) {
        console.log("✅ (AAVE-STEP-3) USDC repay completed successfully!");
        console.log(
          `   Transaction Hash: ${aaveRepayExecuteRes.result.txHash}`
        );

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for repay transaction confirmation...");

          const receipt = await sepoliaProvider.waitForTransaction(
            aaveRepayExecuteRes.result.txHash,
            1,
            180000
          ); // 1 confirmation, 3 minute timeout
          console.log(
            `   ✅ Repay transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed, proceeding anyway:",
            confirmError.message
          );
          // Add a small delay to let the transaction potentially propagate
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Verify USDC balance after repay
        try {
          console.log("🔍 Verifying USDC balance after repay...");

          // USDC contract for balance checking
          const usdcAbi = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
          ];
          const usdcContract = new ethers.Contract(
            TEST_USDC_ADDRESS,
            usdcAbi,
            sepoliaProvider
          );

          const postRepayBalance = await usdcContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const decimals = await usdcContract.decimals();
          const postRepayBalanceFormatted = ethers.utils.formatUnits(
            postRepayBalance,
            decimals
          );
          console.log(
            `   Post-repay USDC balance: ${postRepayBalanceFormatted} USDC`
          );

          // Expected: balance should return to initial amount (borrowed amount repaid)
          const expectedBalance = initialUsdcBalance;
          const expectedBalanceFormatted = ethers.utils.formatUnits(
            expectedBalance,
            decimals
          );

          console.log(
            `   Expected USDC balance: ${expectedBalanceFormatted} USDC`
          );

          if (postRepayBalance.eq(expectedBalance)) {
            console.log(
              "✅ USDC balance correctly returned to initial amount after repay"
            );
            addTestResult("AAVE Repay USDC", true);
          } else {
            const errorMsg = `Balance mismatch after repay. Expected: ${expectedBalanceFormatted} USDC, Got: ${postRepayBalanceFormatted} USDC`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("AAVE Repay USDC", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after repay:",
            balanceError.message
          );
          addTestResult(
            "AAVE Repay USDC",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Repay execution failed: ${
          aaveRepayExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (AAVE-STEP-3) USDC repay failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(aaveRepayExecuteRes, null, 2)
        );
        addTestResult("AAVE Repay USDC", false, errorMsg);
      }
    } else {
      const errorMsg = `Repay precheck failed: ${
        aaveRepayPrecheckRes.error || "Unknown precheck error"
      }`;
      console.log("❌ (AAVE-PRECHECK-REPAY)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(aaveRepayPrecheckRes, null, 2)
      );
      addTestResult("AAVE Repay USDC", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `AAVE Repay operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (AAVE-REPAY) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("AAVE Repay USDC", false, errorMsg);
  }

  // ========================================
  // STEP 4: Withdraw WETH Collateral
  // ========================================
  console.log("(AAVE-STEP-4) Withdraw WETH collateral");

  const WETH_WITHDRAW_AMOUNT = WETH_SUPPLY_AMOUNT; // Withdraw full collateral
  console.log(`   Withdrawing ${WETH_WITHDRAW_AMOUNT} WETH`);

  // Test 7: AAVE Withdraw Operation
  try {
    const aaveWithdrawPrecheckRes = await aaveToolClient.precheck(
      {
        operation: "withdraw",
        asset: TEST_WETH_ADDRESS,
        amount: WETH_WITHDRAW_AMOUNT,
        rpcUrl: process.env.ETH_SEPOLIA_RPC_URL,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log(
      "(AAVE-PRECHECK-WITHDRAW): ",
      JSON.stringify(aaveWithdrawPrecheckRes, null, 2)
    );

    if (aaveWithdrawPrecheckRes.success) {
      console.log("✅ (AAVE-PRECHECK-WITHDRAW) WETH withdraw precheck passed");

      // Execute the withdraw operation
      console.log("🚀 (AAVE-WITHDRAW) Executing WETH withdraw operation...");

      const aaveWithdrawExecuteRes = await aaveToolClient.execute(
        {
          operation: "withdraw",
          asset: TEST_WETH_ADDRESS,
          amount: WETH_WITHDRAW_AMOUNT,
          chain: "sepolia",
        },
        {
          delegatorPkpEthAddress: agentWalletPkp.ethAddress,
        }
      );

      console.log(
        "(AAVE-EXECUTE-WITHDRAW): ",
        JSON.stringify(aaveWithdrawExecuteRes, null, 2)
      );

      if (aaveWithdrawExecuteRes.success) {
        console.log("✅ (AAVE-STEP-4) WETH withdraw completed successfully!");
        console.log(
          `   Transaction Hash: ${aaveWithdrawExecuteRes.result.txHash}`
        );

        // Wait for transaction confirmation
        try {
          console.log("⏳ Waiting for withdraw transaction confirmation...");

          const receipt = await sepoliaProvider.waitForTransaction(
            aaveWithdrawExecuteRes.result.txHash,
            1,
            180000
          ); // 1 confirmation, 3 minute timeout
          console.log(
            `   ✅ Withdraw transaction confirmed in block ${receipt.blockNumber}`
          );
        } catch (confirmError) {
          console.log(
            "⚠️  Transaction confirmation failed, proceeding anyway:",
            confirmError.message
          );
          // Add a small delay to let the transaction potentially propagate
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Verify WETH balance after withdraw
        try {
          console.log("🔍 Verifying WETH balance after withdraw...");

          // WETH contract for balance checking
          const wethAbi = [
            "function balanceOf(address account) view returns (uint256)",
          ];
          const wethContract = new ethers.Contract(
            TEST_WETH_ADDRESS,
            wethAbi,
            sepoliaProvider
          );

          const postWithdrawBalance = await wethContract.balanceOf(
            agentWalletPkp.ethAddress
          );
          const postWithdrawBalanceFormatted =
            ethers.utils.formatEther(postWithdrawBalance);
          console.log(
            `   Post-withdraw WETH balance: ${postWithdrawBalanceFormatted} WETH`
          );

          // Expected: balance should return to initial amount (collateral withdrawn)
          const expectedBalance = initialWethBalance;
          const expectedBalanceFormatted =
            ethers.utils.formatEther(expectedBalance);

          console.log(
            `   Expected WETH balance: ${expectedBalanceFormatted} WETH`
          );

          if (postWithdrawBalance.eq(expectedBalance)) {
            console.log(
              "✅ WETH balance correctly returned to initial amount after withdraw"
            );
            addTestResult("AAVE Withdraw WETH", true);
          } else {
            const errorMsg = `Balance mismatch after withdraw. Expected: ${expectedBalanceFormatted} WETH, Got: ${postWithdrawBalanceFormatted} WETH`;
            console.log(`❌ ${errorMsg}`);
            addTestResult("AAVE Withdraw WETH", false, errorMsg);
          }
        } catch (balanceError) {
          console.log(
            "❌ Could not verify balance after withdraw:",
            balanceError.message
          );
          addTestResult(
            "AAVE Withdraw WETH",
            false,
            `Balance verification failed: ${balanceError.message}`
          );
        }
      } else {
        const errorMsg = `Withdraw execution failed: ${
          aaveWithdrawExecuteRes.error || "Unknown execution error"
        }`;
        console.log("❌ (AAVE-STEP-4) WETH withdraw failed:", errorMsg);
        console.log(
          "   Full execution response:",
          JSON.stringify(aaveWithdrawExecuteRes, null, 2)
        );
        addTestResult("AAVE Withdraw WETH", false, errorMsg);
      }
    } else {
      const errorMsg = `Withdraw precheck failed: ${
        aaveWithdrawPrecheckRes.error || "Unknown precheck error"
      }`;
      console.log("❌ (AAVE-PRECHECK-WITHDRAW)", errorMsg);
      console.log(
        "   Full precheck response:",
        JSON.stringify(aaveWithdrawPrecheckRes, null, 2)
      );
      addTestResult("AAVE Withdraw WETH", false, errorMsg);
    }
  } catch (error) {
    const errorMsg = `AAVE Withdraw operation threw exception: ${
      error.message || error
    }`;
    console.log("❌ (AAVE-WITHDRAW) Unexpected error:", errorMsg);
    console.log("   Error stack:", error.stack);
    addTestResult("AAVE Withdraw WETH", false, errorMsg);
  }

  // ========================================
  // Print Test Summary and Exit
  // ========================================
  const allTestsPassed = printTestSummary();
  process.exit(allTestsPassed ? 0 : 1);
})();
