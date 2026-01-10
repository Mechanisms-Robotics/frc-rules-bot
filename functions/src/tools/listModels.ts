
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return;
    
    // We can't easily list models with the SDK, but we can try to fetch them via fetch
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

main();
