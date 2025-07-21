import { z } from "zod";
/**
 * AAVE operation types
 */
export declare enum AaveOperation {
    SUPPLY = "supply",
    WITHDRAW = "withdraw",
    BORROW = "borrow",
    REPAY = "repay"
}
/**
 * Tool parameters schema - defines the input parameters for the AAVE tool
 */
export declare const toolParamsSchema: z.ZodObject<{
    operation: z.ZodNativeEnum<typeof AaveOperation>;
    asset: z.ZodString;
    amount: z.ZodEffects<z.ZodString, string, string>;
    interestRateMode: z.ZodOptional<z.ZodNumber>;
    onBehalfOf: z.ZodOptional<z.ZodString>;
    chain: z.ZodEffects<z.ZodString, string, string>;
    rpcUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    chain?: string;
    operation?: AaveOperation;
    asset?: string;
    amount?: string;
    interestRateMode?: number;
    onBehalfOf?: string;
    rpcUrl?: string;
}, {
    chain?: string;
    operation?: AaveOperation;
    asset?: string;
    amount?: string;
    interestRateMode?: number;
    onBehalfOf?: string;
    rpcUrl?: string;
}>;
/**
 * Precheck success result schema
 */
export declare const precheckSuccessSchema: z.ZodObject<{
    operationValid: z.ZodBoolean;
    assetValid: z.ZodBoolean;
    amountValid: z.ZodBoolean;
    userBalance: z.ZodOptional<z.ZodString>;
    allowance: z.ZodOptional<z.ZodString>;
    borrowCapacity: z.ZodOptional<z.ZodString>;
    estimatedGas: z.ZodOptional<z.ZodNumber>;
    availableMarkets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    supportedChains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    operationValid?: boolean;
    assetValid?: boolean;
    amountValid?: boolean;
    userBalance?: string;
    allowance?: string;
    borrowCapacity?: string;
    estimatedGas?: number;
    availableMarkets?: Record<string, string>;
    supportedChains?: string[];
}, {
    operationValid?: boolean;
    assetValid?: boolean;
    amountValid?: boolean;
    userBalance?: string;
    allowance?: string;
    borrowCapacity?: string;
    estimatedGas?: number;
    availableMarkets?: Record<string, string>;
    supportedChains?: string[];
}>;
/**
 * Precheck failure result schema
 */
export declare const precheckFailSchema: z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>;
/**
 * Execute success result schema
 */
export declare const executeSuccessSchema: z.ZodObject<{
    txHash: z.ZodString;
    operation: z.ZodNativeEnum<typeof AaveOperation>;
    asset: z.ZodString;
    amount: z.ZodString;
    timestamp: z.ZodNumber;
    interestRateMode: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    operation?: AaveOperation;
    asset?: string;
    amount?: string;
    interestRateMode?: number;
    txHash?: string;
    timestamp?: number;
}, {
    operation?: AaveOperation;
    asset?: string;
    amount?: string;
    interestRateMode?: number;
    txHash?: string;
    timestamp?: number;
}>;
/**
 * Execute failure result schema
 */
export declare const executeFailSchema: z.ZodObject<{
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>;
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type PrecheckSuccess = z.infer<typeof precheckSuccessSchema>;
export type PrecheckFail = z.infer<typeof precheckFailSchema>;
export type ExecuteSuccess = z.infer<typeof executeSuccessSchema>;
export type ExecuteFail = z.infer<typeof executeFailSchema>;
//# sourceMappingURL=schemas.d.ts.map