import { handleApiRequest, sendJson } from "../../server/core.mjs";

export default async function handler(req, res) {
  try {
    await handleApiRequest(req, res, "/auth/session");
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
}
