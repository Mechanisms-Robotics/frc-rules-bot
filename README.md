# FRC Rules Bot

A Slack bot that answers questions about the FRC Game Manual using Gemini AI.

## Project Structure
See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for details.

## Semantic Commits
This project uses [Conventional Commits](https://www.conventionalcommits.org/). Please ensure all commit messages follow the format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code changes that neither fix a bug nor add a feature
- `chore:` for updating build tasks, package manager configs, etc.

## Setup & Deployment

### 1. Installation
```bash
cd functions
yarn install
```

### 2. Knowledge Base Sync
Place your PDF files in `functions/documents/`, then run:
```bash
cd functions
yarn sync-docs
```

### 3. Deployment
To sync documents and deploy to Firebase in one command:
```bash
cd functions
yarn sync-and-deploy
```
