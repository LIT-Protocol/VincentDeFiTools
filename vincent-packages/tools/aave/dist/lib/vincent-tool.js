import { createVincentTool, supportedPoliciesForTool, } from "@lit-protocol/vincent-tool-sdk";
import "@lit-protocol/vincent-tool-sdk/internal";
import { executeFailSchema, executeSuccessSchema, precheckFailSchema, precheckSuccessSchema, toolParamsSchema, AaveOperation, } from "./schemas";
import { AAVE_V3_SEPOLIA_ADDRESSES, AAVE_POOL_ABI, ERC20_ABI, INTEREST_RATE_MODE, isValidAddress, parseAmount, } from "./helpers";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
export const vincentTool = createVincentTool({
    packageName: "@lit-protocol/vincent-tool-aave",
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
                error: "[@lit-protocol/vincent-tool-aave/precheck] Invalid operation. Must be supply, withdraw, borrow, or repay",
            });
        }
        // Validate asset address
        if (!isValidAddress(asset)) {
            return fail({
                error: "[@lit-protocol/vincent-tool-aave/precheck] Invalid asset address format",
            });
        }
        // Validate amount
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return fail({
                error: "[@lit-protocol/vincent-tool-aave/precheck] Invalid amount format or amount must be greater than 0",
            });
        }
        // Validate interest rate mode for borrow operations
        if (operation === AaveOperation.BORROW) {
            if (!interestRateMode || (interestRateMode !== INTEREST_RATE_MODE.STABLE && interestRateMode !== INTEREST_RATE_MODE.VARIABLE)) {
                return fail({
                    error: "[@lit-protocol/vincent-tool-aave/precheck] Interest rate mode is required for borrow operations (1 = Stable, 2 = Variable)",
                });
            }
        }
        // Basic validation passed
        const successResult = {
            operationValid: true,
            assetValid: true,
            amountValid: true,
        };
        console.log("[@lit-protocol/vincent-tool-aave/precheck] Success result:", successResult);
        const successResponse = succeed(successResult);
        console.log("[@lit-protocol/vincent-tool-aave/precheck] Success response:", JSON.stringify(successResponse, null, 2));
        return successResponse;
    },
    execute: async ({ toolParams }, { succeed, fail, delegation }) => {
        try {
            const { operation, asset, amount, interestRateMode, onBehalfOf } = toolParams;
            console.log("[@lit-protocol/vincent-tool-aave/execute] Executing AAVE Tool", {
                operation,
                asset,
                amount,
                interestRateMode,
            });
            // Get provider - use Yellowstone provider for now (we'll modify this for Sepolia in E2E tests)
            const provider = await laUtils.chain.getYellowstoneProvider();
            // Get PKP public key from delegation context
            const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
            if (!pkpPublicKey) {
                throw new Error("PKP public key not available from delegation context");
            }
            // Get PKP address using ethers utils
            const pkpAddress = ethers.utils.computeAddress("0x" + pkpPublicKey);
            console.log("[@lit-protocol/vincent-tool-aave/execute] PKP Address:", pkpAddress);
            // Prepare transaction based on operation
            let txHash;
            switch (operation) {
                case AaveOperation.SUPPLY:
                    txHash = await executeSupply(provider, pkpPublicKey, asset, amount, onBehalfOf || pkpAddress);
                    break;
                case AaveOperation.WITHDRAW:
                    txHash = await executeWithdraw(provider, pkpPublicKey, asset, amount, pkpAddress);
                    break;
                case AaveOperation.BORROW:
                    if (!interestRateMode) {
                        throw new Error("Interest rate mode is required for borrow operations");
                    }
                    txHash = await executeBorrow(provider, pkpPublicKey, asset, amount, interestRateMode, onBehalfOf || pkpAddress);
                    break;
                case AaveOperation.REPAY:
                    txHash = await executeRepay(provider, pkpPublicKey, asset, amount, interestRateMode || INTEREST_RATE_MODE.VARIABLE, onBehalfOf || pkpAddress);
                    break;
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
            console.log("[@lit-protocol/vincent-tool-aave/execute] AAVE operation successful", {
                txHash,
                operation,
                asset,
                amount,
            });
            return succeed({
                txHash,
                operation,
                asset,
                amount,
                timestamp: Date.now(),
                interestRateMode: interestRateMode,
            });
        }
        catch (error) {
            console.error("[@lit-protocol/vincent-tool-aave/execute] AAVE operation failed", error);
            return fail({
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    },
});
/**
 * Execute AAVE Supply operation
 */
async function executeSupply(provider, pkpPublicKey, asset, amount, onBehalfOf) {
    console.log("[@lit-protocol/vincent-tool-aave/executeSupply] Starting supply operation");
    // First, we need to approve the AAVE Pool to spend the tokens
    const parsedAmount = parseAmount(amount);
    const callerAddress = ethers.utils.computeAddress("0x" + pkpPublicKey);
    // Approve tokens for AAVE Pool
    const approveTxHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: ERC20_ABI,
        contractAddress: asset,
        functionName: "approve",
        args: [AAVE_V3_SEPOLIA_ADDRESSES.POOL, parsedAmount],
    });
    console.log("[@lit-protocol/vincent-tool-aave/executeSupply] Approval tx:", approveTxHash);
    // Now supply to AAVE
    const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: AAVE_POOL_ABI,
        contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
        functionName: "supply",
        args: [asset, parsedAmount, onBehalfOf, 0],
    });
    return txHash;
}
/**
 * Execute AAVE Withdraw operation
 */
async function executeWithdraw(provider, pkpPublicKey, asset, amount, to) {
    console.log("[@lit-protocol/vincent-tool-aave/executeWithdraw] Starting withdraw operation");
    const parsedAmount = parseAmount(amount);
    const callerAddress = ethers.utils.computeAddress("0x" + pkpPublicKey);
    const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: AAVE_POOL_ABI,
        contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
        functionName: "withdraw",
        args: [asset, parsedAmount, to],
    });
    return txHash;
}
/**
 * Execute AAVE Borrow operation
 */
async function executeBorrow(provider, pkpPublicKey, asset, amount, interestRateMode, onBehalfOf) {
    console.log("[@lit-protocol/vincent-tool-aave/executeBorrow] Starting borrow operation");
    const parsedAmount = parseAmount(amount);
    const callerAddress = ethers.utils.computeAddress("0x" + pkpPublicKey);
    const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: AAVE_POOL_ABI,
        contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
        functionName: "borrow",
        args: [asset, parsedAmount, interestRateMode, 0, onBehalfOf],
    });
    return txHash;
}
/**
 * Execute AAVE Repay operation
 */
async function executeRepay(provider, pkpPublicKey, asset, amount, rateMode, onBehalfOf) {
    console.log("[@lit-protocol/vincent-tool-aave/executeRepay] Starting repay operation");
    const parsedAmount = parseAmount(amount);
    const callerAddress = ethers.utils.computeAddress("0x" + pkpPublicKey);
    // First, approve the tokens for repayment
    const approveTxHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: ERC20_ABI,
        contractAddress: asset,
        functionName: "approve",
        args: [AAVE_V3_SEPOLIA_ADDRESSES.POOL, parsedAmount],
    });
    console.log("[@lit-protocol/vincent-tool-aave/executeRepay] Approval tx:", approveTxHash);
    // Now repay the debt
    const txHash = await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress,
        abi: AAVE_POOL_ABI,
        contractAddress: AAVE_V3_SEPOLIA_ADDRESSES.POOL,
        functionName: "repay",
        args: [asset, parsedAmount, rateMode, onBehalfOf],
    });
    return txHash;
}
