import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as path from 'path';

let genAI: GoogleGenerativeAI | null = null;
let fileManager: GoogleAIFileManager | null = null;

function getClients() {
    // Try process.env first (local .env), then functions.config() (deployed)
    const API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in environment or firebase config.");
    }
    if (!genAI) genAI = new GoogleGenerativeAI(API_KEY);
    if (!fileManager) fileManager = new GoogleAIFileManager(API_KEY);
    return { genAI, fileManager };
}

/**
 * Uploads a file to the Gemini Files API.
 */
export async function uploadManual(path: string, mimeType: string, displayName: string) {
    const { fileManager } = getClients();
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName,
    });
    
    let file = await fileManager.getFile(uploadResult.file.name);
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Wait for the file to be processed
    while (file.state === FileState.PROCESSING) {
        process.stdout.write(".");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state !== FileState.ACTIVE) {
        throw new Error(`File ${file.name} failed to process. State: ${file.state}`);
    }

    console.log(`\nFile processing complete: ${file.uri}`);
    return file;
}

/**
 * Lists all files uploaded to the Gemini Files API.
 */
export async function listUploadedFiles() {
    const { fileManager } = getClients();
    const result = await fileManager.listFiles();
    return result.files || [];
}

/**
 * Deletes a file from the Gemini Files API.
 * @param name The name of the file (e.g., "files/abc-123")
 */
export async function deleteUploadedFile(name: string) {
    const { fileManager } = getClients();
    await fileManager.deleteFile(name);
}

/**
 * Chats with the Gemini model using the provided file as context.
 */
export async function askGeminiWithManual(question: string, fileUri: string, modelName: string = "gemini-2.5-flash") {
    const { genAI } = getClients();
    console.log(`Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });

    const result = await model.generateContent([
        {
            fileData: {
                mimeType: "application/pdf",
                fileUri: fileUri
            }
        },
        {
            text: question
        }
    ]);

    return result.response.text();
}

/**
 * Refreshes the knowledge base by uploading all PDFs in the directory.
 */
async function refreshContext(docDir: string): Promise<string[]> {
    if (!fs.existsSync(docDir)) {
        console.error(`Directory not found: ${docDir}`);
        return [];
    }
    
    console.log("Refreshing context documents...");
    const filesToUpload = fs.readdirSync(docDir).filter(file => file.toLowerCase().endsWith('.pdf'));
    const newUris: string[] = [];

    for (const fileName of filesToUpload) {
        const filePath = path.join(docDir, fileName);
        try {
            // Check if file exists in Gemini (optional optimization skipped for simplicity/reliability)
            // Just upload new ones. Gemini Auto-clean handles old ones eventually.
            // Or we could list and delete, but that takes longer. 
            // We just want to get back online fast.
            const uploadedFile = await uploadManual(filePath, "application/pdf", fileName);
            newUris.push(uploadedFile.uri);
        } catch (err) {
            console.error(`Failed to refresh ${fileName}:`, err);
        }
    }
    return newUris;
}

/**
 * Chats with the Gemini model using multiple files as context.
 */
export async function askGeminiWithContext(
    question: string, 
    fileUris: string[], 
    modelName?: string, 
    documentsDir?: string
) {
    const { genAI } = getClients();

    // Determine the primary model: Argument > Env Var > Default
    const primaryModel = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    
    // Helper function to perform the generation request
    const generate = async (currentModel: string, currentUris: string[]) => {
        console.log(`Using model: ${currentModel} with ${currentUris.length} context files`);
        const model = genAI.getGenerativeModel({ model: currentModel }, { apiVersion: 'v1beta' });

        const contentParts: any[] = currentUris.map(uri => ({
            fileData: {
                mimeType: "application/pdf",
                fileUri: uri
            }
        }));

        contentParts.push({ text: question });
        return await model.generateContent(contentParts);
    };

    try {
        const result = await generate(primaryModel, fileUris);
        return result.response.text();
    } catch (error: any) {
        console.warn(`Error with primary model ${primaryModel}:`, error.message);

        // Check for Expired/Missing Files (404 Not Found or 403 Forbidden)
        if (documentsDir && (error.status === 404 || error.status === 403 || error.message?.includes('404') || error.message?.includes('403'))) {
            console.warn("Detected invalid file context (expired?). Attempting refresh...");
            const newUris = await refreshContext(documentsDir);
            
            if (newUris.length > 0) {
                console.log("Context refreshed. Retrying query with new files...");
                // Retry with new URIs (recursive call might be safer but simpler to just call generate)
                const retryResult = await generate(primaryModel, newUris);
                return retryResult.response.text();
            } else {
                console.error("Refresh failed or no files found.");
            }
        }

        // Fallback Logic: Trigger on 429 (Quota) OR 503 (Overloaded)
        if (error.status === 429 || error.message?.includes('429') || 
            error.status === 503 || error.message?.includes('503')) {
            
            // Tier 1 Fallback: If we started with Pro, try Flash
            if (primaryModel.includes('pro')) {
                console.log("Falling back to gemini-2.5-flash...");
                try {
                    const res = await generate("gemini-2.5-flash", fileUris);
                    return res.response.text();
                } catch (e: any) {
                    console.warn("gemini-2.5-flash also failed.", e.message);
                    // Continue to next fallback
                }
            }

            // Tier 2 Fallback: Try Flash-Lite (The ultimate safety net)
            // We run this if the primary was NOT Lite, and (Primary failed OR Tier 1 failed)
            if (!primaryModel.includes('lite')) {
                console.log("Falling back to gemini-2.5-flash-lite...");
                try {
                    const res = await generate("gemini-2.5-flash-lite", fileUris);
                    return res.response.text();
                } catch (e) {
                    console.error("Critical: All fallback models failed.");
                    throw e;
                }
            }
        }
        
        throw error;
    }
}
