import { handleApiRequest, sendJson } from "../../server/core.mjs";

export default async function handler(req, res) {
  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    await handleApiRequest(req, res, `/drafts/${encodeURIComponent(id || "")}`);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
}
