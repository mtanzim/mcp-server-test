import { authenticate } from "@google-cloud/local-auth";
import type { Auth } from "googleapis";

const fs = require("node:fs").promises;
const process = require("node:process");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.compose",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = process.env?.TOKEN_PATH;
const CREDENTIALS_PATH = process.env?.CREDENTIALS_PATH;

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (_err) {
		// console.log(err);
		return null;
	}
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: {
	// biome-ignore lint/suspicious/noExplicitAny: will fix
	credentials: { refresh_token: any };
}) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content);
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize(): Promise<Auth.OAuth2Client | undefined> {
	let client = await loadSavedCredentialsIfExist();
	if (client) {
		return client;
	}
	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (client.credentials) {
		await saveCredentials(client);
		console.log("Authed");
		return client;
	}
	return;
}

export async function authenticateTool(): Promise<boolean> {
	const client = await authorize();
	if (client) {
		return true;
	}
	return false;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

// biome-ignore lint/suspicious/noExplicitAny: will fix
async function listLabels(auth: any) {
	const gmail = google.gmail({ version: "v1", auth });
	const res = await gmail.users.labels.list({
		userId: "me",
	});
	const labels = res.data.labels;
	if (!labels || labels.length === 0) {
		return [];
	}
	return labels;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	authorize().then(listLabels).then(console.log).catch(console.error);
}
