/**
 * Example: Morpho Vault Discovery
 * 
 * This example demonstrates how to use the new Morpho vault discovery functions
 * to find and filter vaults dynamically instead of using hardcoded addresses.
 */

import {
  getBestVaultsForAsset,
  getTopVaultsByApy,
  getTopVaultsByTvl,
  searchVaults,
  getVaultsByChain,
  getTopVaultAddresses,
  getVaultAddressForAsset,
  CHAIN_IDS,
} from '../dist/lib/helpers/index.js';

async function demonstrateVaultDiscovery() {
  console.log('🔍 Morpho Vault Discovery Examples\n');

  try {
    // Example 1: Get best WETH vaults
    console.log('📊 Example 1: Best WETH Vaults');
    const wethVaults = await getBestVaultsForAsset('WETH', 3);
    console.log(`Found ${wethVaults.length} WETH vaults:`);
    wethVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} (${vault.symbol})`);
      console.log(`     Address: ${vault.address}`);
      console.log(`     Chain: ${vault.chain.network} (${vault.chain.id})`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%`);
      console.log(`     TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
      console.log(`     Asset: ${vault.asset.symbol} (${vault.asset.address})`);
      console.log('');
    });

    // Example 2: Get top vaults by APY
    console.log('📈 Example 2: Top Vaults by APY');
    const topApyVaults = await getTopVaultsByApy(3, 50000); // min $50k TVL
    console.log(`Found ${topApyVaults.length} high APY vaults:`);
    topApyVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} - ${vault.metrics.apy.toFixed(2)}% APY`);
      console.log(`     Asset: ${vault.asset.symbol}, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
    });
    console.log('');

    // Example 3: Get top vaults by TVL
    console.log('💰 Example 3: Top Vaults by TVL');
    const topTvlVaults = await getTopVaultsByTvl(3);
    console.log(`Found ${topTvlVaults.length} highest TVL vaults:`);
    topTvlVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} - $${vault.metrics.totalAssetsUsd.toLocaleString()} TVL`);
      console.log(`     Asset: ${vault.asset.symbol}, APY: ${vault.metrics.apy.toFixed(2)}%`);
    });
    console.log('');

    // Example 4: Search vaults
    console.log('🔎 Example 4: Search for USDC vaults');
    const usdcVaults = await searchVaults('USDC', 3);
    console.log(`Found ${usdcVaults.length} USDC-related vaults:`);
    usdcVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} (${vault.asset.symbol})`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
    });
    console.log('');

    // Example 5: Get vaults by chain (Base)
    console.log('🌐 Example 5: Vaults on Base Chain');
    const baseVaults = await getVaultsByChain(CHAIN_IDS.base, {
      limit: 3,
      sortBy: 'totalAssetsUsd',
      sortOrder: 'desc',
      excludeIdle: true,
    });
    console.log(`Found ${baseVaults.length} vaults on Base:`);
    baseVaults.forEach((vault, index) => {
      console.log(`  ${index + 1}. ${vault.name} (${vault.asset.symbol})`);
      console.log(`     APY: ${vault.metrics.apy.toFixed(2)}%, TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
    });
    console.log('');

    // Example 6: Get dynamic vault address for testing
    console.log('🎯 Example 6: Dynamic Vault Address Discovery');
    try {
      const wethVaultAddress = await getVaultAddressForAsset('WETH', 'base');
      console.log(`Best WETH vault on Base: ${wethVaultAddress}`);
      
      const usdcVaultAddress = await getVaultAddressForAsset('USDC', 'base');
      console.log(`Best USDC vault on Base: ${usdcVaultAddress}`);
    } catch (error) {
      console.log(`Error getting vault addresses: ${error.message}`);
    }
    console.log('');

    // Example 7: Get top vault addresses for a chain
    console.log('📍 Example 7: Top Vault Addresses on Base');
    const topBaseAddresses = await getTopVaultAddresses('base', 3);
    console.log(`Top 3 vault addresses on Base:`);
    topBaseAddresses.forEach((address, index) => {
      console.log(`  ${index + 1}. ${address}`);
    });

  } catch (error) {
    console.error('❌ Error during vault discovery:', error.message);
    console.error('   Make sure you have internet connectivity to access the Morpho API');
  }
}

// Run the demonstration
demonstrateVaultDiscovery();