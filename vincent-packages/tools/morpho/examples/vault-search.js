import {
  getVaults,
  CHAIN_IDS,
  getTokenAddress,
} from "../dist/lib/helpers/index.js";

async function demonstrateUnifiedVaultSearch() {
  console.log("🔧 Unified Vault Search Examples\n");

  try {
    // Example 1: Get vaults by chain (replaces getVaultsByChain)
    console.log("📍 Example 1: Vaults on Base Chain");
    const baseVaults = await getVaults({
      chainId: CHAIN_IDS.base,
      limit: 100,
      excludeIdle: true,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
    });

    console.log(`Found ${baseVaults.length} vaults on Base:`);
    baseVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} (${vault.asset.symbol})`);
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${vault.metrics.apy.toFixed(
          2
        )}%`
      );
    });
    console.log("");

    // Example 2: Get vaults by asset (replaces getVaultsByAsset)
    console.log("💰 Example 2: WETH Vaults Across All Chains");
    const wethAddress = getTokenAddress("WETH", CHAIN_IDS.ethereum); // Get any WETH address for symbol search
    const wethVaults = await getVaults({
      assetSymbol: "WETH", // More flexible than address
      limit: 50,
      excludeIdle: true,
      sortBy: "apy",
      sortOrder: "desc",
    });

    console.log(`Found ${wethVaults.length} WETH vaults:`);
    wethVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} on ${vault.chain.network}`);
      console.log(
        `     APY: ${vault.metrics.apy.toFixed(
          2
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`
      );
    });
    console.log("");

    // Example 3: Combined asset + chain filtering
    console.log("🎯 Example 3: USDC Vaults on Arbitrum");
    const usdcArbitrumVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: CHAIN_IDS.arbitrum,
      limit: 3,
      excludeIdle: true,
      sortBy: "apy",
      sortOrder: "desc",
    });

    console.log(`Found ${usdcArbitrumVaults.length} USDC vaults on Arbitrum:`);
    usdcArbitrumVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name}`);
      console.log(
        `     APY: ${vault.metrics.apy.toFixed(
          2
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`
      );
    });
    console.log("");

    // Example 4: Advanced filtering - High APY vaults with minimum TVL
    console.log("🏆 Example 4: High-Yield Vaults (>5% APY, >$1M TVL)");
    const highYieldVaults = await getVaults({
      minApy: 5.0,
      minTvl: 1000000, // $1M minimum TVL
      excludeIdle: true,
      sortBy: "apy",
      sortOrder: "desc",
      limit: 5,
    });

    console.log(`Found ${highYieldVaults.length} high-yield vaults:`);
    highYieldVaults.forEach((vault, index) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${
          vault.chain.network
        }`
      );
      console.log(
        `     APY: ${vault.metrics.apy.toFixed(
          2
        )}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`
      );
    });
    console.log("");

    // Example 5: Multiple asset types on specific chain
    console.log("🔗 Example 5: USDC and WETH Vaults on Base");
    const [usdcBase, wethBase] = await Promise.all([
      getVaults({
        assetSymbol: "USDC",
        chainId: CHAIN_IDS.base,
        limit: 2,
        excludeIdle: true,
        sortBy: "apy",
        sortOrder: "desc",
      }),
      getVaults({
        assetSymbol: "WETH",
        chainId: CHAIN_IDS.base,
        limit: 2,
        excludeIdle: true,
        sortBy: "apy",
        sortOrder: "desc",
      }),
    ]);

    console.log("Best USDC vaults on Base:");
    usdcBase.forEach((vault, index) => {
      console.log(
        `  ${index + 1}. ${vault.name} - ${vault.metrics.apy.toFixed(2)}% APY`
      );
    });

    console.log("Best WETH vaults on Base:");
    wethBase.forEach((vault, index) => {
      console.log(
        `  ${index + 1}. ${vault.name} - ${vault.metrics.apy.toFixed(2)}% APY`
      );
    });
    console.log("");

    // Example 6: Whitelisted vaults only
    console.log("✅ Example 6: Whitelisted Vaults Only");
    const whitelistedVaults = await getVaults({
      whitelistedOnly: true,
      excludeIdle: true,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit: 5,
    });

    console.log(`Found ${whitelistedVaults.length} whitelisted vaults:`);
    whitelistedVaults.forEach((vault, index) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${
          vault.chain.network
        }`
      );
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${vault.metrics.apy.toFixed(
          2
        )}%`
      );
    });
    console.log("");

    // Example 7: TVL range filtering
    console.log("📊 Example 7: Medium-sized Vaults ($100K - $10M TVL)");
    const mediumVaults = await getVaults({
      minTvl: 100000, // $100K minimum
      maxTvl: 10000000, // $10M maximum
      excludeIdle: true,
      sortBy: "apy",
      sortOrder: "desc",
      limit: 5,
    });

    console.log(`Found ${mediumVaults.length} medium-sized vaults:`);
    mediumVaults.forEach((vault, index) => {
      console.log(
        `  ${index + 1}. ${vault.name} (${vault.asset.symbol}) on ${
          vault.chain.network
        }`
      );
      console.log(
        `     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}, APY: ${vault.metrics.apy.toFixed(
          2
        )}%`
      );
    });
    console.log("");

    // Example 8: Multi-chain comparison for same asset
    console.log("⚡ Example 8: USDC Vault APY Comparison Across Chains");
    const chainsToCompare = [
      CHAIN_IDS.ethereum,
      CHAIN_IDS.base,
      CHAIN_IDS.arbitrum,
    ];

    for (const chainId of chainsToCompare) {
      const chainName = Object.keys(CHAIN_IDS).find(
        (key) => CHAIN_IDS[key] === chainId
      );
      const bestUsdcVault = await getVaults({
        assetSymbol: "USDC",
        chainId,
        limit: 1,
        excludeIdle: true,
        sortBy: "apy",
        sortOrder: "desc",
      });

      if (bestUsdcVault.length > 0) {
        const vault = bestUsdcVault[0];
        console.log(
          `  ${chainName}: ${vault.metrics.apy.toFixed(2)}% APY (${vault.name})`
        );
      } else {
        console.log(`  ${chainName}: No USDC vaults found`);
      }
    }
  } catch (error) {
    console.error("❌ Error during unified vault search:", error.message);
    console.error(
      "   Make sure you have internet connectivity to access the Morpho API"
    );
  }
}

// Run the demonstration
demonstrateUnifiedVaultSearch();
