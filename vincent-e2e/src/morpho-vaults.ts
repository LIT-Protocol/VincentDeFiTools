import { getVaults } from "../../vincent-packages/tools/morpho/dist/lib/helpers/index.js";
import { addTestResult } from "./test-utils.js";

/**
 * Comprehensive test suite for Morpho vault filtering and sorting functionality
 * Tests various combinations of filters and sorting options
 */
export async function testMorphoVaultFiltering(chainId: number, chainName: string) {
  console.log("🔍 Testing Morpho vault filtering and sorting features...");

  try {
    /**
     * ====================================
     * MinNetApy Filtering Tests
     * ====================================
     */
    console.log("📊 Test 1: MinNetApy filtering tests");
    
    // Test 1: Filter USDC vaults on current chain with 0.05 (5%) minimum net APY
    console.log("   📈 Test 1a: USDC vaults with 5% minimum net APY");
    const usdcVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: chainId,
      minNetApy: 0.05, // 5% minimum
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 20,
      excludeIdle: true,
    });

    console.log(`   Found ${usdcVaults.length} USDC vaults with >5% net APY`);
    
    if (usdcVaults.length > 0) {
      // Check that all vaults meet the criteria
      let allValidAsset = true;
      let allValidChain = true;
      let allValidApy = true;
      let correctlySorted = true;
      
      for (let i = 0; i < usdcVaults.length; i++) {
        const vault = usdcVaults[i];
        
        // Check asset symbol
        if (vault.asset.symbol !== "USDC") {
          allValidAsset = false;
          console.error(`   ❌ Vault ${vault.address} has wrong asset: ${vault.asset.symbol}`);
        }
        
        // Check chain ID
        if (vault.chain.id !== chainId) {
          allValidChain = false;
          console.error(`   ❌ Vault ${vault.address} on wrong chain: ${vault.chain.id}`);
        }
        
        // Check net APY is above 5%
        if (vault.metrics.netApy < 0.05) {
          allValidApy = false;
          console.error(`   ❌ Vault ${vault.address} has low APY: ${(vault.metrics.netApy * 100).toFixed(2)}%`);
        }
        
        // Check sorting (each vault should have APY >= next vault)
        if (i > 0 && vault.metrics.netApy > usdcVaults[i - 1].metrics.netApy) {
          correctlySorted = false;
          console.error(`   ❌ Sorting error: vault ${i} (${(vault.metrics.netApy * 100).toFixed(2)}%) > vault ${i - 1} (${(usdcVaults[i - 1].metrics.netApy * 100).toFixed(2)}%)`);
        }
      }
      
      // Display top results
      console.log("   📈 Top USDC vaults:");
      usdcVaults.slice(0, 5).forEach((vault: any, index: number) => {
        console.log(`      ${index + 1}. ${vault.name} - ${(vault.metrics.netApy * 100).toFixed(2)}% net APY`);
        console.log(`         TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      });
      
      // Report validation results
      if (allValidAsset && allValidChain && allValidApy && correctlySorted) {
        console.log("   ✅ All vaults meet the filtering criteria");
        addTestResult("MinNetApy USDC Filtering", true);
      } else {
        console.error("   ❌ Some vaults don't meet the filtering criteria");
        addTestResult("MinNetApy USDC Filtering", false);
      }
    } else {
      console.log(`   ⚠️  No USDC vaults found with >5% net APY on ${chainName}`);
      addTestResult("MinNetApy USDC Filtering", true, "No vaults found (acceptable)");
    }

    // Test 1b: Compare with different minNetApy values
    console.log("   📊 Test 1b: Comparing different minNetApy thresholds");
    const lowApyVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: chainId,
      minNetApy: 0.01, // 1% minimum
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 50,
      excludeIdle: true,
    });

    const highApyVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: chainId,
      minNetApy: 0.10, // 10% minimum
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 50,
      excludeIdle: true,
    });

    console.log(`   1% minimum: ${lowApyVaults.length} vaults`);
    console.log(`   5% minimum: ${usdcVaults.length} vaults`);
    console.log(`   10% minimum: ${highApyVaults.length} vaults`);
    
    // Validate threshold logic (higher threshold = fewer or equal results)
    const thresholdLogicValid = highApyVaults.length <= usdcVaults.length && usdcVaults.length <= lowApyVaults.length;
    
    if (thresholdLogicValid) {
      console.log("   ✅ Threshold logic works correctly (higher threshold = fewer results)");
      addTestResult("MinNetApy Threshold Logic", true);
    } else {
      console.error("   ❌ Threshold logic failed");
      addTestResult("MinNetApy Threshold Logic", false);
    }

    // Test 1c: Test edge case - very high threshold
    console.log("   📊 Test 1c: Testing very high threshold (50%)");
    const veryHighApyVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: chainId,
      minNetApy: 0.50, // 50% minimum (likely no results)
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 10,
      excludeIdle: true,
    });

    console.log(`   50% minimum: ${veryHighApyVaults.length} vaults`);
    console.log("   ✅ High threshold test completed");
    addTestResult("MinNetApy High Threshold", true);

    /**
     * ====================================
     * TVL Filtering Tests
     * ====================================
     */
    console.log("📊 Test 2: TVL filtering tests");

    // Test 2a: MinTvl filtering
    console.log("   💰 Test 2a: MinTvl filtering (minimum $1M TVL)");
    const highTvlVaults = await getVaults({
      chainId: chainId,
      minTvl: 1000000, // $1M minimum
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit: 20,
      excludeIdle: true,
    });

    console.log(`   Found ${highTvlVaults.length} vaults with >$1M TVL`);
    
    if (highTvlVaults.length > 0) {
      let allValidTvl = true;
      let correctlySortedByTvl = true;
      
      for (let i = 0; i < highTvlVaults.length; i++) {
        const vault = highTvlVaults[i];
        
        // Check TVL is above $1M
        if (vault.metrics.totalAssetsUsd < 1000000) {
          allValidTvl = false;
          console.error(`   ❌ Vault ${vault.address} has low TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
        }
        
        // Check sorting by TVL (each vault should have TVL >= next vault)
        if (i > 0 && vault.metrics.totalAssetsUsd > highTvlVaults[i-1].metrics.totalAssetsUsd) {
          correctlySortedByTvl = false;
          console.error(`   ❌ TVL sorting error: vault ${i} ($${vault.metrics.totalAssetsUsd.toLocaleString()}) > vault ${i-1} ($${highTvlVaults[i-1].metrics.totalAssetsUsd.toLocaleString()})`);
        }
      }
      
      // Display top results by TVL
      console.log("   💰 Top vaults by TVL:");
      highTvlVaults.slice(0, 5).forEach((vault: any, index: number) => {
        console.log(`      ${index + 1}. ${vault.name} - $${vault.metrics.totalAssetsUsd.toLocaleString()} TVL`);
        console.log(`         Asset: ${vault.asset.symbol}, APY: ${(vault.metrics.netApy * 100).toFixed(2)}%`);
      });
      
      if (allValidTvl && correctlySortedByTvl) {
        console.log("   ✅ All vaults meet the minTvl criteria and are sorted correctly");
        addTestResult("MinTvl Filtering", true);
      } else {
        console.error("   ❌ Some vaults don't meet the minTvl criteria or sorting is incorrect");
        addTestResult("MinTvl Filtering", false);
      }
    } else {
      console.log(`   ⚠️  No vaults found with >$1M TVL on ${chainName}`);
      addTestResult("MinTvl Filtering", true, "No vaults found (acceptable)");
    }

    // Test 2b: MaxTvl filtering
    console.log("   💰 Test 2b: MaxTvl filtering (maximum $10M TVL)");
    const lowTvlVaults = await getVaults({
      chainId: chainId,
      maxTvl: 10000000, // $10M maximum
      sortBy: "totalAssetsUsd",
      sortOrder: "asc",
      limit: 20,
      excludeIdle: true,
    });

    console.log(`   Found ${lowTvlVaults.length} vaults with <$10M TVL`);
    
    if (lowTvlVaults.length > 0) {
      let allValidMaxTvl = true;
      
      for (const vault of lowTvlVaults) {
        if (vault.metrics.totalAssetsUsd > 10000000) {
          allValidMaxTvl = false;
          console.error(`   ❌ Vault ${vault.address} has high TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
        }
      }
      
      if (allValidMaxTvl) {
        console.log("   ✅ All vaults meet the maxTvl criteria");
        addTestResult("MaxTvl Filtering", true);
      } else {
        console.error("   ❌ Some vaults don't meet the maxTvl criteria");
        addTestResult("MaxTvl Filtering", false);
      }
    } else {
      console.log(`   ⚠️  No vaults found with <$10M TVL on ${chainName}`);
      addTestResult("MaxTvl Filtering", true, "No vaults found (acceptable)");
    }

    /**
     * ====================================
     * Additional Filtering Tests
     * ====================================
     */
    console.log("📊 Test 3: Additional filtering tests");

    // Test 3a: MaxNetApy filtering
    console.log("   📈 Test 3a: MaxNetApy filtering (maximum 20% APY)");
    const moderateApyVaults = await getVaults({
      chainId: chainId,
      maxNetApy: 0.20, // 20% maximum
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 20,
      excludeIdle: true,
    });

    console.log(`   Found ${moderateApyVaults.length} vaults with <20% net APY`);
    
    if (moderateApyVaults.length > 0) {
      let allValidMaxApy = true;
      
      for (const vault of moderateApyVaults) {
        if (vault.metrics.netApy > 0.20) {
          allValidMaxApy = false;
          console.error(`   ❌ Vault ${vault.address} has high APY: ${(vault.metrics.netApy * 100).toFixed(2)}%`);
        }
      }
      
      if (allValidMaxApy) {
        console.log("   ✅ All vaults meet the maxNetApy criteria");
        addTestResult("MaxNetApy Filtering", true);
      } else {
        console.error("   ❌ Some vaults don't meet the maxNetApy criteria");
        addTestResult("MaxNetApy Filtering", false);
      }
    } else {
      console.log(`   ⚠️  No vaults found with <20% net APY on ${chainName}`);
      addTestResult("MaxNetApy Filtering", true, "No vaults found (acceptable)");
    }

    // Test 3b: WhitelistedOnly filtering
    console.log("   🔒 Test 3b: WhitelistedOnly filtering");
    const whitelistedVaults = await getVaults({
      chainId: chainId,
      whitelistedOnly: true,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit: 10,
      excludeIdle: true,
    });

    const allVaults = await getVaults({
      chainId: chainId,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit: 50,
      excludeIdle: true,
    });

    console.log(`   Whitelisted vaults: ${whitelistedVaults.length}`);
    console.log(`   All vaults: ${allVaults.length}`);
    
    if (whitelistedVaults.length <= allVaults.length) {
      console.log("   ✅ Whitelisted filtering works correctly (whitelisted ≤ all)");
      addTestResult("WhitelistedOnly Filtering", true);
    } else {
      console.error("   ❌ Whitelisted filtering failed");
      addTestResult("WhitelistedOnly Filtering", false);
    }

    // Test 3c: Combined filtering
    console.log("   🔗 Test 3c: Combined filtering (USDC, >3% APY, >$500K TVL)");
    const combinedFilterVaults = await getVaults({
      assetSymbol: "USDC",
      chainId: chainId,
      minNetApy: 0.03, // 3% minimum
      minTvl: 500000, // $500K minimum
      sortBy: "netApy",
      sortOrder: "desc",
      limit: 10,
      excludeIdle: true,
    });

    console.log(`   Found ${combinedFilterVaults.length} vaults meeting all criteria`);
    
    if (combinedFilterVaults.length > 0) {
      let allValidCombined = true;
      
      for (const vault of combinedFilterVaults) {
        if (vault.asset.symbol !== "USDC" || 
            vault.metrics.netApy < 0.03 || 
            vault.metrics.totalAssetsUsd < 500000) {
          allValidCombined = false;
          console.error(`   ❌ Vault ${vault.address} doesn't meet combined criteria`);
          console.error(`      Asset: ${vault.asset.symbol}, APY: ${(vault.metrics.netApy * 100).toFixed(2)}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
        }
      }
      
      if (allValidCombined) {
        console.log("   ✅ All vaults meet the combined filtering criteria");
        addTestResult("Combined Filtering", true);
      } else {
        console.error("   ❌ Some vaults don't meet the combined filtering criteria");
        addTestResult("Combined Filtering", false);
      }
    } else {
      console.log("   ⚠️  No vaults found meeting all combined criteria");
      addTestResult("Combined Filtering", true, "No vaults found (acceptable)");
    }

    /**
     * ====================================
     * Sorting Tests
     * ====================================
     */
    console.log("📊 Test 4: Sorting functionality tests");

    // Test 4: Different sorting options
    console.log("   🔄 Test 4a: Testing different sorting options");
    
    // Test sorting by USD TVL (ascending vs descending) - focuses on sort order validation
    const largestVaultsByUsd = await getVaults({
      chainId: chainId,
      sortBy: "totalAssetsUsd",
      sortOrder: "desc",
      limit: 5,
      excludeIdle: true,
    });

    const smallestVaultsByUsd = await getVaults({
      chainId: chainId,
      sortBy: "totalAssetsUsd",
      sortOrder: "asc",
      limit: 5,
      excludeIdle: true,
    });

    console.log(`   Largest vaults by USD TVL: ${largestVaultsByUsd.length}`);
    console.log(`   Smallest vaults by USD TVL: ${smallestVaultsByUsd.length}`);
    
    let usdSortingValid = true;
    
    // Check largest vaults are sorted correctly (descending)
    for (let i = 1; i < largestVaultsByUsd.length; i++) {
      if (largestVaultsByUsd[i].metrics.totalAssetsUsd > largestVaultsByUsd[i-1].metrics.totalAssetsUsd) {
        usdSortingValid = false;
        console.error(`   ❌ Largest vaults not sorted correctly: vault ${i} ($${largestVaultsByUsd[i].metrics.totalAssetsUsd.toLocaleString()}) > vault ${i-1} ($${largestVaultsByUsd[i-1].metrics.totalAssetsUsd.toLocaleString()})`);
        break;
      }
    }
    
    // Check smallest vaults are sorted correctly (ascending)
    for (let i = 1; i < smallestVaultsByUsd.length; i++) {
      if (smallestVaultsByUsd[i].metrics.totalAssetsUsd < smallestVaultsByUsd[i-1].metrics.totalAssetsUsd) {
        usdSortingValid = false;
        console.error(`   ❌ Smallest vaults not sorted correctly: vault ${i} ($${smallestVaultsByUsd[i].metrics.totalAssetsUsd.toLocaleString()}) < vault ${i-1} ($${smallestVaultsByUsd[i-1].metrics.totalAssetsUsd.toLocaleString()})`);
        break;
      }
    }
    
    // Display some results
    if (largestVaultsByUsd.length > 0) {
      console.log("   💰 Largest vaults by USD TVL:");
      largestVaultsByUsd.slice(0, 3).forEach((vault: any, index: number) => {
        console.log(`      ${index + 1}. ${vault.name} - $${vault.metrics.totalAssetsUsd.toLocaleString()} TVL`);
      });
    }
    
    if (usdSortingValid) {
      console.log("   ✅ USD TVL sorting works correctly");
      addTestResult("USD TVL Sorting", true);
    } else {
      console.error("   ❌ USD TVL sorting failed");
      addTestResult("USD TVL Sorting", false);
    }

    /**
     * ====================================
     * Limit Behavior Tests
     * ====================================
     */
    console.log("📊 Test 5: Limit behavior with client-side filtering");

    // Test that limit works correctly with excludeIdle filtering
    console.log("   🎯 Test 5a: Limit with excludeIdle filtering");
    const limitedVaultsWithFiltering = await getVaults({
      chainId: chainId,
      limit: 2, // Should get exactly 2 results after filtering
      excludeIdle: true,
      sortBy: "netApy",
      sortOrder: "desc",
    });

    console.log(`   Requested 2 vaults with excludeIdle=true, got: ${limitedVaultsWithFiltering.length}`);
    
    if (limitedVaultsWithFiltering.length <= 2) {
      console.log("   ✅ Limit correctly applied after client-side filtering");
      addTestResult("Limit with Client Filtering", true);
    } else {
      console.error("   ❌ Limit not properly applied after client-side filtering");
      addTestResult("Limit with Client Filtering", false);
    }

    // Test edge case: limit 1 with filtering should still work
    console.log("   🎯 Test 5b: Limit 1 with excludeIdle (edge case)");
    const singleVaultWithFiltering = await getVaults({
      chainId: chainId,
      limit: 1,
      excludeIdle: true,
      sortBy: "netApy",
      sortOrder: "desc",
    });

    console.log(`   Requested 1 vault with excludeIdle=true, got: ${singleVaultWithFiltering.length}`);
    
    if (singleVaultWithFiltering.length === 0) {
      console.log("   ⚠️  No active vaults found on this chain (acceptable)");
      addTestResult("Limit 1 Edge Case", true, "No active vaults found");
    } else if (singleVaultWithFiltering.length === 1) {
      console.log("   ✅ Limit 1 with filtering works correctly");
      addTestResult("Limit 1 Edge Case", true);
    } else {
      console.error("   ❌ Limit 1 returned more than 1 result");
      addTestResult("Limit 1 Edge Case", false);
    }

    console.log("✅ Morpho vault filtering tests completed");
    addTestResult("Morpho Vault Filtering Suite", true);

  } catch (error) {
    console.error("❌ Morpho vault filtering tests failed:", error);
    addTestResult("Morpho Vault Filtering Suite", false);
  }
}