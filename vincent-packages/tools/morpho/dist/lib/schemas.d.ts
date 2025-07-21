import { z } from "zod";
/**
 * Morpho Vault operation types
 */
export declare enum MorphoOperation {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    REDEEM = "redeem"
}
/**
 * Tool parameters schema - defines the input parameters for the Morpho tool
 */
export declare const toolParamsSchema: z.ZodObject<{
    operation: z.ZodNativeEnum<typeof MorphoOperation>;
    vaultAddress: z.ZodString;
    amount: z.ZodEffects<z.ZodString, string, string>;
    onBehalfOf: z.ZodOptional<z.ZodString>;
    chain: z.ZodString;
    rpcUrl: z.ZodOptional<z.ZodString>;
    alchemyGasSponsor: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    alchemyGasSponsorApiKey: z.ZodOptional<z.ZodString>;
    alchemyGasSponsorPolicyId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    operation?: MorphoOperation;
    vaultAddress?: string;
    amount?: string;
    onBehalfOf?: string;
    chain?: string;
    rpcUrl?: string;
    alchemyGasSponsor?: boolean;
    alchemyGasSponsorApiKey?: string;
    alchemyGasSponsorPolicyId?: string;
}, {
    operation?: MorphoOperation;
    vaultAddress?: string;
    amount?: string;
    onBehalfOf?: string;
    chain?: string;
    rpcUrl?: string;
    alchemyGasSponsor?: boolean;
    alchemyGasSponsorApiKey?: string;
    alchemyGasSponsorPolicyId?: string;
}>;
/**
 * Precheck success result schema
 */
export declare const precheckSuccessSchema: z.ZodObject<{
    operationValid: z.ZodBoolean;
    vaultValid: z.ZodBoolean;
    amountValid: z.ZodBoolean;
    userBalance: z.ZodOptional<z.ZodString>;
    allowance: z.ZodOptional<z.ZodString>;
    vaultShares: z.ZodOptional<z.ZodString>;
    estimatedGas: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    operationValid?: boolean;
    vaultValid?: boolean;
    amountValid?: boolean;
    userBalance?: string;
    allowance?: string;
    vaultShares?: string;
    estimatedGas?: number;
}, {
    operationValid?: boolean;
    vaultValid?: boolean;
    amountValid?: boolean;
    userBalance?: string;
    allowance?: string;
    vaultShares?: string;
    estimatedGas?: number;
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
    operation: z.ZodNativeEnum<typeof MorphoOperation>;
    vaultAddress: z.ZodString;
    amount: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    operation?: MorphoOperation;
    vaultAddress?: string;
    amount?: string;
    txHash?: string;
    timestamp?: number;
}, {
    operation?: MorphoOperation;
    vaultAddress?: string;
    amount?: string;
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