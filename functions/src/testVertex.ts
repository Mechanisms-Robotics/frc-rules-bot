import * as path from 'path';
import * as fs from 'fs';

// Load the runtime config for local testing
const configPath = path.resolve(__dirname, '../.runtimeconfig.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Flatten the nested config structure from .runtimeconfig.json
  process.env.VERTEX_PROJECT_ID = config.vertex?.project_id;
  process.env.VERTEX_LOCATION = config.vertex?.location;
  process.env.VERTEX_COLLECTION_ID = config.vertex?.collection_id;
  process.env.VERTEX_DATA_STORE_ID = config.vertex?.data_store_id;
} else {
    console.warn("No .runtimeconfig.json found. Ensure environment variables are set.");
}

async function run() {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const dataStoreId = process.env.VERTEX_DATA_STORE_ID;
  const collectionId = process.env.VERTEX_COLLECTION_ID || 'default_collection';
  const location = process.env.VERTEX_LOCATION || 'global';

  console.log("Configuration:");
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Location: ${location}`);
  console.log(`  Collection ID: ${collectionId}`);
  console.log(`  Data Store ID: ${dataStoreId}`);

  if (!projectId || !dataStoreId) {
    console.error("Missing configuration!");
    return;
  }

  console.log("\nQuerying: 'What are the rules for bumpers?'...");
  try {
    // Access the private client to get the raw response for debugging
    // This requires a bit of a hack or modifying the service, but let's just use the service public method first
    // and maybe add a log inside the service if needed.
    // Actually, let's just log the 'service.search' result.
    // Wait, the service formats the string. I want the raw JSON.
    const { SearchServiceClient } = require('@google-cloud/discoveryengine');
    const client = new SearchServiceClient();
    const projectPath = `projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dataStoreId}`;
    const servingConfig = `${projectPath}/servingConfigs/default_config`;

    const request = {
      servingConfig: servingConfig,
      query: "What are the rules for bumpers?",
      pageSize: 5,
      contentSearchSpec: {
        summarySpec: {
          summaryResultCount: 5,
          ignoreAdversarialQuery: true,
          includeCitations: true,
          modelSpec: {
            version: 'stable',
          },
        },
        snippetSpec: {
          returnSnippet: true,
        },
      },
    };

    console.log("Sending Request:", JSON.stringify(request, null, 2));
    const [response] = await client.search(request);
    console.log("\n--- RAW RESPONSE ---\n");
    console.log("Results found:", response.results?.length || 0);
    // console.log("Summary Text:", response.summary?.summaryText); 
    // Commented out to avoid crash if summary is missing, just checking results first
    if (response.results?.length > 0) {
        console.log("First Result:", JSON.stringify(response.results[0], null, 2));
    } else {
        console.log("Full Response:", JSON.stringify(response, null, 2));
    }


  } catch (error) {
    console.error("\n--- ERROR ---\
");
    console.error(error);
  }
}

run();
