import type { VercelRequest, VercelResponse } from "@vercel/node";
import https from "node:https";

function callGate(dataValue: 1 | 2): Promise<{ success: boolean; raw: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      hwid: process.env.GATE_HWID,
      appId: process.env.GATE_APP_ID,
      data: dataValue,
    });

    const req = https.request(
      {
        hostname: "api.tell.hu",
        path: "/gc/open",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "api-key": process.env.GATE_API_KEY || "",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            success: body.includes('"result":"OK"'),
            raw: body,
          });
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const result = await callGate(2);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Unknown error",
    });
  }
}
