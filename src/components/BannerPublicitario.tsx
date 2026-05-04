/**
 * Banner publicitário lateral — exibido apenas na tela de Login (Acesso Inicial).
 *
 * Para alterar o banner no futuro:
 *  - Substitua os valores em BANNER_CONFIG abaixo.
 *  - imagemUrl: caminho da imagem do banner (pode ser PNG/JPG/SVG; deixe vazio para usar o conteúdo textual padrão).
 *  - linkDestino: URL para a qual o usuário será direcionado ao clicar.
 *  - tituloAcessivel: texto alternativo para acessibilidade e SEO.
 */

const BANNER_CONFIG = {
  ativo: true,
  imagemUrl: "", // ex: "/banners/curso-laudo-master.png"
  linkDestino: "#", // ex: "https://laudomaster.com.br/curso"
  tituloAcessivel: "Espaço publicitário Laudo Master",
  textoChamada: "ESPAÇO PUBLICITÁRIO",
  textoSecundario: "Em breve, novidades exclusivas para profissionais Laudo Master.",
};

export function BannerPublicitario() {
  if (!BANNER_CONFIG.ativo) return null;

  const conteudo = BANNER_CONFIG.imagemUrl ? (
    <img
      src={BANNER_CONFIG.imagemUrl}
      alt={BANNER_CONFIG.tituloAcessivel}
      className="block w-full"
    />
  ) : (
    <div className="flex flex-col items-start gap-2 border border-dashed border-[#aeb4ba] bg-[#f6f7f9] p-4">
      <span className="text-xs font-bold uppercase tracking-wide text-[#e06600]">
        {BANNER_CONFIG.textoChamada}
      </span>
      <span className="text-sm leading-5 text-[#333333]">
        {BANNER_CONFIG.textoSecundario}
      </span>
    </div>
  );

  return (
    <div className="mt-8 hidden border-t border-[#c8ccd0] pt-6 md:block">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7a7f87]">
        Patrocinador
      </p>
      <a
        href={BANNER_CONFIG.linkDestino}
        target="_blank"
        rel="noopener noreferrer"
        title={BANNER_CONFIG.tituloAcessivel}
        className="block"
      >
        {conteudo}
      </a>
    </div>
  );
}
