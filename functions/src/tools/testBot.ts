import { askGeminiWithContext } from '../geminiService';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    // 1. Get question from CLI args or use default
    const question = process.argv[2] || "What is a robot?";
    
    // 2. Load Knowledge Base
    let ruleFileUris: string[] = [];
    try {
        const kbPath = path.resolve(__dirname, '../knowledgeBase.json');
        if (fs.existsSync(kbPath)) {
            ruleFileUris = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
            console.log(`Loaded ${ruleFileUris.length} file URIs from knowledge base.`);
        } else {
            console.error("Error: knowledgeBase.json not found. Run yarn sync-docs first.");
            process.exit(1);
        }
    } catch (e) {
        console.error("Failed to load knowledgeBase.json:", e);
        process.exit(1);
    }

    if (ruleFileUris.length === 0) {
        console.error("Error: No file URIs found in knowledgeBase.json.");
        process.exit(1);
    }

    console.log(`Question: ${question}`);
    console.log("Asking Gemini (this may take a few seconds)...");

    try {
        const answer = await askGeminiWithContext(question, ruleFileUris);
        console.log("\n--- ANSWER ---");
        console.log(answer);
        console.log("--------------");
    } catch (error) {
        console.error("Error calling Gemini:", error);
    }
}

main();
