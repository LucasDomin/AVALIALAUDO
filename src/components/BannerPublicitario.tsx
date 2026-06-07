import { BannerCursoLaudoMasterSvg } from "./BannerCursoLaudoMaster";

/**
 * Banner publicitário lateral — exibido apenas na tela de Login (Acesso Inicial).
 *
 * 📐 ESPAÇO DISPONÍVEL (DESKTOP)
 *  - Largura total da sidebar:    280 px
 *  - Padding lateral:             32 px (esquerda) + 32 px (direita)
 *  - Largura útil da imagem:      216 px
 *  - Altura recomendada:          até 520 px (proporção atual do banner ativo)
 *  - Proporções sugeridas:        1:1 (quadrado), 2:3 (retrato) ou 27:65 (alto/banner lateral)
 *  - Formato preferencial:        SVG (preferido — renderizado inline), PNG ou JPG (até ~150 KB)
 *
 * 🔁 Para alterar o banner no futuro:
 *  - Substitua o conteúdo de `BannerCursoLaudoMasterSvg` em `./BannerCursoLaudoMaster.tsx`
 *    (ou crie um novo componente SVG e troque o import aqui).
 *  - Ajuste `linkDestino` para alterar o destino do clique.
 *  - Ajuste `tituloAcessivel` para acessibilidade e SEO.
 */

const BANNER_CONFIG = {
  ativo: true,
  linkDestino: "https://laudomaster.com.br/cursos/",
  tituloAcessivel: "Conheça os cursos da Laudo Master",
};

export function BannerPublicitario() {
  if (!BANNER_CONFIG.ativo) return null;

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
        <BannerCursoLaudoMasterSvg className="block h-auto w-full" />
      </a>
    </div>
  );
}
