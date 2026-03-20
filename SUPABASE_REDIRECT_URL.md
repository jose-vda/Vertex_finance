# Recuperação de palavra-passe – URL no Supabase

## O que colocar no Supabase

1. Abre o teu projeto no [Supabase](https://supabase.com).
2. Vai a **Authentication** → **URL Configuration**.
3. Em **Redirect URLs** adiciona (consoante o que usas):

   **Para a app móvel (recuperação de palavra-passe):**
   ```
   vertexfinance://reset-password
   ```

   **Para testar na web (localhost):**  
   Se usas `npm run web` em `http://localhost:8081`, adiciona também:
   ```
   http://localhost:8081
   http://localhost:8081/**
   ```

4. Para evitar "Failed to fetch" ao criar conta / login na web, em **Site URL** podes usar em desenvolvimento:
   ```
   http://localhost:8081
   ```

5. Clica em **Save**.

Para o scheme da app (vertexfinance) não uses `https://` nem barra no fim. Para localhost, as URLs acima são as corretas.

Opcional: podes também adicionar `vertexfinance://**` para aceitar outros paths no futuro.

---

## Importante: onde abrir o link do email

O link que recebes no email deve ser aberto **no telemóvel onde tens a app Vertex Finance instalada**.

- Se abrires no **computador**, o browser vai tentar abrir `vertexfinance://...` e vai dar erro ou página em branco, porque no PC não existe essa app.
- No **telemóvel** (com a app instalada), ao tocar no link o sistema abre a app no ecrã de “Definir nova palavra-passe”.

Se estiveres a testar no simulador/emulador, envia o email para uma conta que consigas abrir no mesmo dispositivo onde corre a app.
