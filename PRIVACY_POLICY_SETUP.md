# Política de Privacidade – Configuração

## O que fazer com o ficheiro `Privacypolicies.html`

1. **Alojar o ficheiro**  
   A App Store e a Google Play exigem um **URL público** para a política de privacidade. Tens de publicar o teu HTML num site acessível na internet.

   Opções comuns:
   - **O teu site** – Coloca o ficheiro no teu domínio (ex.: `https://teusite.com/privacy` ou `https://teusite.com/privacy.html`).
   - **GitHub Pages** – Cria um repositório (ex.: `username.github.io`), adiciona o `Privacypolicies.html` e ativa GitHub Pages; o URL será algo como `https://username.github.io/Privacypolicies.html`.
   - **Vercel / Netlify** – Faz deploy de uma pasta com o HTML e usa o URL gerado.
   - **Firebase Hosting** – Faz upload do ficheiro e usa o URL do projeto.

2. **Configurar o URL no app**  
   Assim que tiveres o URL público:
   - Abre `src/constants/legal.ts`.
   - Substitui `'https://example.com/privacy'` pelo URL real da tua política de privacidade.

3. **Onde o utilizador vê a política no app**
   - **Perfil** – No menu do perfil (avatar) há uma linha “Privacy Policy” / “Política de Privacidade” que abre o URL no browser.
   - **Registo** – Na ecrã de criação de conta aparece o texto “By signing up you agree to our Privacy Policy” / “Ao criar conta, concorda com a nossa Política de Privacidade”, clicável e que abre o mesmo URL.

## Resumo

| Passo | Ação |
|-------|------|
| 1 | Publicar `Privacypolicies.html` num site (GitHub Pages, teu domínio, etc.). |
| 2 | Em `src/constants/legal.ts`, definir `PRIVACY_POLICY_URL` com esse URL. |
| 3 | Usar esse mesmo URL quando a App Store / Play Store pedirem o link da política de privacidade. |

Não é necessário incluir o ficheiro HTML dentro do projeto do app; basta que esteja acessível por um URL e que esse URL esteja em `legal.ts`.
