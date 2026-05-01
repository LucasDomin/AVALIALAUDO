import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://handler.send.hotmart.com/convert/ljTj3dO", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "hottok": "457bf8d4-f6ef-4eaf-91d8-9934757e908f",
      },
      body: JSON.stringify(req.body),
    });

    const status = response.status;
    return res.status(200).json({ ok: true, hotmartStatus: status });
  } catch (erro) {
    return res.status(500).json({ error: "Falha ao enviar para Hotmart" });
  }
}