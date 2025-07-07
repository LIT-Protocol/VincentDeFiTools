async function testGraphQLSchema() {
  const apiUrl = "https://blue-api.morpho.org/graphql";

  // First, let's try a simple introspection query to see what's available
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          name
          fields {
            name
            args {
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
      }
    }
  `;

  try {
    console.log("🔍 Testing GraphQL Schema for Vaults\n");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: introspectionQuery,
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

    console.log("📊 Available Query Fields:");
    const queryFields = data.data.__schema.queryType.fields;
    
    // Find vault-related queries
    const vaultQueries = queryFields.filter(field => 
      field.name.toLowerCase().includes('vault')
    );
    
    vaultQueries.forEach(field => {
      console.log(`\n🔹 ${field.name}:`);
      field.args.forEach(arg => {
        const typeName = arg.type.name || arg.type.ofType?.name || arg.type.kind;
        console.log(`  - ${arg.name}: ${typeName}`);
      });
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testGraphQLSchema();