import {
  google, // The top level object used to access services
  Auth, // Namespace for auth related types
  gmail_v1,
} from "googleapis";

import { authorize } from "./gmail-auth.js";

async function listMessages(auth: Auth.OAuth2Client) {
  const gmail = google.gmail({ version: "v1", auth });
  await getMessages(gmail);
}

async function getMessages(
  gmail: gmail_v1.Gmail,
  pageToken?: string,
  page = 0
) {
  console.log({ page });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:7d",
    pageToken: pageToken,
    maxResults: 10,
  });
  processMessages(res.data?.messages || []);
  const nextToken = res.data.nextPageToken;
  if (nextToken) {
    getMessages(gmail, nextToken, page + 1);
  }
}

function processMessages(messages: gmail_v1.Schema$Message[]): void {
  if (!messages || messages?.length === 0) {
    console.log("No labels found.");
    return;
  }
  messages.forEach((m) => console.log(m.id));
}

authorize().then(listMessages).catch(console.error);
