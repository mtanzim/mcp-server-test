import {
  google, // The top level object used to access services
  Auth, // Namespace for auth related types
  gmail_v1,
} from "googleapis";

import { authorize } from "./gmail-auth.js";

export async function listThreadSnippets(
  auth: Auth.OAuth2Client
): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth });
  const snippets = await getThreadSnippets(gmail);
  let snippetsSerialized: Record<string, string> = {};
  for (const [k, v] of snippets) {
    snippetsSerialized[k] = v.join("\n");
  }
  return Object.values(snippetsSerialized).join("\n\n\n");
}

async function getThreadSnippets(
  gmail: gmail_v1.Gmail,
  pageToken?: string,
  page = 0
): Promise<Map<string, string[]>> {
  // console.log({ page });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:3d",
    pageToken: pageToken,
    maxResults: 10,
  });
  const [snippets] = await processMessageThreads(
    gmail,
    res.data?.messages || []
  );
  const nextToken = res.data.nextPageToken;
  if (nextToken) {
    const res = await getThreadSnippets(gmail, nextToken, page + 1);
    for (const [k, v] of res) {
      snippets.set(k, v);
    }
  }
  return snippets;
}

async function processMessageThreads(
  gmail: gmail_v1.Gmail,
  messages: gmail_v1.Schema$Message[]
): Promise<[Map<string, string[]>, Map<string, gmail_v1.Schema$Message[]>]> {
  if (!messages || messages?.length === 0) {
    // console.log("No labels found.");
    return [new Map(), new Map()];
  }
  const snippets = new Map<string, string[]>();
  const fullMessages = new Map<string, gmail_v1.Schema$Message[]>();
  // do it sequentially to avoid rate limiting for now
  for (const m of messages) {
    const fullMessageRes = await getMessage(gmail, m);
    if (fullMessageRes.status !== 200) {
      // console.error(fullMessageRes.statusText);
      continue;
    }
    const fullMessage = fullMessageRes.data;
    if (!fullMessage.threadId) {
      continue;
    }
    snippets.set(
      fullMessage.threadId,
      (snippets.get(fullMessage.threadId) || []).concat(
        fullMessage.snippet || ""
      )
    );
    fullMessages.set(
      fullMessage.threadId,
      (fullMessages.get(fullMessage.threadId) || []).concat(fullMessage) || []
    );
  }
  return [snippets, fullMessages];
}

async function getMessage(gmail: gmail_v1.Gmail, m: gmail_v1.Schema$Message) {
  return gmail.users.messages.get({
    id: m.id || "",
    userId: "me",
    format: "full",
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  authorize().then(listThreadSnippets).catch(console.error).then(console.log);
}
