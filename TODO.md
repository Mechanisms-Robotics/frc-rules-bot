# Project Setup TODO

## Google Cloud Platform (GCP) & Vertex AI
- [x] **Create GCP Project**: `frcllm` & `frcllm-37cab` (Firebase)
- [x] **Enable APIs**: Vertex AI, Discovery Engine, Cloud Functions, Cloud Build, Artifact Registry.
- [x] **Agent Builder (Vertex AI Search)**:
    - [x] Data Store: Switched to GCS Bucket `gs://frcllm-documents` (ID: `frc-llm_1767988823468`)
    - [x] Collection ID: `default_collection`
- [x] **IAM Roles**: `Discovery Engine Viewer` and `Storage Object Viewer` granted to Service Account.

## Firebase Setup
- [x] **Install CLI**: `npm install -g firebase-tools`
- [x] **Login**: `firebase login`
- [x] **Initialize**: `firebase use frcllm-37cab`
- [x] **Environment Configuration**: Complete (Slack tokens and Vertex IDs set).

## Slack App Configuration
- [x] **Create App**: Completed via Slack API Dashboard.
- [x] **Import Manifest**: Completed using `manifest.json`.
- [x] **Install to Workspace**: Completed.
- [x] **Get Secrets**: Completed and configured in Firebase.
- [x] **Subscribe to Events**: Verified and pointing to `https://us-central1-frcllm-37cab.cloudfunctions.net/slackEvents`.

## Local Development & Deployment
- [x] **Install Dependencies**: `yarn install` completed.
- [x] **Build**: `yarn build` (tsc) verified.
- [x] **Local Debugging**: `testVertex.ts` script created and verified.
- [x] **Deploy**: Successfully deployed to Firebase Functions.

## Ongoing / Maintenance
- [ ] **Custom Titles**: (Optional) Use `metadata.jsonl` if filenames aren't sufficient.
- [ ] **Summaries**: Monitor Vertex AI console to ensure summaries are enabled once indexing is complete.