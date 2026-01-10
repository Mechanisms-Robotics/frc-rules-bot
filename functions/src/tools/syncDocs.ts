import * as fs from 'fs';
import * as path from 'path';
import { uploadManual, listUploadedFiles, deleteUploadedFile } from '../geminiService';

const DOCUMENTS_DIR = path.resolve(__dirname, '../../documents');
const KNOWLEDGE_BASE_FILE_SRC = path.resolve(__dirname, '../../src/knowledgeBase.json');
const KNOWLEDGE_BASE_FILE_LIB = path.resolve(__dirname, '../../lib/knowledgeBase.json');

async function main() {
    try {
        console.log("=== Starting Document Sync ===");

        // 1. List and Delete Existing Files
        console.log("Fetching existing files from Gemini...");
        const existingFiles = await listUploadedFiles();
        
        if (existingFiles.length > 0) {
            console.log(`Found ${existingFiles.length} existing files. Deleting them...`);
            for (const file of existingFiles) {
                console.log(`Deleting ${file.displayName} (${file.name})...`);
                await deleteUploadedFile(file.name);
            }
            console.log("All existing files deleted.");
        } else {
            console.log("No existing files found.");
        }

        // 2. Scan 'documents' directory
        if (!fs.existsSync(DOCUMENTS_DIR)) {
            console.error(`Error: 'documents' directory not found at ${DOCUMENTS_DIR}`);
            process.exit(1);
        }

        const filesToUpload = fs.readdirSync(DOCUMENTS_DIR).filter(file => file.toLowerCase().endsWith('.pdf'));
        
        if (filesToUpload.length === 0) {
            console.log("No PDF files found in 'documents' directory.");
            const empty = JSON.stringify([], null, 2);
            fs.writeFileSync(KNOWLEDGE_BASE_FILE_SRC, empty);
            // Ensure lib directory exists before writing
            if (!fs.existsSync(path.dirname(KNOWLEDGE_BASE_FILE_LIB))) fs.mkdirSync(path.dirname(KNOWLEDGE_BASE_FILE_LIB), { recursive: true });
            fs.writeFileSync(KNOWLEDGE_BASE_FILE_LIB, empty);
            return;
        }

        console.log(`Found ${filesToUpload.length} files to upload:`, filesToUpload);

        // 3. Upload New Files
        const uploadedUris: string[] = [];
        
        for (const fileName of filesToUpload) {
            const filePath = path.join(DOCUMENTS_DIR, fileName);
            console.log(`Uploading ${fileName}...`);
            try {
                // Using "application/pdf" for all currently, can be dynamic if needed
                const uploadedFile = await uploadManual(filePath, "application/pdf", fileName);
                uploadedUris.push(uploadedFile.uri);
            } catch (err) {
                console.error(`Failed to upload ${fileName}:`, err);
            }
        }

        // 4. Save to Knowledge Base JSON (Both SRC and LIB)
        console.log("Saving File URIs to knowledgeBase.json...");
        const jsonContent = JSON.stringify(uploadedUris, null, 2);
        
        fs.writeFileSync(KNOWLEDGE_BASE_FILE_SRC, jsonContent);
        console.log(`Updated: ${KNOWLEDGE_BASE_FILE_SRC}`);

        // Ensure lib directory exists
        if (!fs.existsSync(path.dirname(KNOWLEDGE_BASE_FILE_LIB))) fs.mkdirSync(path.dirname(KNOWLEDGE_BASE_FILE_LIB), { recursive: true });
        fs.writeFileSync(KNOWLEDGE_BASE_FILE_LIB, jsonContent);
        console.log(`Updated: ${KNOWLEDGE_BASE_FILE_LIB}`);
        
        console.log("=== Sync Complete ===");
        console.log(`Knowledge Base updated with ${uploadedUris.length} files.`);

    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
}

main();
