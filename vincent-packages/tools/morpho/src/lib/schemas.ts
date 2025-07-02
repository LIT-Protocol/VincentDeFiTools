import { z } from "zod";

/**
 * Morpho operation types
 */
export enum MorphoOperation {
  SUPPLY = "supply",
  WITHDRAW = "withdraw",
  BORROW = "borrow",
  REPAY = "repay",
}

/**
 * Tool parameters schema - defines the input parameters for the Morpho tool
 */
export const toolParamsSchema = z.object({
  operation: z.nativeEnum(MorphoOperation),
  asset: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
  amount: z
    .string()
    .regex(/^\d*\.?\d+$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  onBehalfOf: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address")
    .optional(),
  chain: z.string(),
  rpcUrl: z.string().optional(),
});

/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
  operationValid: z.boolean(),
  assetValid: z.boolean(),
  amountValid: z.boolean(),
  userBalance: z.string().optional(),
  allowance: z.string().optional(),
  borrowCapacity: z.string().optional(),
  estimatedGas: z.number().optional(),
});

/**
 * Precheck failure result schema
 */
export const precheckFailSchema = z.object({
  error: z.string(),
});

/**
 * Execute success result schema
 */
export const executeSuccessSchema = z.object({
  txHash: z.string(),
  operation: z.nativeEnum(MorphoOperation),
  asset: z.string(),
  amount: z.string(),
  timestamp: z.number(),
});

/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
  error: z.string(),
});

// Type exports
export type ToolParams = z.infer<typeof toolParamsSchema>;
export type PrecheckSuccess = z.infer<typeof precheckSuccessSchema>;
export type PrecheckFail = z.infer<typeof precheckFailSchema>;
export type ExecuteSuccess = z.infer<typeof executeSuccessSchema>;
export type ExecuteFail = z.infer<typeof executeFailSchema>;