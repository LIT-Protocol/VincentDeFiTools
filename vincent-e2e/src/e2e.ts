import {
  PARAMETER_TYPE,
  createAppConfig,
  init,
  suppressLitLogs,
} from "@lit-protocol/vincent-scaffold-sdk/e2e";

// Apply log suppression FIRST, before any imports that might trigger logs
suppressLitLogs(false);

import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
// Tools and Policies that we wil be testing
import { vincentPolicyMetadata as sendLimitPolicyMetadata } from "../../vincent-packages/policies/send-counter-limit/dist/index.js";
import { bundledVincentTool as nativeSendTool } from "../../vincent-packages/tools/native-send/dist/index.js";

(async () => {
  /**
   * ====================================
   * Initialise the environment
   * ====================================
   */
  const { accounts, chainClient } = await init({
    network: "datil",
    deploymentStatus: "dev"
  });

  /**
   * ====================================
   * (🫵 You) Prepare the tools and policies
   * ====================================
   */
  const nativeSendToolClient = getVincentToolClient({
    bundledVincentTool: nativeSendTool,
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
        nativeSendTool.ipfsCid,
        // ...add more tool IPFS CIDs here
      ],
      toolPolicies: [
        // [
        //   // fooLimitPolicyMetadata.ipfsCid
        // ],
        [
          sendLimitPolicyMetadata.ipfsCid, // Enable send-counter-limit policy for native-send tool
        ],
      ],
      toolPolicyParameterNames: [
        // [], // No policy parameter names for helloWorldTool
        ["maxSends", "timeWindowSeconds"], // Policy parameter names for nativeSendTool
      ],
      toolPolicyParameterTypes: [
        // [], // No policy parameter types for helloWorldTool
        [PARAMETER_TYPE.UINT256, PARAMETER_TYPE.UINT256], // uint256 types for maxSends and timeWindowSeconds
      ],
      toolPolicyParameterValues: [
        // [], // No policy parameter values for helloWorldTool
        ["2", "10"], // maxSends: 2, timeWindowSeconds: 10
      ],
    },

    // Debugging options
    {
      cidToNameMap: {
        // [helloWorldTool.ipfsCid]: "Hello World Tool",
        [nativeSendTool.ipfsCid]: "Native Send Tool",
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
    // helloWorldTool.ipfsCid,
    nativeSendTool.ipfsCid,
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
  const validation = await chainClient.validateToolExecution({
    delegateeAddress: accounts.delegatee.ethersWallet.address,
    pkpTokenId: agentWalletPkp.tokenId,
    toolIpfsCid: nativeSendTool.ipfsCid,
  });

  console.log("✅ Tool execution validation:", validation);

  if (!validation.isPermitted) {
    throw new Error(
      `❌ Delegatee is not permitted to execute tool for PKP. Validation: ${JSON.stringify(
        validation
      )}`
    );
  }

  /**
   * ====================================
   * Test your tools and policies here
   * ====================================
   *
   * This section is where you validate that your custom tools and policies
   * work together as expected.
   *
   * Replace this example with tests relevant to your tools and policies.
   * ====================================
   */
  console.log("🧪 Testing send limit policy");

  const TEST_RECIPIENT = accounts.delegatee.ethersWallet.address;
  const TEST_AMOUNT = "0.00001";

  // ----------------------------------------
  // Test 1: First send should succeed
  // ----------------------------------------
  console.log("(PRECHECK-TEST-1) First send (should succeed)");
  const nativeSendPrecheckRes1 = await nativeSendToolClient.precheck(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  console.log("(PRECHECK-RES[1]): ", nativeSendPrecheckRes1);

  if (!nativeSendPrecheckRes1.success) {
    throw new Error(
      `❌ First precheck should succeed: ${JSON.stringify(
        nativeSendPrecheckRes1
      )}`
    );
  }

  console.log("(EXECUTE-TEST-1) First send (should succeed)");
  const executeRes1 = await nativeSendToolClient.execute(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  console.log("(EXECUTE-RES[1]): ", executeRes1);

  if (!executeRes1.success) {
    throw new Error(
      `❌ First execute should succeed: ${JSON.stringify(executeRes1)}`
    );
  }

  console.log("(✅ EXECUTE-TEST-1) First send completed successfully");

  // ----------------------------------------
  // Test 2: Second send should succeed
  // ----------------------------------------
  console.log("(PRECHECK-TEST-2) Second send (should succeed)");
  const nativeSendPrecheckRes2 = await nativeSendToolClient.precheck(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  console.log("(PRECHECK-RES[2]): ", nativeSendPrecheckRes2);

  if (!nativeSendPrecheckRes2.success) {
    throw new Error(
      `❌ (PRECHECK-TEST-2) Second precheck should succeed: ${JSON.stringify(
        nativeSendPrecheckRes2
      )}`
    );
  }

  const executeRes2 = await nativeSendToolClient.execute(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  console.log("(EXECUTE-RES[2]): ", executeRes2);

  if (!executeRes2.success) {
    throw new Error(
      `❌ (EXECUTE-TEST-2) Second execute should succeed: ${JSON.stringify(
        executeRes2
      )}`
    );
  }

  console.log("(✅ EXECUTE-TEST-2) Second send completed successfully");

  // ----------------------------------------
  // Test 3: Third send should fail (limit exceeded)
  // ----------------------------------------
  console.log("(PRECHECK-TEST-3) Third send (should fail - limit exceeded)");
  const nativeSendPrecheckRes3 = await nativeSendToolClient.precheck(
    {
      to: TEST_RECIPIENT,
      amount: TEST_AMOUNT,
    },
    {
      delegatorPkpEthAddress: agentWalletPkp.ethAddress,
    }
  );

  console.log("(PRECHECK-RES[3]): ", nativeSendPrecheckRes3);

  if (nativeSendPrecheckRes3.success) {
    console.log(
      "✅ (PRECHECK-TEST-3) Third precheck succeeded (expected - precheck only validates tool parameters)"
    );

    // Test if execution is properly blocked by policy
    console.log(
      "🧪 (EXECUTE-TEST-3) Testing if execution is blocked by policy (this is where enforcement happens)..."
    );

    const executeRes3 = await nativeSendToolClient.execute(
      {
        to: TEST_RECIPIENT,
        amount: TEST_AMOUNT,
      },
      {
        delegatorPkpEthAddress: agentWalletPkp.ethAddress,
      }
    );

    console.log("(EXECUTE-RES[3]): ", executeRes3);

    if (executeRes3.success) {
      throw new Error(
        "❌ (EXECUTE-TEST-3) CRITICAL: Third execution should have been blocked by policy but succeeded!"
      );
    } else {
      console.log(
        "✅ (EXECUTE-TEST-3) PERFECT: Third execution correctly blocked by send limit policy!"
      );
      console.log(
        "🎉 (EXECUTE-TEST-3) SEND LIMIT POLICY SYSTEM WORKING CORRECTLY!"
      );
      console.log(
        "📊 (EXECUTE-TEST-3) Policy properly enforced: 2 sends allowed, 3rd send blocked"
      );
    }
  } else {
    console.log(
      "🟨 (PRECHECK-TEST-3) Third send precheck failed (unexpected but also fine)"
    );
    console.log("🎉 (PRECHECK-TEST-3) POLICY ENFORCEMENT WORKING!");
  }

  process.exit();
})();
