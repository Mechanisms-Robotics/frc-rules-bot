import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import * as functions from 'firebase-functions';

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
    return result.files;
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
