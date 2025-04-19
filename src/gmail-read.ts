import { Auth, gmail_v1, google } from "googleapis";

import { authorize } from "./gmail-auth.js";

export async function listThreadSnippets(
  auth: Auth.OAuth2Client
): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth });
  const snippets = await getThreadSnippets(gmail);
  let snippetsSerialized: Record<string, string[]> = {};
  for (const [k, v] of snippets.entries()) {
    snippetsSerialized[k] = v;
  }
  return Object.values(snippetsSerialized).flat().join("\n\n\n");
}

async function getThreadSnippets(
  gmail: gmail_v1.Gmail,
  pageToken?: string,
  page = 0
): Promise<Map<string, string[]>> {
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:3d",
    pageToken: pageToken,
    maxResults: 10,
  });
  const [snippets, fullMessageRes] = await processMessageThreads(
    gmail,
    res.data?.messages || []
  );
  // modify the final snippets
  for (const [k, v] of snippets) {
    snippets.set(k, parseSnippet(k, v, fullMessageRes));
  }
  const nextToken = res.data.nextPageToken;
  if (nextToken) {
    const res = await getThreadSnippets(gmail, nextToken, page + 1);
    for (const [k, v] of res) {
      snippets.set(k, v);
    }
  }

  return snippets;
}

function parseSnippet(
  threadId: string,
  bodies: string[],
  fullMessageRes: Map<string, gmail_v1.Schema$Message[]>
) {
  const fullMessage = fullMessageRes.get(threadId);
  const meta = {
    senderAddress:
      fullMessage
        ?.at(-1)
        ?.payload?.headers?.find((h) => h?.name?.startsWith("From"))?.value ||
      "",
    subject:
      fullMessage
        ?.at(-1)
        ?.payload?.headers?.find((h) => h?.name?.startsWith("Subject"))
        ?.value || "",
    threadId,
    messageId: fullMessage?.at(-1)?.id,
  };
  const snippetVals = bodies.filter(Boolean).map((vv) => {
    return `<body>
\`\`\`plaintext
${vv}
\`\`\`
</body>
<metadata>
\`\`\`json
${JSON.stringify(meta)}
\`\`\`
</metadata>`;
  });
  return snippetVals;
}

async function processMessageThreads(
  gmail: gmail_v1.Gmail,
  messages: gmail_v1.Schema$Message[]
): Promise<[Map<string, string[]>, Map<string, gmail_v1.Schema$Message[]>]> {
  if (!messages || messages?.length === 0) {
    return [new Map(), new Map()];
  }
  const snippets = new Map<string, string[]>();
  const fullMessages = new Map<string, gmail_v1.Schema$Message[]>();
  for (const m of messages) {
    const fullMessageRes = await getMessage(gmail, m);
    if (fullMessageRes.status !== 200) {
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
