import { askGeminiWithManual } from '../geminiService';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    const question = "What are the ranking points and how do you get them?";
    const fileUri = process.env.RULES_FILE_URI;

    if (!fileUri) {
        console.error("Error: RULES_FILE_URI not found in .env file.");
        process.exit(1);
    }

    console.log(`Question: ${question}`);
    console.log("Asking Gemini (this may take a few seconds)...");

    try {
        const answer = await askGeminiWithManual(question, fileUri);
        console.log("\n--- ANSWER ---");
        console.log(answer);
        console.log("--------------");
    } catch (error) {
        console.error("Error calling Gemini:", error);
    }
}

main();
