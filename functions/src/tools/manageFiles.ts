import { listUploadedFiles, deleteUploadedFile } from '../geminiService';

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log("Usage:");
        console.log("  ts-node src/tools/manageFiles.ts list");
        console.log("  ts-node src/tools/manageFiles.ts delete <files/name>");
        return;
    }

    try {
        if (command === 'list') {
            console.log("Fetching uploaded files...");
            const files = await listUploadedFiles();
            if (files.length === 0) {
                console.log("No files found.");
            } else {
                console.log("Found files:");
                files.forEach(f => {
                    console.log(`- Display Name: ${f.displayName}`);
                    console.log(`  Name: ${f.name}`);
                    console.log(`  URI: ${f.uri}`);
                    console.log(`  State: ${f.state}`);
                    console.log(`  Created: ${f.createTime}`);
                    console.log("------------------------------------------------");
                });
            }
        } else if (command === 'delete') {
            const fileName = args[1];
            if (!fileName) {
                console.error("Error: Please provide the file name (e.g., files/abc-123) to delete.");
                return;
            }
            console.log(`Deleting file: ${fileName}...`);
            await deleteUploadedFile(fileName);
            console.log("File deleted successfully.");
        } else {
            console.error(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
