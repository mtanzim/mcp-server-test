import { promises as fs } from "node:fs";
export async function readFile(filePath: string): Promise<null | string> {
	try {
		return fs.readFile(filePath, "utf8");
	} catch (err) {
		console.error("Error reading the file:", err);
		return null;
	}
}
