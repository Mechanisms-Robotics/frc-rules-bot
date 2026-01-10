import { v1beta as discoveryengine } from '@google-cloud/discoveryengine';
const { SearchServiceClient } = discoveryengine;

interface VertexConfig {
  projectId: string;
  location: string;
  collectionId: string;
  dataStoreId: string;
  servingConfigId?: string;
}

export class VertexService {
  private client: discoveryengine.SearchServiceClient;
  private projectPath: string;
  private servingConfig: string;

  constructor(config: VertexConfig) {
    this.client = new SearchServiceClient();
    this.projectPath = `projects/${config.projectId}/locations/${config.location}/collections/${config.collectionId}/dataStores/${config.dataStoreId}`;
    this.servingConfig = `${this.projectPath}/servingConfigs/${config.servingConfigId || 'default_config'}`;
  }

  async search(query: string): Promise<string> {
    const request = {
      servingConfig: this.servingConfig,
      query: query,
      pageSize: 5,
      contentSearchSpec: {
        summarySpec: {
          summaryResultCount: 5,
          ignoreAdversarialQuery: true,
          includeCitations: true,
          modelSpec: {
            version: 'preview',
          },
        },
        snippetSpec: {
          returnSnippet: true,
        },
      },
    };

    try {
      // v1beta client.search returns [SearchResponse, Request, Raw]
      const [response] = (await this.client.search(request as any)) as any;
      
      // Check if response is the SearchResponse object or just the results array
      const results = Array.isArray(response) ? response : response.results;
      const summary = Array.isArray(response) ? null : response.summary;

      if (!summary || !summary.summaryText) {
        if (!results || results.length === 0) {
          return "I couldn't find any specific information about that in the rules.";
        }
        
        return "I found some relevant documents, but I can't generate a specific summary right now. You might find the answer in these files:\n" + 
          results.map((r: any) => {
              const doc = r.document;
              
              // Helper to safely get field from struct or normal object
              const getField = (obj: any, field: string) => {
                  if (!obj) return null;
                  if (obj[field]) return obj[field]; // Normal object
                  if (obj.fields && obj.fields[field]) { // Protobuf struct
                      return obj.fields[field].stringValue || obj.fields[field];
                  }
                  return null;
              };

              const struct = doc.derivedStructData;
              let uri = getField(struct, 'link') || getField(struct, 'uri') || '#';
              let title = getField(struct, 'title');

              // Convert gs:// to https:// link for clickability
              if (uri && uri.startsWith('gs://')) {
                  // uri: gs://bucket/file.pdf -> https://storage.cloud.google.com/bucket/file.pdf
                  const httpLink = uri.replace('gs://', 'https://storage.cloud.google.com/');
                  uri = httpLink;
              }

              // Fallback title
              if (!title || title.startsWith('0')) {
                 if (uri && uri !== '#') {
                     // Extract filename from URL
                     title = uri.split('/').pop();
                     if (title.includes('?')) title = title.split('?')[0]; // Clean query params if any
                 } else {
                     title = doc.name ? doc.name.split('/').pop() : 'Untitled Document';
                 }
              }
              
              return `- <${uri}|${title}>`;
          }).join('\n');
      }

      const summaryText = summary.summaryText || "No summary available.";
      const citations = summary.summaryWithMetadata?.citationMetadata?.citations || [];

      return this.formatAnswerWithCitations(summaryText, citations);
    } catch (error) {
      console.error("Error querying Vertex AI Search:", error);
      return "Sorry, I encountered an error while searching the knowledge base.";
    }
  }

  private formatAnswerWithCitations(summary: string, citations: any[]): string {
    if (!citations || citations.length === 0) {
      return summary;
    }

    // Create a map of citation index to sources
    // Citations in Vertex AI Search are usually 1-indexed references in the text like [1]
    // The citation metadata provides the source for each index.
    
    const references: string[] = [];
    
    citations.forEach((citation, index) => {
        const citationNumber = index + 1;
        if (citation.sources && citation.sources.length > 0) {
            // Usually taking the first source for the citation
            const source = citation.sources[0];
            const uri = source.uri || "#";
            let title = source.title;
            
            // Fallback if title is missing or looks like a hash
            if (!title && uri !== '#') {
                title = uri.split('/').pop();
            }

            references.push(`[${citationNumber}] <${uri}|${title || 'Source'}>`);
        }
    });

    let finalResponse = summary;
    
    if (references.length > 0) {
        finalResponse += "\n\n*Sources:*\n" + references.join("\n");
    }

    return finalResponse;
  }
}
