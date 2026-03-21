# Price alerts (investments)

## Database

1. Ensure `app_notifications` exists (`supabase_app_notifications.sql`).
2. Run **`supabase_investment_price_alerts.sql`** in the Supabase SQL Editor.

This creates:

- `investment_price_alerts` — user targets (ticker, type, direction, `target_price`, `triggered_at`).
- `trigger_price_alert_if_met(alert_id, observed_price)` — `SECURITY DEFINER` RPC that validates the row belongs to the caller, checks the price condition, sets `triggered_at`, and inserts into `app_notifications`.

## Behaviour

- Preços vêm do mesmo fluxo que a carteira (`fetchAllPrices`). Os tickers dos alertas **ativos** são fundidos com os da carteira para o refresh.
- Após cada fetch de cotações, a app chama o RPC para cada alerta pendente (quando há preço > 0).
- **Não há job em servidor** quando a app está fechada: o utilizador precisa abrir/atualizar a carteira (pull-to-refresh) para avaliar alertas. Para avaliação contínua, seria necessário um Edge Function + cron ou similar.

## App

- **Detalhe do ativo**: botão *Alerta de preço* no cartão hero.
- **Investimentos / Carteira**: *Os meus alertas de preço* (lista e eliminar).
