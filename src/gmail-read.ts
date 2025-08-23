import { authorize } from "./gmail-auth.js";
import { type Auth, type gmail_v1, google } from "googleapis";

export async function listThreadSnippets(
	auth: Auth.OAuth2Client,
	days: number,
): Promise<string> {
	const gmail = google.gmail({ version: "v1", auth });
	const snippets = await getThreadSnippets(gmail, days);
	const snippetsSerialized: Record<string, string[]> = {};
	for (const [k, v] of snippets.entries()) {
		snippetsSerialized[k] = v;
	}
	return Object.values(snippetsSerialized).flat().join("\n\n\n");
}

export async function getThread(
	auth: Auth.OAuth2Client,
	threadId: string,
): Promise<string> {
	const gmail = google.gmail({ version: "v1", auth });
	const res = await gmail.users.threads.get({
		userId: "me",
		id: threadId,
		format: "full",
	});
	return res.data.messages?.map(processMessageBody).join("\n\n\n") || "";
}

const processMessageParts = (ps: gmail_v1.Schema$MessagePart[]): string[] => {
	return ps
		.flatMap((p) => {
			const cur = [];
			if (p.body?.data && p.mimeType === "text/plain") {
				cur.push(fromBase64(p.body?.data));
			}
			if (p.parts) {
				cur.push(...processMessageParts(p.parts));
			}
			return cur;
		})
		.filter(Boolean);
};

const processMessageBody = (m: gmail_v1.Schema$Message): string[] => {
	const newCur: string[] = [];
	if (m.payload?.body?.data && m.payload?.mimeType === "text/plain") {
		newCur.push(fromBase64(m.payload?.body?.data));
	}
	if (m.payload?.parts) {
		newCur.push(...processMessageParts(m.payload.parts));
	}
	return newCur;
};

const fromBase64 = (enc: string) => {
	return Buffer.from(enc, "base64").toString("utf-8");
};

async function getThreadSnippets(
	gmail: gmail_v1.Gmail,
	days: number,
	pageToken?: string,
	page = 0,
): Promise<Map<string, string[]>> {
	const res = await gmail.users.messages.list({
		userId: "me",
		q: `newer_than:${days}d`,
		labelIds: ["INBOX"],
		pageToken: pageToken,
		maxResults: 25,
	});
	const [snippets, fullMessageRes] = await processMessageThreads(
		gmail,
		res.data?.messages || [],
	);
	// modify the final snippets
	for (const [k, v] of snippets) {
		snippets.set(k, parseSnippet(k, v, fullMessageRes));
	}
	const nextToken = res.data.nextPageToken;
	if (nextToken) {
		const res = await getThreadSnippets(gmail, days, nextToken, page + 1);
		for (const [k, v] of res) {
			snippets.set(k, v);
		}
	}

	return snippets;
}

function parseSnippet(
	threadId: string,
	bodies: string[],
	fullMessageRes: Map<string, gmail_v1.Schema$Message[]>,
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
	messages: gmail_v1.Schema$Message[],
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
				fullMessage.snippet || "",
			),
		);
		fullMessages.set(
			fullMessage.threadId,
			(fullMessages.get(fullMessage.threadId) || []).concat(fullMessage) || [],
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
	authorize()
		// 3 days of snippets
		.then((client) => listThreadSnippets(client, 3))
		.catch(console.error)
		.then(console.log);
}
