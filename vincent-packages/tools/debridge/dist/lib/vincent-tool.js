import { createVincentTool, supportedPoliciesForTool } from "@lit-protocol/vincent-tool-sdk";
import "@lit-protocol/vincent-tool-sdk/internal";
import { laUtils } from "@lit-protocol/vincent-scaffold-sdk";
import { ethers } from "ethers";
import { toolParamsSchema, precheckSuccessSchema, precheckFailSchema, executeSuccessSchema, executeFailSchema, } from "./schemas";
import { DEBRIDGE_CONTRACTS, DEBRIDGE_ABI, ERC20_ABI, validateChainId, validateAddress, getTokenBalance, getTokenDecimals, checkAndApproveToken, isNativeToken, callDeBridgeAPI, } from "./helpers";
export const vincentTool = createVincentTool({
    packageName: "@lit-protocol/vincent-tool-debridge",
    toolParamsSchema,
    supportedPolicies: supportedPoliciesForTool([]),
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,
    precheck: async ({ toolParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
        const logPrefix = "[@lit-protocol/vincent-tool-debridge/precheck]";
        console.log(`${logPrefix} Starting precheck with params:`, toolParams);
        const { sourceChain, destinationChain, sourceToken, destinationToken, amount, recipientAddress, rpcUrl, operation, slippageBps, } = toolParams;
        try {
            // Validate chain IDs
            if (!validateChainId(sourceChain)) {
                return fail({ error: `Invalid source chain ID: ${sourceChain}` });
            }
            if (!validateChainId(destinationChain)) {
                return fail({ error: `Invalid destination chain ID: ${destinationChain}` });
            }
            // Validate addresses
            if (!validateAddress(sourceToken)) {
                return fail({ error: `Invalid source token address: ${sourceToken}` });
            }
            if (!validateAddress(destinationToken)) {
                return fail({ error: `Invalid destination token address: ${destinationToken}` });
            }
            if (!validateAddress(recipientAddress)) {
                return fail({ error: `Invalid recipient address: ${recipientAddress}` });
            }
            // Check if chains are different for bridging
            if (sourceChain === destinationChain) {
                return fail({ error: "Source and destination chains must be different for bridging" });
            }
            // Connect to provider
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const network = await provider.getNetwork();
            if (network.chainId.toString() !== sourceChain) {
                return fail({ error: `RPC URL chain ID (${network.chainId}) does not match source chain ID (${sourceChain})` });
            }
            // Get deBridge contract address for source chain
            const deBridgeContract = DEBRIDGE_CONTRACTS[sourceChain];
            if (!deBridgeContract) {
                return fail({ error: `DeBridge contract not available on chain ${sourceChain}` });
            }
            // Use PKP address for balance checks
            const pkpAddress = delegatorPkpInfo.ethAddress;
            // Get token decimals
            const sourceDecimals = await getTokenDecimals(provider, sourceToken);
            // Parse amount
            let amountBN;
            try {
                amountBN = ethers.BigNumber.from(amount);
            }
            catch (error) {
                return fail({ error: `Invalid amount format: ${amount}` });
            }
            // Check user balance
            const balance = await getTokenBalance(provider, sourceToken, pkpAddress);
            console.log(`${logPrefix} PKP balance: ${balance.toString()}, Required: ${amountBN.toString()}`);
            if (balance.lt(amountBN)) {
                return fail({ error: `Insufficient balance. Have: ${balance.toString()}, Need: ${amountBN.toString()}` });
            }
            // Get quote from deBridge API
            console.log(`${logPrefix} Getting quote from deBridge API...`);
            const quoteParams = {
                srcChainId: sourceChain,
                srcChainTokenIn: sourceToken,
                srcChainTokenInAmount: amount,
                dstChainId: destinationChain,
                dstChainTokenOut: destinationToken,
                prependOperatingExpenses: "true",
            };
            let quoteData;
            try {
                quoteData = await callDeBridgeAPI("/dln/order/quote", "GET", quoteParams);
                console.log(`${logPrefix} Quote received:`, quoteData);
            }
            catch (error) {
                return fail({ error: `Failed to get quote from deBridge: ${error.message}` });
            }
            // Estimate gas for the transaction
            let estimatedGas = ethers.BigNumber.from(300000); // Default estimate
            try {
                const deBridgeInterface = new ethers.utils.Interface(DEBRIDGE_ABI);
                // For estimation, we'll use dummy order data
                const orderData = {
                    giveTokenAddress: sourceToken,
                    giveAmount: amountBN,
                    takeAmount: ethers.BigNumber.from(quoteData.estimation.dstChainTokenOut.amount),
                    takeChainId: ethers.BigNumber.from(destinationChain),
                    receiverDst: recipientAddress,
                    givePatchAuthoritySrc: pkpAddress,
                    orderAuthorityAddressDst: recipientAddress,
                    allowedTakerDst: "0x",
                    externalCall: "0x",
                    allowedCancelBeneficiarySrc: "0x",
                };
                const txData = deBridgeInterface.encodeFunctionData("createOrder", [
                    orderData,
                    "0x", // affiliateFee
                    0, // referralCode
                    "0x", // permit
                ]);
                const gasEstimate = await provider.estimateGas({
                    to: deBridgeContract,
                    from: pkpAddress,
                    data: txData,
                    value: isNativeToken(sourceToken) ? amountBN : 0,
                });
                estimatedGas = gasEstimate.mul(120).div(100); // Add 20% buffer
            }
            catch (error) {
                console.log(`${logPrefix} Gas estimation failed, using default:`, error);
            }
            const gasPrice = await provider.getGasPrice();
            const estimatedGasCost = estimatedGas.mul(gasPrice);
            // Calculate total cost
            const protocolFee = ethers.BigNumber.from(quoteData.fixFee || "0");
            const totalCost = isNativeToken(sourceToken)
                ? amountBN.add(estimatedGasCost).add(protocolFee)
                : estimatedGasCost.add(protocolFee);
            return succeed({
                data: {
                    sourceChain,
                    destinationChain,
                    sourceToken,
                    destinationToken,
                    sourceAmount: amount,
                    estimatedDestinationAmount: quoteData.estimation.dstChainTokenOut.amount,
                    estimatedFees: {
                        protocolFee: protocolFee.toString(),
                        gasFee: estimatedGasCost.toString(),
                        totalFee: protocolFee.add(estimatedGasCost).toString(),
                    },
                    estimatedExecutionTime: quoteData.estimation.estimatedTxExecutionTime || "300",
                },
            });
        }
        catch (error) {
            console.error(`${logPrefix} Unexpected error:`, error);
            return fail({ error: `Unexpected error: ${error.message}` });
        }
    },
    execute: async ({ toolParams }, { succeed, fail, delegation }) => {
        const logPrefix = "[@lit-protocol/vincent-tool-debridge/execute]";
        console.log(`${logPrefix} Starting execution with params:`, toolParams);
        const { sourceChain, destinationChain, sourceToken, destinationToken, amount, recipientAddress, operation, slippageBps, } = toolParams;
        try {
            // Get PKP info
            const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
            const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);
            console.log(`${logPrefix} PKP Address: ${pkpAddress}`);
            // Get RPC URL from Lit Actions
            const rpcUrl = await Lit.Actions.getRpcUrl({ chain: sourceChain });
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            // Get deBridge contract address
            const deBridgeContract = DEBRIDGE_CONTRACTS[sourceChain];
            if (!deBridgeContract) {
                return fail({ error: `DeBridge contract not available on chain ${sourceChain}` });
            }
            // Parse amount
            const amountBN = ethers.BigNumber.from(amount);
            // Check approval if needed (for ERC20 tokens)
            if (!isNativeToken(sourceToken)) {
                const { needsApproval } = await checkAndApproveToken(provider, sourceToken, pkpAddress, deBridgeContract, amountBN);
                if (needsApproval) {
                    console.log(`${logPrefix} Approving token...`);
                    const approvalTxHash = await laUtils.transaction.handler.contractCall({
                        provider,
                        pkpPublicKey,
                        callerAddress: pkpAddress,
                        abi: ERC20_ABI,
                        contractAddress: sourceToken,
                        functionName: "approve",
                        args: [deBridgeContract, ethers.constants.MaxUint256],
                        chainId: parseInt(sourceChain),
                        gasBumpPercentage: 10,
                    });
                    console.log(`${logPrefix} Approval transaction hash: ${approvalTxHash}`);
                }
            }
            // Get transaction data from deBridge API
            console.log(`${logPrefix} Getting transaction data from deBridge API...`);
            const createOrderParams = {
                srcChainId: sourceChain,
                srcChainTokenIn: sourceToken,
                srcChainTokenInAmount: amount,
                dstChainId: destinationChain,
                dstChainTokenOut: destinationToken,
                dstChainTokenOutRecipient: recipientAddress,
                srcChainOrderAuthorityAddress: pkpAddress,
                dstChainOrderAuthorityAddress: recipientAddress,
                affiliateFeePercent: "0",
                prependOperatingExpenses: "true",
            };
            let orderTxData;
            try {
                orderTxData = await callDeBridgeAPI("/dln/order/create-tx", "GET", createOrderParams);
                console.log(`${logPrefix} Order transaction data received`);
            }
            catch (error) {
                return fail({ error: `Failed to get order transaction data: ${error.message}` });
            }
            // Decode the transaction data to get the order details
            const deBridgeInterface = new ethers.utils.Interface(DEBRIDGE_ABI);
            const decodedData = deBridgeInterface.decodeFunctionData("createOrder", orderTxData.tx.data);
            // Execute the bridge transaction
            console.log(`${logPrefix} Executing bridge transaction...`);
            const txHash = await laUtils.transaction.handler.contractCall({
                provider,
                pkpPublicKey,
                callerAddress: pkpAddress,
                abi: DEBRIDGE_ABI,
                contractAddress: orderTxData.tx.to,
                functionName: "createOrder",
                args: [...decodedData],
                chainId: parseInt(sourceChain),
                overrides: {
                    value: orderTxData.tx.value || "0",
                },
                gasBumpPercentage: 10,
            });
            console.log(`${logPrefix} Bridge transaction successful. Hash: ${txHash}`);
            return succeed({
                data: {
                    txHash,
                    sourceChain,
                    destinationChain,
                    sourceToken,
                    destinationToken,
                    sourceAmount: amount,
                    orderId: orderTxData.orderId,
                },
            });
        }
        catch (error) {
            console.error(`${logPrefix} Execution error:`, error);
            return fail({ error: `Execution failed: ${error.message}` });
        }
    },
});
