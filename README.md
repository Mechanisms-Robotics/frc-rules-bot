# FRC Rules Bot

A Slack bot powered by Google's Gemini AI that answers questions about the FIRST Robotics Competition (FRC) Game Manuals and Team Updates.

## 🚀 Features

- **Context-Aware Answers:** Uses Gemini 1.5 Flash with a knowledge base of uploaded PDF documents (Game Manuals, Team Updates).
- **Slack Integration:** Responds directly to app mentions in Slack threads.
- **Easy Updates:** Simple workflow to add new PDF rules and deploy updates.
- **Auto-Sync:** Automatically manages the lifecycle of files in the Gemini API (uploads new ones, cleans up old ones).

## 📋 Prerequisites

- **Node.js**: Version 22 (enforced via `.nvmrc`)
- **Yarn**: Version 1.x or 4.x (Package Manager)
- **Firebase CLI**: For deploying Cloud Functions (`npm install -g firebase-tools`)
- **Google Cloud Project**: With Vertex AI / Gemini API enabled.

## 🛠️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Mechanisms-Robotics/frc-rules-bot.git
    cd frc-rules-bot
    ```

2.  **Install Dependencies:**
    ```bash
    cd functions
    yarn install
    ```

## ⚙️ Configuration

1.  **Environment Variables:**
    Create a `.env` file in the `functions/` directory with the following keys:
    ```env
    SLACK_BOT_TOKEN=xoxb-your-bot-token
    SLACK_SIGNING_SECRET=your-signing-secret
    GEMINI_API_KEY=your-gemini-api-key
    ```

    *Note: For production deployment, set these using `firebase functions:config:set` or the new params system.*

## 📚 Managing the Knowledge Base

The bot answers questions based on PDF documents stored in `functions/documents/`.

1.  **Add/Update Rules:**
    Place your PDF files (e.g., `2025GameManual.pdf`, `TeamUpdate01.pdf`) into the `functions/documents/` directory.

2.  **Sync & Deploy:**
    To upload the new documents to Gemini and deploy the updated bot to Firebase in one step:
    ```bash
    cd functions
    yarn sync-and-deploy
    ```

    **What this does:**
    1.  Deletes old files from Gemini to ensure a clean state.
    2.  Uploads all PDFs from `functions/documents/`.
    3.  Updates `knowledgeBase.json` with the new File URIs.
    4.  Deploys the Cloud Function to Firebase.

## 💻 Development Commands

Run these commands from the `functions/` directory:

| Command | Description |
| :--- | :--- |
| `yarn build` | Compiles TypeScript to JavaScript. |
| `yarn sync-docs` | Syncs local PDFs in `documents/` with Gemini API (does not deploy). |
| `yarn files:list` | Lists all files currently uploaded to Gemini. |
| `yarn files:delete <name>` | Deletes a specific file from Gemini. |
| `yarn logs` | View Firebase Cloud Function logs. |

## 🤝 Contributing

This project enforces **Conventional Commits**. Please ensure your commit messages follow the standard format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring

**Example:** `feat: add support for multiple game manuals`

## 📄 Project Structure

```
frc-rules-bot/
├── functions/
│   ├── documents/          # Place PDF rule manuals here
│   ├── src/
│   │   ├── geminiService.ts # Gemini API interactions
│   │   ├── index.ts         # Main Cloud Function entry point
│   │   └── tools/           # Utility scripts (sync, manage files)
│   ├── package.json
│   └── tsconfig.json
└── README.md
```