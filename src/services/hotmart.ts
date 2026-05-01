export async function enviarLeadHotmart(dados: {
  nome: string;
  email: string;
  celular: string;
}) {
  try {
    await fetch("/api/hotmart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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