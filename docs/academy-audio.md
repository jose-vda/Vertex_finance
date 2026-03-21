# Vertex Academy — Resumo escrito + mini-podcast (áudio)

Este guia alinha produção de conteúdo, hospedagem no Supabase e uso na app (`summaryAudioUrl` / `EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL`).

## 1. Template de roteiro oral (mini-podcast)

**Duração-alvo:** 4–7 minutos falados (~550–900 palavras em português), ou mais curto (3–4 min) se quiser alinhar ao tempo de leitura do resumo escrito.

**Estrutura sugerida:**

1. **Gancho (15–20 s):** Uma pergunta ou situação que o ouvinte reconhece.
2. **Contexto (30–45 s):** Quem é o autor e qual o problema que o livro resolve.
3. **Núcleo (3–5 min):** 3 ideias principais do livro, em linguagem falada (frases curtas; evitar listas com mais de 3 itens seguidos).
4. **Aplicação (45–60 s):** “Esta semana experimente…” (uma ação concreta).
5. **Fecho (15 s):** Lembrete do título e convite a ler o livro completo.

**Revisão humana:** ler em voz alta uma vez; cortar nomes ou números difíceis de pronunciar.

## 2. Voz: TTS vs humana

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **TTS (ElevenLabs, OpenAI TTS, Google/Azure)** | Escala aos 60 livros, voz consistente | Revisar pronúncia de nomes próprios; política de transparência (IA) |
| **Voz humana** | Mais natural e de marca | Mais tempo por ficheiro |

**Recomendação:** uma voz PT (PT-PT ou PT-BR) fixa para todos os episódios; exportar **MP3**, ~128 kbps, mono ou estéreo; normalizar volume (ex.: ~-16 LUFS para voz).

**Normalização (exemplo com ffmpeg):**

```bash
ffmpeg -i entrada.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a libmp3lame -b:a 128k saida.mp3
```

## 3. Pilotos (f-1, i-1, e-1)

1. Escrever roteiro oral para cada um (a partir do `summary` / `topics` na app).
2. Gerar ou gravar áudio; exportar como **`f-1.mp3`**, **`i-1.mp3`**, **`e-1.mp3`**.
3. Criar bucket e fazer upload para a pasta `summaries/` (ver secção 4).
4. Definir `EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL` no `.env` apontando à pasta pública (sem nome do ficheiro).
5. Na app: Academy → abrir cada livro → testar **Ouvir resumo**.

## 4. Supabase Storage — bucket `academy-audio`

### No Dashboard

1. **Storage → New bucket** → nome: `academy-audio`.
2. Marcar **Public bucket** (leitura anónima) para simplificar o player na app.  
   *Alternativa privada:* exige URLs assinadas na app (não implementado no MVP atual).

### Estrutura de ficheiros

```
academy-audio/
  summaries/
    f-1.mp3
    f-2.mp3
    …
    e-20.mp3
```

O `book.id` na app (ex. `f-1`) deve coincidir com o nome do ficheiro **`{id}.mp3`**.

### URL base para a app

Copiar a URL pública até à pasta `summaries` (sem barra final obrigatória; a app normaliza). Exemplo:

`https://<project>.supabase.co/storage/v1/object/public/academy-audio/summaries`

No `.env`:

```env
EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL=https://<project>.supabase.co/storage/v1/object/public/academy-audio/summaries
```

### Política SQL (se o bucket não for totalmente público via UI)

Ajuste o nome do bucket se necessário. Leitura pública para objetos em `summaries`:

```sql
-- Permitir leitura pública dos resumos em áudio (bucket academy-audio, pasta summaries)
CREATE POLICY "Public read academy summaries"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'academy-audio' AND (storage.foldername(name))[1] = 'summaries');
```

*(Se já usares políticas genéricas de bucket público, este passo pode ser redundante.)*

## 5. App — como funciona

- Se `EXPO_PUBLIC_ACADEMY_AUDIO_BASE_URL` estiver definido, cada livro recebe  
  `{BASE}/{book.id}.mp3` em `summaryAudioUrl`.
- **Sem** essa variável, há ainda **2 pré-visualizações** no código (`f-1` e `i-1`) com MP3 públicos de teste — só para confirmar que o player funciona; não são os teus podcasts finais.
- O player só aparece quando `summaryAudioUrl` tem texto; com a base URL preenchida, **todos** os livros mostram o player — o ficheiro tem de existir no storage ou o utilizador verá erro ao dar play.
- Para desativar áudio globalmente, remova ou comente a variável no `.env` e reinicie o bundler.

## 6. QA (web, iOS, Android)

- [ ] URL do MP3 abre no browser (stream/download).
- [ ] Modal do livro: play, pausa, barra de progresso.
- [ ] Fechar o modal: áudio para.
- [ ] **Web:** CORS normalmente OK com Supabase público; se falhar, confirmar bucket público e URL exata do objeto.

## 7. Resumos escritos completos

Investimentos (`i-1` … `i-20`) e Empreendedorismo (`e-1` … `e-20`) têm blocos editoriais no código (ficheiro `academyExtendedContent.ts`), no mesmo espírito que Finanças: texto base longo + expansão didática via `getReadableBookSummary` no modal.
