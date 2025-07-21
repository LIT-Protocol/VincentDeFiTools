# DeBridge Vincent Tool

Cross-chain token bridging tool using the DeBridge Protocol, designed for the Vincent Scaffold SDK and Lit Actions execution environment.

## Overview

The DeBridge tool enables seamless cross-chain token transfers between supported blockchain networks. It integrates with the DeBridge Protocol to provide secure and efficient bridging capabilities for both native tokens (ETH, MATIC, etc.) and ERC-20 tokens.

## Key Features

- **Cross-chain transfers** between multiple EVM-compatible chains
- **Support for native tokens and ERC-20 tokens**
- **Automatic quote fetching** from DeBridge API
- **Gas estimation and fee calculation**
- **Token approval validation** for ERC-20 transfers

## Supported Chains

The tool supports bridging between the following chains:
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)
- BSC (Chain ID: 56)
- Avalanche (Chain ID: 43114)

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rpcUrl` | string | Yes | RPC URL for the source chain |
| `sourceChain` | string | Yes | Source chain ID (e.g., '1' for Ethereum, '8453' for Base) |
| `destinationChain` | string | Yes | Destination chain ID |
| `sourceToken` | string | Yes | Source token address (use `0x0000000000000000000000000000000000000000` for native token) |
| `destinationToken` | string | Yes | Destination token address (use `0x0000000000000000000000000000000000000000` for native token) |
| `amount` | string | Yes | **Amount in base units with no decimals** (wei for ETH, smallest unit for tokens) |
| `recipientAddress` | string | Yes | Recipient address on destination chain |
| `operation` | string | Yes | Operation type: `BRIDGE` or `BRIDGE_AND_SWAP` |
| `slippageBps` | number | No | Slippage tolerance in basis points (default: 100 = 1%) |

## Important: Amount Parameter

⚠️ **The `amount` parameter must be provided in the token's base unit without any decimal places.**

- For ETH: Use wei (1 ETH = 1000000000000000000 wei)
- For tokens: Use the smallest unit based on the token's decimals
- Do NOT use decimal numbers like "1.5" or "0.001"

### Examples:
- To bridge 1 ETH: `amount: "1000000000000000000"`
- To bridge 0.1 ETH: `amount: "100000000000000000"`
- To bridge 1000 USDC (6 decimals): `amount: "1000000000"`
- To bridge 50 DAI (18 decimals): `amount: "50000000000000000000"`

## Usage Example

```javascript
const bridgeParams = {
  rpcUrl: "https://mainnet.infura.io/v3/YOUR_API_KEY",
  sourceChain: "1",              // Ethereum
  destinationChain: "8453",      // Base
  sourceToken: "0x0000000000000000000000000000000000000000", // Native ETH
  destinationToken: "0x0000000000000000000000000000000000000000", // Native ETH on Base
  amount: "100000000000000000",  // 0.1 ETH in wei
  recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD7e",
  operation: "BRIDGE",
  slippageBps: 100               // 1% slippage
};
```

## Precheck Phase

Before execution, the tool performs several validation checks:

1. **Chain validation**: Verifies source and destination chains are supported
2. **Address validation**: Ensures all addresses are valid Ethereum addresses
3. **Balance check**: Confirms sufficient balance for the transfer
4. **Approval check**: For ERC-20 tokens, verifies token approval to DeBridge contract
5. **Quote fetching**: Gets current rates and fees from DeBridge API

## Execute Phase

During execution, the tool:

1. Re-validates token approvals (for ERC-20)
2. Creates the bridge order through DeBridge API
3. Signs the transaction using the PKP
4. Broadcasts the transaction to the source chain
5. Returns the transaction hash and order ID

## Error Handling

Common errors and their meanings:

- **"Insufficient balance"**: The PKP doesn't have enough tokens for the transfer
- **"Insufficient token allowance"**: ERC-20 token needs approval to DeBridge contract
- **"Invalid amount format"**: Amount must be a string representing an integer (no decimals)
- **"Source and destination chains must be different"**: Cannot bridge to the same chain

## Token Approvals

For ERC-20 token bridges, you must first approve the DeBridge contract to spend your tokens. Use the Vincent ERC-20 approval tool before attempting to bridge ERC-20 tokens.

## Transaction Monitoring

After a successful bridge:
- Use the returned `txHash` to monitor the source chain transaction
- Use the `orderId` to track the bridge status on DeBridge
- Expect destination chain delivery within the estimated execution time (typically 3-10 minutes)

## Security Considerations

- The tool validates all inputs to prevent invalid transactions
- Gas estimates include a safety buffer to ensure transaction success
- Slippage protection prevents unfavorable rates
- All transactions are signed within the secure Lit Actions environment

## Integration Examples

### Basic ETH Bridge

```javascript
import { getVincentToolClient } from "@lit-protocol/vincent-app-sdk";
import { bundledVincentTool as deBridgeTool } from "@lit-protocol/vincent-tool-debridge";
import { ethers } from "ethers";

