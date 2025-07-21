import "@lit-protocol/vincent-tool-sdk/internal";
import { MorphoOperation } from "./schemas";
export declare const vincentTool: import("@lit-protocol/vincent-tool-sdk").VincentTool<import("zod").ZodObject<{
    operation: import("zod").ZodNativeEnum<typeof MorphoOperation>;
    vaultAddress: import("zod").ZodString;
    amount: import("zod").ZodEffects<import("zod").ZodString, string, string>;
    onBehalfOf: import("zod").ZodOptional<import("zod").ZodString>;
    chain: import("zod").ZodString;
    rpcUrl: import("zod").ZodOptional<import("zod").ZodString>;
    alchemyGasSponsor: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodBoolean>>;
    alchemyGasSponsorApiKey: import("zod").ZodOptional<import("zod").ZodString>;
    alchemyGasSponsorPolicyId: import("zod").ZodOptional<import("zod").ZodString>;
}, "strip", import("zod").ZodTypeAny, {
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
}>, string, import("@lit-protocol/vincent-tool-sdk/internal").ToolPolicyMap<readonly [], never>, {}, import("zod").ZodObject<{
    txHash: import("zod").ZodString;
    operation: import("zod").ZodNativeEnum<typeof MorphoOperation>;
    vaultAddress: import("zod").ZodString;
    amount: import("zod").ZodString;
    timestamp: import("zod").ZodNumber;
}, "strip", import("zod").ZodTypeAny, {
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
}>, import("zod").ZodObject<{
    error: import("zod").ZodString;
}, "strip", import("zod").ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>, import("zod").ZodObject<{
    operationValid: import("zod").ZodBoolean;
    vaultValid: import("zod").ZodBoolean;
    amountValid: import("zod").ZodBoolean;
    userBalance: import("zod").ZodOptional<import("zod").ZodString>;
    allowance: import("zod").ZodOptional<import("zod").ZodString>;
    vaultShares: import("zod").ZodOptional<import("zod").ZodString>;
    estimatedGas: import("zod").ZodOptional<import("zod").ZodNumber>;
}, "strip", import("zod").ZodTypeAny, {
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
}>, import("zod").ZodObject<{
    error: import("zod").ZodString;
}, "strip", import("zod").ZodTypeAny, {
    error?: string;
}, {
    error?: string;
}>>;
//# sourceMappingURL=vincent-tool.d.ts.map