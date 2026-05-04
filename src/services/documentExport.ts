import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Header,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { jsPDF } from "jspdf";
import type { BlocoTextoRelatorio, RelatorioAvaliacao, TabelaRelatorio } from "../domain/relatorio";
import { dataHoraBR } from "../domain/formatacao";
import { nomeArquivoRelatorio } from "../domain/relatorio";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="96" viewBox="0 0 300 96">
<g>
<path d="M 31.49 32.44 L 28.04 33.88 L 27.77 52.34 L 27.50 70.79 L 22.50 68.28 C19.64,66.84 17.73,66.13 16.47,64.81 C13.96,62.19 13.97,57.16 13.99,39.25 C14.00,37.23 14.00,35.04 14.00,32.67 L 14.00 2.65 L 16.25 4.69 C17.49,5.82 22.33,8.70 27.00,11.10 C31.67,13.51 37.19,16.99 39.25,18.85 C42.50,21.78 43.00,22.82 43.00,26.62 L 43.00 31.00 L 38.97 31.00 C36.75,31.00 33.39,31.65 31.49,32.44 ZM 253.22 41.96 C246.88,43.72 241.88,43.06 235.16,39.58 C228.35,36.06 225.82,22.77 230.70,16.18 C240.39,3.09 263.25,7.13 265.53,22.33 C266.87,31.28 261.64,39.62 253.22,41.96 ZM 212.51 38.48 C208.16,41.19 206.77,41.49 197.36,41.84 L 187.00 42.23 L 187.00 8.78 L 197.75 9.17 C213.81,9.74 219.81,13.54 220.70,23.68 C221.26,30.05 218.74,34.60 212.51,38.48 ZM 109.79 37.50 C107.97,41.24 107.13,42.00 104.80,42.00 C103.26,42.00 101.99,41.66 101.99,41.25 C101.98,40.84 105.25,33.42 109.24,24.77 C116.31,9.43 116.58,9.03 119.59,9.02 C122.59,9.00 122.87,9.42 130.09,24.62 C134.16,33.21 137.65,40.64 137.83,41.12 C138.02,41.60 136.62,42.00 134.72,42.00 C131.55,42.00 131.13,41.63 129.55,37.50 L 127.83 33.00 L 111.97 33.00 ZM 275.75 76.83 C277.63,79.77 279.02,82.28 278.83,82.42 C277.26,83.62 273.14,80.51 269.62,75.49 C265.69,69.88 265.12,69.47 260.71,68.95 L 256.00 68.41 L 256.00 75.20 C256.00,81.33 255.80,82.00 254.00,82.00 C252.09,82.00 252.00,81.33 252.00,66.50 L 252.00 51.00 L 260.75 51.01 C270.41,51.03 273.66,52.14 275.94,56.20 C277.93,59.75 276.52,63.73 272.25,66.61 C269.33,68.58 269.19,68.91 270.68,70.14 C271.59,70.89 273.87,73.90 275.75,76.83 ZM 239.30 36.04 C243.09,38.35 249.93,38.60 253.85,36.57 C257.32,34.79 259.00,31.16 259.00,25.50 C259.00,16.93 255.11,13.00 246.63,13.00 C243.28,13.00 241.38,13.65 239.09,15.57 C232.60,21.04 232.71,32.02 239.30,36.04 ZM 193.00 12.73 L 193.00 38.00 L 197.79 38.00 C204.60,38.00 210.98,34.56 213.41,29.58 C215.15,26.03 215.19,25.30 213.91,21.63 C212.07,16.37 207.84,13.92 199.45,13.24 ZM 131.00 67.00 C131.00,79.67 130.72,83.00 129.67,83.00 C127.24,83.00 127.00,81.77 126.93,69.08 L 126.85 56.50 L 124.94 62.00 C118.23,81.24 117.82,82.12 115.74,81.80 C114.13,81.56 112.82,79.01 109.41,69.50 L 105.11 57.50 L 105.06 69.75 C105.00,81.31 104.89,82.00 103.00,82.00 C101.09,82.00 101.00,81.33 101.00,66.50 L 101.00 51.00 L 103.93 51.00 C107.12,51.00 107.70,52.12 112.99,68.50 C114.23,72.35 115.54,75.82 115.89,76.21 C116.24,76.61 118.49,71.09 120.90,63.96 C125.14,51.38 125.35,51.00 128.13,51.00 L 131.00 51.00 ZM 168.68 41.06 C166.38,42.10 162.46,42.97 159.96,42.98 C154.41,43.00 146.99,39.49 145.27,36.00 C144.49,34.43 144.02,28.95 144.01,21.25 L 144.00 9.00 L 150.00 9.00 L 150.00 20.78 C150.00,33.70 150.79,36.03 155.74,37.76 C159.76,39.16 165.05,38.30 167.70,35.81 C169.86,33.78 170.00,32.89 170.00,21.33 L 170.00 9.00 L 176.00 9.00 L 176.00 21.05 C176.00,35.35 174.95,38.21 168.68,41.06 ZM 140.00 78.00 C138.80,81.10 137.59,82.60 136.13,82.82 C134.96,83.00 134.00,82.91 134.00,82.62 C134.00,82.34 136.73,75.11 140.07,66.55 C148.21,45.73 148.33,45.73 156.75,66.33 C160.19,74.75 163.00,81.94 163.00,82.32 C163.00,82.69 162.08,83.00 160.94,83.00 C159.42,83.00 158.35,81.70 156.79,77.96 L 154.70 72.92 L 148.23 73.21 L 141.75 73.50 ZM 184.45 81.58 C177.14,84.64 168.87,82.33 166.46,76.56 C164.60,72.10 164.61,72.00 167.00,72.00 C168.10,72.00 169.00,72.47 169.00,73.05 C169.00,73.62 170.10,75.20 171.45,76.55 C175.76,80.85 186.00,79.03 186.00,73.97 C186.00,71.53 182.98,69.62 175.93,67.63 C169.39,65.77 166.67,63.19 166.67,58.83 C166.67,53.91 170.74,51.00 177.63,51.00 C182.40,51.00 183.55,51.40 186.08,53.92 C187.68,55.53 189.00,57.56 189.00,58.42 C189.00,60.89 185.44,60.27 184.22,57.59 C181.51,51.63 168.31,54.45 170.64,60.49 C171.15,61.84 179.54,65.00 182.60,65.00 C183.29,65.00 185.23,66.17 186.92,67.59 C192.06,71.91 190.82,78.93 184.45,81.58 ZM 246.00 80.50 C246.00,81.75 244.06,82.00 234.50,82.00 L 223.00 82.00 L 223.00 51.00 L 234.00 51.00 C244.33,51.00 245.00,51.12 245.00,53.00 C245.00,54.85 244.33,55.00 236.00,55.00 L 227.00 55.00 L 227.00 65.10 L 235.50 64.41 C243.73,63.75 244.00,63.79 244.00,65.86 C244.00,67.88 243.52,68.00 235.50,68.00 L 227.00 68.00 L 227.00 79.00 L 236.50 79.00 C244.28,79.00 246.00,79.27 246.00,80.50 ZM 99.00 40.00 C99.00,41.86 98.33,42.00 89.50,42.00 L 80.00 42.00 L 80.00 9.00 L 86.00 9.00 L 86.00 38.00 L 92.50 38.00 C98.33,38.00 99.00,38.21 99.00,40.00 ZM 208.00 68.55 C208.00,81.33 207.90,82.00 206.00,82.00 C204.10,82.00 204.00,81.33 204.00,68.50 L 204.00 55.00 L 199.00 55.00 C194.67,55.00 194.00,54.73 194.00,53.00 C194.00,51.11 194.67,51.00 206.57,51.00 C218.01,51.00 219.12,51.16 218.81,52.75 C218.56,54.10 217.29,54.57 213.24,54.80 L 208.00 55.10 ZM 262.94 55.00 L 256.00 55.00 L 256.00 65.00 L 262.31 65.00 C270.84,65.00 274.60,61.73 271.37,57.11 C270.10,55.31 268.88,55.00 262.94,55.00 ZM 114.93 25.75 C114.08,27.92 114.25,28.00 119.63,28.00 C123.71,28.00 125.07,27.66 124.70,26.75 C124.41,26.06 123.17,23.12 121.94,20.22 L 119.71 14.94 L 117.76 19.22 C116.69,21.57 115.42,24.51 114.93,25.75 ZM 144.00 68.04 C144.00,68.57 146.06,69.00 148.57,69.00 C148.76,69.00 148.94,69.00 149.12,69.00 C150.88,69.01 151.93,69.01 152.36,68.49 C153.00,67.73 152.25,65.81 150.40,61.06 C150.27,60.74 150.15,60.41 150.01,60.06 L 148.28 55.62 L 146.14 61.35 C144.96,64.50 144.00,67.51 144.00,68.04 Z" fill="rgb(31,41,92)"/>
<path d="M 0.00 0.00 L 300.00 0.00 L 300.00 96.00 L 0.00 96.00 ZM 28.00 59.92 L 28.00 85.76 L 31.75 84.43 C33.83,83.68 39.73,83.07 45.00,83.04 C50.22,83.01 56.19,82.52 58.25,81.95 L 62.00 80.91 L 62.00 28.78 L 59.25 29.48 C57.74,29.86 51.10,30.50 44.50,30.90 C43.98,30.93 43.48,30.96 43.00,30.98 L 43.00 26.62 C43.00,22.82 42.50,21.78 39.25,18.85 C37.19,16.99 31.67,13.51 27.00,11.10 C22.33,8.70 17.49,5.82 16.25,4.69 L 14.00 2.65 L 14.00 32.67 C14.00,35.04 14.00,37.23 13.99,39.25 C13.97,57.16 13.96,62.19 16.47,64.81 C17.73,66.13 19.64,66.84 22.50,68.28 L 27.50 70.79 L 27.77 52.34 L 28.04 33.88 L 31.16 32.58 C30.91,32.73 30.68,32.89 30.47,33.08 C27.90,35.34 27.93,40.55 27.98,53.20 C27.99,55.24 28.00,57.47 28.00,59.92 ZM 253.22 41.96 C261.64,39.62 266.87,31.28 265.53,22.33 C263.25,7.13 240.39,3.09 230.70,16.18 C225.82,22.77 228.35,36.06 235.16,39.58 C241.88,43.06 246.88,43.72 253.22,41.96 ZM 212.51 38.48 C218.74,34.60 221.26,30.05 220.70,23.68 C219.81,13.54 213.81,9.74 197.75,9.17 L 187.00 8.78 L 187.00 42.23 L 197.36 41.84 C206.77,41.49 208.16,41.19 212.51,38.48 ZM 218.00 90.92 C230.38,91.35 249.11,91.76 259.64,91.85 L 260.81 91.86 C274.28,91.97 278.30,92.00 279.50,90.18 C280.00,89.40 280.00,88.30 280.00,86.72 C280.00,86.61 280.00,86.50 280.00,86.39 L 280.00 83.95 L 271.75 84.73 C267.21,85.15 230.79,85.50 190.82,85.50 C121.73,85.50 105.18,86.03 133.00,87.35 C161.85,88.72 196.95,90.19 218.00,90.92 ZM 109.79 37.50 L 111.97 33.00 L 127.83 33.00 L 129.55 37.50 C131.13,41.63 131.55,42.00 134.72,42.00 C136.62,42.00 138.02,41.60 137.83,41.12 C137.65,40.64 134.16,33.21 130.09,24.62 C122.87,9.42 122.59,9.00 119.59,9.02 C116.58,9.03 116.31,9.43 109.24,24.77 C105.25,33.42 101.98,40.84 101.99,41.25 C101.99,41.66 103.26,42.00 104.80,42.00 C107.13,42.00 107.97,41.24 109.79,37.50 ZM 275.75 76.83 C273.87,73.90 271.59,70.89 270.68,70.14 C269.19,68.91 269.33,68.58 272.25,66.61 C276.52,63.73 277.93,59.75 275.94,56.20 C273.66,52.14 270.41,51.03 260.75,51.01 L 252.00 51.00 L 252.00 66.50 C252.00,81.33 252.09,82.00 254.00,82.00 C255.80,82.00 256.00,81.33 256.00,75.20 L 256.00 68.41 L 260.71 68.95 C265.12,69.47 265.69,69.88 269.62,75.49 C273.14,80.51 277.26,83.62 278.83,82.42 C279.02,82.28 277.63,79.77 275.75,76.83 ZM 239.30 36.04 C232.71,32.02 232.60,21.04 239.09,15.57 C241.38,13.65 243.28,13.00 246.63,13.00 C255.11,13.00 259.00,16.93 259.00,25.50 C259.00,31.16 257.32,34.79 253.85,36.57 C249.93,38.60 243.09,38.35 239.30,36.04 ZM 193.00 12.73 L 199.45 13.24 C207.84,13.92 212.07,16.37 213.91,21.63 C215.19,25.30 215.15,26.03 213.41,29.58 C210.98,34.56 204.60,38.00 197.79,38.00 L 193.00 38.00 ZM 131.00 67.00 L 131.00 51.00 L 128.13 51.00 C125.35,51.00 125.14,51.38 120.90,63.96 C118.49,71.09 116.24,76.61 115.89,76.21 C115.54,75.82 114.23,72.35 112.99,68.50 C107.70,52.12 107.12,51.00 103.93,51.00 L 101.00 51.00 L 101.00 66.50 C101.00,81.33 101.09,82.00 103.00,82.00 C104.89,82.00 105.00,81.31 105.06,69.75 L 105.11 57.50 L 109.41 69.50 C112.82,79.01 114.13,81.56 115.74,81.80 C117.82,82.12 118.23,81.24 124.94,62.00 L 126.85 56.50 L 126.93 69.08 C127.00,81.77 127.24,83.00 129.67,83.00 C130.72,83.00 131.00,79.67 131.00,67.00 ZM 168.68 41.06 C174.95,38.21 176.00,35.35 176.00,21.05 L 176.00 9.00 L 170.00 9.00 L 170.00 21.33 C170.00,32.89 169.86,33.78 167.70,35.81 C165.05,38.30 159.76,39.16 155.74,37.76 C150.79,36.03 150.00,33.70 150.00,20.78 L 150.00 9.00 L 144.00 9.00 L 144.01 21.25 C144.02,28.95 144.49,34.43 145.27,36.00 C146.99,39.49 154.41,43.00 159.96,42.98 C162.46,42.97 166.38,42.10 168.68,41.06 ZM 140.00 78.00 L 141.75 73.50 L 148.23 73.21 L 154.70 72.92 L 156.79 77.96 C158.35,81.70 159.42,83.00 160.94,83.00 C162.08,83.00 163.00,82.69 163.00,82.32 C163.00,81.94 160.19,74.75 156.75,66.33 C148.33,45.73 148.21,45.73 140.07,66.55 C136.73,75.11 134.00,82.34 134.00,82.62 C134.00,82.91 134.96,83.00 136.13,82.82 C137.59,82.60 138.80,81.10 140.00,78.00 ZM 184.45 81.58 C190.82,78.93 192.06,71.91 186.92,67.59 C185.23,66.17 183.29,65.00 182.60,65.00 C179.54,65.00 171.15,61.84 170.64,60.49 C168.31,54.45 181.51,51.63 184.22,57.59 C185.44,60.27 189.00,60.89 189.00,58.42 C189.00,57.56 187.68,55.53 186.08,53.92 C183.55,51.40 182.40,51.00 177.63,51.00 C170.74,51.00 166.67,53.91 166.67,58.83 C166.67,63.19 169.39,65.77 175.93,67.63 C182.98,69.62 186.00,71.53 186.00,73.97 C186.00,79.03 175.76,80.85 171.45,76.55 C170.10,75.20 169.00,73.62 169.00,73.05 C169.00,73.62 168.10,72.00 167.00,72.00 C164.61,72.00 164.60,72.10 166.46,76.56 C168.87,82.33 177.14,84.64 184.45,81.58 ZM 246.00 80.50 C246.00,79.27 244.28,79.00 236.50,79.00 L 227.00 79.00 L 227.00 68.00 L 235.50 68.00 C243.52,68.00 244.00,67.88 244.00,65.86 C244.00,63.79 243.73,63.75 235.50,64.41 L 227.00 65.10 L 227.00 55.00 L 236.00 55.00 C244.33,55.00 245.00,54.85 245.00,53.00 C245.00,51.12 244.33,51.00 234.00,51.00 L 223.00 51.00 L 223.00 82.00 L 234.50 82.00 C244.06,82.00 246.00,81.75 246.00,80.50 ZM 99.00 40.00 C99.00,38.21 98.33,38.00 92.50,38.00 L 86.00 38.00 L 86.00 9.00 L 80.00 9.00 L 80.00 42.00 L 89.50 42.00 C98.33,42.00 99.00,41.86 99.00,40.00 ZM 208.00 68.55 L 208.00 55.10 L 213.24 54.80 C217.29,54.57 218.56,54.10 218.81,52.75 C219.12,51.16 218.01,51.00 206.57,51.00 C194.67,51.00 194.00,51.11 194.00,53.00 C194.00,54.73 194.67,55.00 199.00,55.00 L 204.00 55.00 L 204.00 68.50 C204.00,81.33 204.10,82.00 206.00,82.00 C207.90,82.00 208.00,81.33 208.00,68.55 ZM 262.94 55.00 C268.88,55.00 270.10,55.31 271.37,57.11 C274.60,61.73 270.84,65.00 262.31,65.00 L 256.00 65.00 L 256.00 55.00 ZM 114.93 25.75 C115.42,24.51 116.69,21.57 117.76,19.22 L 119.71 14.94 L 121.94 20.22 C123.17,23.12 124.41,26.06 124.70,26.75 C125.07,27.66 123.71,28.00 119.63,28.00 C114.25,28.00 114.08,27.92 114.93,25.75 ZM 144.00 68.04 C144.00,67.51 144.96,64.50 146.14,61.35 L 148.28 55.62 L 150.01 60.06 C150.15,60.41 150.27,60.74 150.40,61.06 L 150.40 61.06 C152.25,65.81 153.00,67.73 152.36,68.49 C151.93,69.01 150.88,69.01 149.12,69.00 C148.94,69.00 148.76,69.00 148.57,69.00 C146.06,69.00 144.00,68.57 144.00,68.04 ZM 42.66 31.00 C39.18,31.18 36.52,31.25 34.48,31.55 C36.02,31.22 37.69,31.00 38.97,31.00 Z" fill="rgb(196,197,202)"/>
<path d="M 218.00 90.92 C196.95,90.19 161.85,88.72 133.00,87.35 C105.18,86.03 121.73,85.50 190.82,85.50 C230.79,85.50 267.21,85.15 271.75,84.73 L 280.00 83.95 L 280.00 86.39 C280.00,92.12 280.40,92.01 259.64,91.85 C249.11,91.76 230.38,91.35 218.00,90.92 ZM 28.00 59.92 C28.00,29.25 26.45,31.98 44.50,30.90 C51.10,30.50 57.74,29.86 59.25,29.48 L 62.00 28.78 L 62.00 54.84 L 62.00 80.91 L 58.25 81.95 C56.19,82.52 50.22,83.01 45.00,83.04 C39.73,83.07 33.83,83.68 31.75,84.43 L 28.00 85.76 L 28.00 59.92 Z" fill="rgb(240,138,54)"/>
</g>
</svg>`;

async function svgParaPngBase64(svgString: string, largura = 300, altura = 96): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("Não foi possível criar contexto 2D");

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.clearRect(0, 0, largura, altura);
      ctx.drawImage(img, 0, 0, largura, altura);
      const pngBase64 = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);
      resolve(pngBase64);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function textoCelula(texto: string, negrito = false) {
  return new Paragraph({
    children: [new TextRun({ text: texto, bold: negrito, size: 18, font: "Arial" })],
    spacing: { before: 80, after: 80 },
  });
}

function criarTabelaWord(tabela: TabelaRelatorio) {
  const borda = { style: BorderStyle.SINGLE, size: 1, color: "7A7F87" };
  const linhas = [tabela.cabecalho, ...tabela.linhas].map(
    (linha, indice) =>
      new TableRow({
        children: linha.map(
          (valor) =>
            new TableCell({
              children: [textoCelula(valor, indice === 0)],
              borders: { top: borda, bottom: borda, left: borda, right: borda },
              margins: { top: 80, bottom: 80, left: 90, right: 90 },
              width: { size: Math.floor(100 / linha.length), type: WidthType.PERCENTAGE },
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: linhas,
  });
}

function paragrafosBloco(bloco: BlocoTextoRelatorio) {
  return [
    new Paragraph({ text: bloco.titulo, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } }),
    ...bloco.paragrafos.map(
      (paragrafo) =>
        new Paragraph({
          children: [new TextRun({ text: paragrafo, size: 22, font: "Arial", color: "333333" })],
          spacing: { after: 160 },
          alignment: AlignmentType.JUSTIFIED,
        }),
    ),
  ];
}

export async function exportarWord(relatorio: RelatorioAvaliacao) {
  const logoPng = await svgParaPngBase64(LOGO_SVG);

  const children = [
    new Paragraph({
      children: [new TextRun({ text: relatorio.titulo, bold: true, size: 34, font: "Arial", color: "0F2D4D" })],
      spacing: { after: 140 },
    }),
    new Paragraph({
      children: [new TextRun({ text: relatorio.subtitulo, size: 22, font: "Arial", color: "333333" })],
      spacing: { after: 240 },
    }),
    new Paragraph({ text: `Gerado em: ${dataHoraBR(relatorio.geradoEm)}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Responsável: ${relatorio.responsavel.nome} | ${relatorio.responsavel.email} | ${relatorio.responsavel.celular}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Imóvel avaliando: ${relatorio.avaliando.descricao}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Área do imóvel avaliando: ${relatorio.avaliando.area}`, spacing: { after: 220 } }),
    ...relatorio.textosFixos.flatMap(paragrafosBloco),
    ...relatorio.tabelas.flatMap((tabela) => [
      new Paragraph({ text: tabela.titulo, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 140 } }),
      criarTabelaWord(tabela),
    ]),
    new Paragraph({ text: "CÁLCULOS DETALHADOS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    ...relatorio.calculosDetalhados.map((linha) => new Paragraph({ text: linha, spacing: { after: 80 } })),
    new Paragraph({ text: "RESULTADO FINAL", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    ...relatorio.resultadoFinal.map((linha, indice) =>
      new Paragraph({
        children: [new TextRun({ text: linha, bold: indice === relatorio.resultadoFinal.length - 1, size: indice === relatorio.resultadoFinal.length - 1 ? 26 : 22 })],
        spacing: { after: 80 },
      }),
    ),
    ...(relatorio.observacoes.length
      ? [
          new Paragraph({ text: "OBSERVAÇÕES", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
          ...relatorio.observacoes.map((linha) => new Paragraph({ text: linha, spacing: { after: 80 } })),
        ]
      : []),
  ];

  const documento = new Document({
    creator: "Calculadora Laudo Master",
    description: relatorio.subtitulo,
    title: relatorio.titulo,
    sections: [{
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoPng,
                  transformation: { width: 150, height: 48 },
                  // @ts-ignore - docx types can be tricky with base64 data URLs
                  type: "png",
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(documento);
  baixarBlob(blob, nomeArquivoRelatorio(relatorio, "docx"));
}

function escreverTextoPdf(doc: jsPDF, texto: string, x: number, y: number, largura: number, tamanho = 10, negrito = false) {
  doc.setFont("helvetica", negrito ? "bold" : "normal");
  doc.setFontSize(tamanho);
  const linhas = doc.splitTextToSize(texto, largura) as string[];
  doc.text(linhas, x, y);
  return y + linhas.length * (tamanho + 4);
}

function garantirEspaco(doc: jsPDF, y: number, altura: number, margem: number) {
  const alturaPagina = doc.internal.pageSize.getHeight();
  if (y + altura <= alturaPagina - margem) return y;

  doc.addPage();
  return margem;
}

function desenharTabelaPdf(doc: jsPDF, tabela: TabelaRelatorio, yInicial: number, margem: number, larguraPagina: number) {
  let y = garantirEspaco(doc, yInicial, 60, margem);
  y = escreverTextoPdf(doc, tabela.titulo, margem, y, larguraPagina, 12, true) + 8;
  const larguraTabela = larguraPagina;
  const larguraColuna = larguraTabela / tabela.cabecalho.length;
  const todasLinhas = [tabela.cabecalho, ...tabela.linhas];

  todasLinhas.forEach((linha, indiceLinha) => {
    const linhasPorCelula = linha.map((valor) => doc.splitTextToSize(valor, larguraColuna - 8) as string[]);
    const alturaLinha = Math.max(...linhasPorCelula.map((linhas) => linhas.length)) * 10 + 10;
    y = garantirEspaco(doc, y, alturaLinha + 8, margem);

    linha.forEach((_, indiceColuna) => {
      const x = margem + indiceColuna * larguraColuna;
      doc.setDrawColor(122, 127, 135);
      doc.rect(x, y, larguraColuna, alturaLinha);
      doc.setFont("helvetica", indiceLinha === 0 ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.text(linhasPorCelula[indiceColuna], x + 4, y + 10);
    });

    y += alturaLinha;
  });

  return y + 18;
}

export async function exportarPdf(relatorio: RelatorioAvaliacao) {
  const logoPng = await svgParaPngBase64(LOGO_SVG);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margem = 42;
  const larguraPagina = doc.internal.pageSize.getWidth() - margem * 2;
  let y = margem;

  // Logo no topo direito
  doc.addImage(logoPng, "PNG", doc.internal.pageSize.getWidth() - margem - 100, y, 100, 32);
  y += 48;

  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, relatorio.titulo, margem, y, larguraPagina, 18, true) + 4;
  doc.setTextColor(51, 51, 51);
  y = escreverTextoPdf(doc, relatorio.subtitulo, margem, y, larguraPagina, 10) + 12;
  y = escreverTextoPdf(doc, `Gerado em: ${dataHoraBR(relatorio.geradoEm)}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Responsável: ${relatorio.responsavel.nome} | ${relatorio.responsavel.email} | ${relatorio.responsavel.celular}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Imóvel avaliando: ${relatorio.avaliando.descricao}`, margem, y, larguraPagina, 9);
  y = escreverTextoPdf(doc, `Área do imóvel avaliando: ${relatorio.avaliando.area}`, margem, y, larguraPagina, 9) + 12;

  relatorio.textosFixos.forEach((bloco) => {
    y = garantirEspaco(doc, y, 90, margem);
    doc.setTextColor(15, 45, 77);
    y = escreverTextoPdf(doc, bloco.titulo, margem, y, larguraPagina, 12, true) + 4;
    doc.setTextColor(51, 51, 51);
    bloco.paragrafos.forEach((paragrafo) => {
      y = escreverTextoPdf(doc, paragrafo, margem, y, larguraPagina, 9) + 6;
    });
  });

  relatorio.tabelas.forEach((tabela) => {
    y = desenharTabelaPdf(doc, tabela, y, margem, larguraPagina);
  });

  y = garantirEspaco(doc, y, 120, margem);
  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, "CÁLCULOS DETALHADOS", margem, y, larguraPagina, 12, true) + 4;
  doc.setTextColor(51, 51, 51);
  relatorio.calculosDetalhados.forEach((linha) => {
    y = garantirEspaco(doc, y, 24, margem);
    y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, 9) + 2;
  });

  y = garantirEspaco(doc, y, 90, margem);
  doc.setTextColor(15, 45, 77);
  y = escreverTextoPdf(doc, "RESULTADO FINAL", margem, y, larguraPagina, 12, true) + 4;
  doc.setTextColor(51, 51, 51);
  relatorio.resultadoFinal.forEach((linha, indice) => {
    y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, indice === relatorio.resultadoFinal.length - 1 ? 11 : 9, indice === relatorio.resultadoFinal.length - 1) + 3;
  });

  if (relatorio.observacoes.length) {
    y = garantirEspaco(doc, y, 70, margem);
    doc.setTextColor(15, 45, 77);
    y = escreverTextoPdf(doc, "OBSERVAÇÕES", margem, y, larguraPagina, 12, true) + 4;
    doc.setTextColor(51, 51, 51);
    relatorio.observacoes.forEach((linha) => {
      y = escreverTextoPdf(doc, linha, margem, y, larguraPagina, 9) + 3;
    });
  }

  doc.save(nomeArquivoRelatorio(relatorio, "pdf"));
}
