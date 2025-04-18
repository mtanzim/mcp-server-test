import {
  google, // The top level object used to access services
  Auth, // Namespace for auth related types
  gmail_v1,
} from "googleapis";
import { authorize } from "./gmail-auth.js";

export async function draftEmail(
  auth: Auth.OAuth2Client,
  {
    address,
    content,
    threadId,
    messageId,
    subject,
  }: {
    address: string;
    content: string;
    threadId: string;
    messageId: string;
    subject: string;
  }
): Promise<string> {
  const gmail = google.gmail({ version: "v1", auth });
  const rawMessage =
    `From: Tanzim Mokammel<mtanzim@gmail.com>\r\n` +
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
  const res = await gmail.users.drafts.create({
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

if (import.meta.url === `file://${process.argv[1]}`) {
  authorize()
    .then((auth) =>
      draftEmail(auth, {
        address: `cameron.m@careers.getrocket.io`,
        content: `\
Hi Cameron,

Thank you for your understanding. I appreciate your willingness to stay in touch and reconnect at a later time. \
My current commitments are keeping me quite busy, but I would definitely be interested in exploring opportunities at Flipp when my schedule allows. \
Please feel free to reach out again in about 3 months, as my situation should be more flexible then. In the meantime, I'll make a note to contact you if anything changes on my end. \
Thanks again for your consideration.

Best regards,
         
Tanzim`,
        subject: `Re: Tanzim - Optimizing greenfield applications at Flipp?`,
        threadId: `195ecc627a885fbe`,
        messageId: `19640629052f84fd`,
      })
    )
    .catch(console.error)
    .then(console.log);
}
