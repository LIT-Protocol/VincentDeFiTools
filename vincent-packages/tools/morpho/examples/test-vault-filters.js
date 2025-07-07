async function testVaultFilters() {
  const apiUrl = "https://blue-api.morpho.org/graphql";

  // Try to get VaultFilters type information
  const filtersIntrospectionQuery = `
    query {
      __type(name: "VaultFilters") {
        name
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;

  try {
    console.log("🔍 Testing VaultFilters Schema\n");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: filtersIntrospectionQuery,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.log("❌ GraphQL Errors:", data.errors);
      return;
    }

    if (data.data.__type) {
      console.log("📊 VaultFilters input fields:");
      data.data.__type.inputFields.forEach(field => {
        const typeName = field.type.name || field.type.ofType?.name || field.type.kind;
        console.log(`  - ${field.name}: ${typeName}`);
      });
    } else {
      console.log("❌ VaultFilters type not found");
    }

    // Let's also try some basic vault queries with different filter attempts
    console.log("\n🧪 Testing basic vault queries...\n");

    // Test 1: Basic query without filters
    const basicQuery = `
      query {
        vaults(first: 2) {
          items {
            address
            symbol
            whitelisted
            chain { id }
            asset { symbol }
          }
        }
      }
    `;

    const basicResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: basicQuery }),
    });

    const basicData = await basicResponse.json();
    
    if (basicData.errors) {
      console.log("❌ Basic query errors:", basicData.errors);
    } else {
      console.log("✅ Basic query successful - found", basicData.data.vaults.items.length, "vaults");
      basicData.data.vaults.items.forEach((vault, i) => {
        console.log(`  ${i + 1}. ${vault.symbol} (${vault.asset.symbol}) on chain ${vault.chain.id}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testVaultFilters();