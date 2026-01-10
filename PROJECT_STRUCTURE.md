# Project Structure

```text
/
├── firebase.json            # Firebase project configuration
├── manifest.json            # Slack App Manifest (Import this to Slack API)
├── TODO.md                  # Setup Checklist
└── functions/               # Backend logic (Firebase Functions)
    ├── package.json         # Dependencies (yarn)
    ├── tsconfig.json        # TypeScript configuration
    ├── src/
    │   ├── index.ts         # Entry point: Slack Bolt handler + Firebase trigger
    │   └── vertexService.ts # Service class for Vertex AI Search logic
    └── .gitignore
```
