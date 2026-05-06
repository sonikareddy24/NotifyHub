import type { NextApiRequest, NextApiResponse } from "next";

const LOG_ENDPOINT = process.env.LOG_ENDPOINT ?? "http://localhost:4000/log";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  }).catch(() => {});
  return res.status(200).json({ ok: true });
}
