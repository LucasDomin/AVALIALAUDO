import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://handler.send.hotmart.com/convert/ljTj3dO", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "hottok": "29695111-21a5-4c75-abe8-920e3e83ca82",
      },
      body: JSON.stringify({
        ...req.body,
        tags: ["LM-CALCULADORA-LAUDO-MASTER"],
      }),
    });

    const status = response.status;
    return res.status(200).json({ ok: true, hotmartStatus: status });
  } catch (erro) {
    console.error("Erro ao enviar para Hotmart:", erro);
    return res.status(500).json({ error: "Falha ao enviar para Hotmart" });
  }
}