// Initialize the tool client
const deBridgeToolClient = getVincentToolClient({
  bundledVincentTool: deBridgeTool,
  ethersSigner: yourSigner, // Your ethers signer
});

// Bridge 0.1 ETH from Base to Arbitrum
const bridgeParams = {
  rpcUrl: "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY",
  sourceChain: "8453",       // Base
  destinationChain: "42161", // Arbitrum
  sourceToken: "0x0000000000000000000000000000000000000000",      // Native ETH
  destinationToken: "0x0000000000000000000000000000000000000000", // Native ETH
  amount: ethers.utils.parseEther("0.1").toString(), // 0.1 ETH in wei
  recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD7e",
  operation: "BRIDGE",
  slippageBps: 100, // 1% slippage
};

// Step 1: Precheck
const precheckRes = await deBridgeToolClient.precheck(bridgeParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (precheckRes.success) {
  console.log("Estimated fees:", precheckRes.result.data.estimatedFees.protocolFee);
  console.log("Estimated destination amount:", precheckRes.result.data.estimatedDestinationAmount);
  
  // Step 2: Execute
  const executeRes = await deBridgeToolClient.execute(bridgeParams, {
    delegatorPkpEthAddress: pkpAddress,
  });
  
  if (executeRes.success) {
    console.log("Bridge transaction hash:", executeRes.result.data.txHash);
    console.log("Order ID:", executeRes.result.data.orderId);
  }
}
```

### Bridge and Swap (USDT to USDC)

```javascript
// Bridge USDT from Base to USDC on Arbitrum
const bridgeSwapParams = {
  rpcUrl: sourceRpcUrl,
  sourceChain: "8453",     // Base
  destinationChain: "42161", // Arbitrum
  sourceToken: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",   // USDT on Base
  destinationToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
  amount: ethers.utils.parseUnits("10", 6).toString(), // 10 USDT (6 decimals)
  recipientAddress: recipientAddress,
  operation: "BRIDGE_AND_SWAP",
  slippageBps: 300, // 3% slippage for swap operations
};

// Execute bridge and swap
const result = await deBridgeToolClient.execute(bridgeSwapParams, {
  delegatorPkpEthAddress: pkpAddress,
});
```

### Complete Integration Flow with Approvals

```javascript
// For ERC-20 tokens, first approve the DeBridge contract
import { bundledVincentTool as erc20ApproveTool } from "@lit-protocol/vincent-tool-erc20-approval";

const approveToolClient = getVincentToolClient({
  bundledVincentTool: erc20ApproveTool,
  ethersSigner: yourSigner,
});

// DeBridge contract addresses by chain
const DEBRIDGE_CONTRACTS = {
  "8453": "0x663dc15d3c1ac63ff12e45ab68fea3f0a883c251", // Base
  "1": "0x663dc15d3c1ac63ff12e45ab68fea3f0a883c251",    // Ethereum
  // Add other chains as needed
};

// Step 1: Approve token
const approveParams = {
  rpcUrl: sourceRpcUrl,
  chainId: 8453, // Base
  spenderAddress: DEBRIDGE_CONTRACTS["8453"],
  tokenAddress: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // USDT
  tokenDecimals: 6,
  tokenAmount: 10.5, // Include extra for potential fees
};

await approveToolClient.execute(approveParams, {
  delegatorPkpEthAddress: pkpAddress,
});

// Step 2: Bridge the approved tokens
// ... use bridge params from above
```

### Monitoring Bridge Progress

```javascript
// After successful bridge execution
const txHash = executeRes.result.data.txHash;
const orderId = executeRes.result.data.orderId;

// Monitor source chain transaction
const sourceProvider = new ethers.providers.JsonRpcProvider(sourceRpcUrl);
const receipt = await sourceProvider.waitForTransaction(txHash, 2); // 2 confirmations

// Poll destination chain for balance arrival
const destProvider = new ethers.providers.JsonRpcProvider(destRpcUrl);
const pollInterval = 10000; // 10 seconds
const maxPollTime = 600000; // 10 minutes

const startTime = Date.now();
while (Date.now() - startTime < maxPollTime) {
  const balance = await destProvider.getBalance(recipientAddress);
  // Check if balance increased
  if (balance.gt(previousBalance)) {
    console.log("Bridge successful! New balance:", ethers.utils.formatEther(balance));
    break;
  }
  await new Promise(resolve => setTimeout(resolve, pollInterval));
}
```

## Development

To build the tool:
```bash
npm run build
```

To deploy to Lit Protocol:
```bash
npm run action:deploy
```