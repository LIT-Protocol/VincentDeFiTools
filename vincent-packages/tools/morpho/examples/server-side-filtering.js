const { getVaults } = require("../dist/lib/helpers");

async function testServerSideFiltering() {
  console.log("🔍 Testing Server-Side GraphQL Filtering\n");

  try {
    // Test 1: Chain filtering (applied server-side via GraphQL)
    console.log("📊 Test 1: Chain filtering (Base network)");
    const baseVaults = await getVaults({
      chainId: 8453, // Base
      limit: 3,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc"
    });
    console.log(`Found ${baseVaults.length} vaults on Base:`);
    baseVaults.forEach((vault, i) => {
      console.log(`  ${i + 1}. ${vault.name} (${vault.symbol})`);
      console.log(`     Chain: ${vault.chain.network} (${vault.chain.id})`);
      console.log(`     Asset: ${vault.asset.symbol}`);
      console.log(`     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%`);
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: Asset filtering (applied server-side via GraphQL)
    console.log("📊 Test 2: Asset filtering (WETH vaults)");
    const wethVaults = await getVaults({
      assetSymbol: "WETH",
      limit: 3,
      sortBy: "apy",
      sortOrder: "desc"
    });
    console.log(`Found ${wethVaults.length} WETH vaults:`);
    wethVaults.forEach((vault, i) => {
      console.log(`  ${i + 1}. ${vault.name} (${vault.symbol})`);
      console.log(`     Chain: ${vault.chain.network} (${vault.chain.id})`);
      console.log(`     Asset: ${vault.asset.symbol}`);
      console.log(`     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%`);
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 3: Whitelisted filtering (applied server-side via GraphQL)
    console.log("📊 Test 3: Whitelisted vaults only");
    const whitelistedVaults = await getVaults({
      whitelistedOnly: true,
      limit: 3,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc"
    });
    console.log(`Found ${whitelistedVaults.length} whitelisted vaults:`);
    whitelistedVaults.forEach((vault, i) => {
      console.log(`  ${i + 1}. ${vault.name} (${vault.symbol})`);
      console.log(`     Chain: ${vault.chain.network} (${vault.chain.id})`);
      console.log(`     Asset: ${vault.asset.symbol}`);
      console.log(`     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      console.log(`     Whitelisted: ${vault.whitelisted}`);
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 4: Combined filtering (server-side via GraphQL)
    console.log("📊 Test 4: Combined filtering (USDC on Base, min APY 2%)");
    const combinedVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: 8453, // Base
      minApy: 2.0, // Applied server-side via GraphQL VaultFilters
      minTvl: 100000, // Applied server-side via GraphQL VaultFilters
      limit: 5
    });
    console.log(`Found ${combinedVaults.length} USDC vaults on Base with >2% APY:`);
    combinedVaults.forEach((vault, i) => {
      console.log(`  ${i + 1}. ${vault.name} (${vault.symbol})`);
      console.log(`     Chain: ${vault.chain.network} (${vault.chain.id})`);
      console.log(`     Asset: ${vault.asset.symbol}`);
      console.log(`     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%`);
    });

    console.log("\n✅ Server-side filtering tests completed successfully!");
    console.log("🚀 Performance maximized with GraphQL VaultFilters server-side filtering");

  } catch (error) {
    console.error("❌ Error testing server-side filtering:", error);
  }
}

testServerSideFiltering();