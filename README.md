# 🚀 AvaliaPro - Avaliação de Imóveis (NBR 14653 & Chauvenet)

Este projeto foi desenvolvido utilizando **React**, **Vite**, e **Tailwind CSS**. Ele foi configurado para gerar um arquivo único (`Single HTML`), o que significa que o resultado final do build não precisa de internet ou de servidor para rodar!

## 📦 Como Instalar e Rodar no seu Computador

Se você baixou a pasta do projeto do GitHub e ela ficou em branco, é porque você precisa instalar as dependências antes de gerar a página final.

Siga este passo a passo:

### 1️⃣ Instalar o Node.js
Se você ainda não tem o Node.js instalado no seu computador, baixe e instale a versão LTS recomendada do site oficial:
🔗 [https://nodejs.org/](https://nodejs.org/)

---

### 2️⃣ Abrir o Terminal na pasta do Projeto
Abra o terminal (Prompt de Comando ou PowerShell no Windows, ou Terminal no Mac/Linux) e navegue até a pasta do projeto que você baixou.

No Windows, você pode segurar a tecla `Shift` e clicar com o botão direito dentro da pasta do projeto, depois selecionar **"Abrir janela do PowerShell aqui"**.

---

### 3️⃣ Instalar as dependências
Com o terminal aberto na pasta do projeto, digite o seguinte comando e aperte **Enter**:
```bash
npm install
```
Este comando vai baixar todas as bibliotecas necessárias para rodar o projeto.

---

### 4️⃣ Rodar o projeto para teste
Para ver o projeto funcionando em tempo real enquanto você edita, digite o seguinte comando:
```bash
npm run dev
```
O terminal vai mostrar um link (ex: `http://localhost:5173`). Segure `Ctrl` e clique no link para abrir a página no seu navegador.

---

### ⚠️ Atenção: Por que a página ficou em branco?
Se você tentou abrir o arquivo `index.html` que está na raiz do projeto direto no navegador, a página vai ficar totalmente em branco! Isso acontece porque os navegadores não conseguem ler código React diretamente sem um servidor de desenvolvimento ou sem antes compilar o código.

---

### 5️⃣ Gerar a página única offline (A melhor parte!)
Para gerar o arquivo final que roda em qualquer lugar sem internet, digite o seguinte comando:
```bash
npm run build
```
Esse comando vai criar uma pasta chamada **`dist`** no seu projeto.
Dentro dela, haverá um arquivo chamado **`index.html`**.

✨ **Esse arquivo `index.html` é tudo o que você precisa!** Você pode copiá-lo para um pen drive, enviá-lo pelo WhatsApp ou executá-lo diretamente no celular. Ele não depende de mais nada e funciona 100% offline.

---

## 💻 Versão Python Offline
Se você também preferir rodar os cálculos no terminal usando Python Puro, a aplicação web tem um botão na aba de Relatório para baixar o script Python automaticamente!

---

## 🛠️ Tecnologias Utilizadas
- **React 19** com TypeScript
- **Vite** para desenvolvimento ultra-rápido
- **Tailwind CSS** para design moderno e responsivo
- **vite-plugin-singlefile** para empacotar o sistema em um único arquivo HTML standalone
