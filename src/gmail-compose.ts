import {
  google, // The top level object used to access services
  Auth, // Namespace for auth related types
  gmail_v1,
} from "googleapis";

export async function draftEmail({
  client,
  address,
  content,
  threadId,
  messageId,
  subject,
}: {
  client: gmail_v1.Gmail;
  address: string;
  content: string;
  threadId: string;
  messageId: string;
  subject: string;
}): Promise<string> {
  const rawMessage =
    `From: mtanzim@gmail.com\r\n` +
    `To: ${address}\r\n` +
    `Subject: Re: ${subject}\r\n` + // Consider dynamically setting the subject
    `Content-Type: text/plain; charset=utf-8\r\n` +
    `In-Reply-To: ${messageId}\r\n` + //Dynamically set this
    `References: ${messageId}\r\n` + //Dynamically set this
    `\r\n` + // Important: Empty line to signal the end of headers
    `${content}\r\n`;

  // Base64 encode the message
  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const res = await client.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encodedMessage,
        threadId,
      },
    },
  });
  if (res.status === 200) {
    return "Draft was created successfully.";
  }
  return "Something went wrong. Please try again.";
}
