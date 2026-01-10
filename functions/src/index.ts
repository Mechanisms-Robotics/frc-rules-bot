import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { App, ExpressReceiver } from '@slack/bolt';
import { askGeminiWithManual } from './geminiService';

admin.initializeApp();

// Load configuration from Firebase config or Environment variables
const config = functions.config();
const slackToken = config.slack?.bot_token || process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = config.slack?.signing_secret || process.env.SLACK_SIGNING_SECRET;

const rulesFileUri = config.gemini?.rules_file_uri || process.env.RULES_FILE_URI;

if (!slackToken || !slackSigningSecret) {
    console.error("Missing Slack configuration. Set slack.bot_token and slack.signing_secret.");
}

if (!rulesFileUri) {
    console.error("Missing Gemini Rules File URI. Set gemini.rules_file_uri or RULES_FILE_URI.");
}

// Initialize Slack Bolt Receiver
// We set endpoints to '/' because the Cloud Function handles the routing to this instance.
const receiver = new ExpressReceiver({
    signingSecret: slackSigningSecret || '',
    endpoints: '/',
    processBeforeResponse: true
});

const app = new App({
    token: slackToken,
    receiver: receiver
});

// Middleware to ignore retries
app.use(async ({ context, next }) => {
    if (context.retryNum) {
        console.log(`Skipping retry attempt ${context.retryNum}`);
        return;
    }
    await next();
});

// Handle App Mentions
app.event('app_mention', async ({ event, context, client, say }) => {
    try {
        // Send a loading emoji or temporary message
        // Note: Using thread_ts is crucial for keeping the conversation organized
        const threadTs = event.thread_ts || event.ts;

        // Strip the bot mention from the text
        const query = event.text.replace(/<@[a-zA-Z0-9]+>/g, '').trim();

        if (!query) {
            await say({
                text: "Hello! How can I help you today?",
                thread_ts: threadTs
            });
            return;
        }

        if (!rulesFileUri) {
             await say({
                text: "I'm not fully configured yet. Please check my logs (Missing Rules File URI).",
                thread_ts: threadTs
            });
            return;
        }

        // Query Gemini with the Manual
        const answer = await askGeminiWithManual(query, rulesFileUri);

        // Reply in thread
        await say({
            text: answer,
            thread_ts: threadTs
        });

    } catch (error) {
        console.error("Error processing app_mention:", error);
        const threadTs = event.thread_ts || event.ts;
        await say({
            text: "I'm sorry, I ran into an issue processing your request.",
            thread_ts: threadTs
        });
    }
});

// Export the Express App as a Cloud Function
export const slackEvents = functions.https.onRequest(receiver.app);
