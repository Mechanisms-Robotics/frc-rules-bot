import * as path from 'path';
import * as fs from 'fs';
import { uploadManual } from '../geminiService';

// This script is intended to be run locally to upload the manual and get the URI.
// Usage: ts-node src/tools/uploadManual.ts (or compile and run node lib/tools/uploadManual.js)

async function main() {
    const manualPath = path.resolve(__dirname, '../../manual.pdf');
    
    if (!fs.existsSync(manualPath)) {
        console.error(`Error: Could not find manual.pdf at ${manualPath}`);
        console.error("Please place the FRC Game Manual PDF in the 'functions' root directory and name it 'manual.pdf'.");
        process.exit(1);
    }

    console.log(`Found manual at: ${manualPath}`);
    console.log("Uploading to Gemini...");

    try {
        const file = await uploadManual(manualPath, "application/pdf", "FRC Game Manual");
        console.log("------------------------------------------------");
        console.log("SUCCESS!");
        console.log(`File URI: ${file.uri}`);
        console.log("------------------------------------------------");
        console.log("Please save this File URI. You will need to set it as an environment variable (RULES_FILE_URI) for your bot.");
    } catch (error) {
        console.error("Failed to upload manual:", error);
        process.exit(1);
    }
}

main();
