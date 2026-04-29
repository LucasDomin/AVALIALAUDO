const WEBHOOK_URL = "https://handler.send.hotmart.com/convert/ljTj3dO";
const HOTTOK = "457bf8d4-f6ef-4eaf-91d8-9934757e908f";

export async function enviarLeadHotmart(dados: {
  nome: string;
  email: string;
  celular: string;
}) {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "hottok": HOTTOK,
      },
      body: JSON.stringify({
        name: dados.nome,
        email: dados.email,
        phone: dados.celular,
      }),
    });
  } catch (erro) {
    console.error("Hotmart Sends: falha ao enviar lead", erro);
  }
}