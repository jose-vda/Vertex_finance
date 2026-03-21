# Centro de notificações (in-app)

## Base de dados

No Supabase → SQL Editor, executa **`supabase_app_notifications.sql`**.

Isto cria a tabela `app_notifications` com RLS: cada utilizador só **lê** e **atualiza** (ex.: marcar como lida) as próprias linhas. **Insert** deve ser feito com **service role** (Edge Function, script ou painel SQL), não pela app com anon key.

## App

- **Sino** no header (ao lado do avatar): abre um **modal** que desce de cima (com overlay e animação); o **badge** vermelho mostra quantas notificações têm `read_at` null.
- O painel lista as últimas 100, pull-to-refresh, toque num item não lido marca como lido. Fecha com **X**, toque fora ou **voltar** (Android).

## Criar uma notificação para um utilizador (exemplo)

No SQL Editor (com permissões adequadas) ou via script com service role:

```sql
insert into public.app_notifications (user_id, title, body, notification_type)
values (
  'UUID_DO_UTILIZADOR',
  'Vertex',
  'Já pode experimentar a nova funcionalidade.',
  'product'
);
```

Em produção, usa uma Edge Function ou o mesmo fluxo que envia push para também inserir aqui.
