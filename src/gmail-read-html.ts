import { type Auth, type gmail_v1, google } from "googleapis";
import { content } from "googleapis/build/src/apis/content/index.js";
import { z } from "zod";
export async function listThreadSnippetsHtml(
	auth: Auth.OAuth2Client,
	days: number,
): Promise<string> {
	const gmail = google.gmail({ version: "v1", auth });
	const snippets = await getThreadSnippetsHtml(gmail, days);
	const snippetsSerialized: Record<string, string[]> = {};
	for (const [k, v] of snippets.entries()) {
		snippetsSerialized[k] = v;
	}
	return Object.values(snippetsSerialized).flat().join("\n\n\n");
}

async function getThreadSnippetsHtml(
	gmail: gmail_v1.Gmail,
	days: number,
	pageToken?: string,
	page = 0,
	disablePagination = true,
): Promise<Map<string, string[]>> {
	const res = await gmail.users.messages.list({
		userId: "me",
		q: `newer_than:${days}d`,
		labelIds: ["INBOX"],
		pageToken: pageToken,
		maxResults: 3,
	});
	const [snippets, fullMessageRes] = await processMessageThreads(
		gmail,
		res.data?.messages || [],
	);
	// modify the final snippets
	for (const [k, v] of snippets) {
		snippets.set(k, parseSnippetHtml(k, v, fullMessageRes));
	}
	const nextToken = res.data.nextPageToken;
	if (nextToken && !disablePagination) {
		const res = await getThreadSnippetsHtml(gmail, days, nextToken, page + 1);
		for (const [k, v] of res) {
			snippets.set(k, v);
		}
	}

	return snippets;
}

function parseSnippetHtml(
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
		const getParams = (content: string) =>
			JSON.stringify(
				generateDraftEmailToolCall({
					address: meta.senderAddress,
					threadId: meta.threadId,
					subject: meta.subject,
					messageId: meta.messageId || "",
					content,
				}),
			);
		return `
	<div>
		<h1>${meta.subject}</h1>
		<h2>${meta.senderAddress}</h2>
		<p>${vv}</p>
		<details>
			<summary>Metadata</summary>
			<code>${JSON.stringify(meta)}</code>
		</details>
		<div id="email-${meta.threadId}" style="border:1px solid #ccc; padding:10px; margin-top:10px;">
			<label for="response-${meta.messageId}">Your Response:</label><br>
			<textarea id="response-${meta.messageId}" rows="4" cols="50" style="width:100%;"></textarea><br>
			<button type="button" onclick="(function(){
				const response = document.getElementById('response-${meta.messageId}').value;
				console.log('posting message for thread id: ${meta.threadId} and message id: ${meta.messageId}');
				const params = {
					type: 'tool',
					payload: {
						toolName: 'gmail-draft-response',
						params: {
							address: '${meta.senderAddress}',
							threadId: '${meta.threadId}',
							subject: '${meta.subject}',
							messageId: '${meta.messageId}',
							content: response
						}
					}
				};
				console.log(params);
				window.top.postMessage(params, '*');
			})()">Send</button>

		</div>
	</div>
	`;
	});
	return snippetVals;
}

const gmailDraftToolName = "gmail-draft-response";
const gmailDraftToolSchema = z.object({
	address: z
		.string()
		.email()
		.describe("the address of the sender of the original email"),
	content: z.string().describe("the content of the response"),
	threadId: z.string().describe("the threadId of the original message"),
	messageId: z.string().describe("the messageId of the original message"),
	subject: z.string().describe("the subject of the original message"),
});

const generateDraftEmailToolCall = (
	params: z.infer<typeof gmailDraftToolSchema>,
) => {
	return {
		type: "tool",
		payload: {
			toolName: gmailDraftToolName,
			params,
		},
	};
};

export async function getThreadHtml(
	auth: Auth.OAuth2Client,
	threadId: string,
): Promise<string> {
	const gmail = google.gmail({ version: "v1", auth });
	const res = await gmail.users.threads.get({
		userId: "me",
		id: threadId,
		format: "full",
	});
	return res.data.messages?.flatMap(processMessageBodyHtml).join("") || "";
}

const parseMessagePartHtml = (m: gmail_v1.Schema$MessagePart): string => {
	if (!m.body?.data) {
		return "";
	}
	const bodyText = fromBase64(m.body?.data);
	// const meta = m.headers;
	return bodyText;
};

const parseMessageBodyHtml = (m: gmail_v1.Schema$Message): string => {
	const bodyText = m.payload?.body?.data
		? fromBase64(m.payload?.body?.data)
		: "";

	return bodyText;
};

const processMessagePartsHtml = (
	ps: gmail_v1.Schema$MessagePart[],
): string[] => {
	return ps
		.flatMap((p) => {
			const cur = [];
			if (p.body?.data && p.mimeType === "text/plain") {
				cur.push(parseMessagePartHtml(p));
			}
			if (p.parts) {
				cur.push(...processMessagePartsHtml(p.parts));
			}
			return cur;
		})
		.filter(Boolean);
};

const processMessageBodyHtml = (m: gmail_v1.Schema$Message): string[] => {
	const newCur: string[] = [parseMessageBodyHtml(m)];
	if (m.payload?.parts) {
		newCur.push(...processMessagePartsHtml(m.payload.parts));
	}
	return newCur;
};

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

const fromBase64 = (enc: string) => {
	return Buffer.from(enc, "base64").toString("utf-8");
};
