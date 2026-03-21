-- Fórum da Academia (Vertex) + notificações in-app ao responder tópico ou comentário
-- Executar no SQL Editor do Supabase DEPOIS de supabase_app_notifications.sql
--
-- Regras de notificação (trigger):
-- 1) Comentário de topo (parent null) → notifica o autor do tópico (se não for ele próprio).
-- 2) Resposta a um comentário → notifica o autor do comentário pai (se não for ele próprio).

-- Metadados para deep link / i18n na app (opcional mas recomendado)
alter table public.app_notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.app_notifications.metadata is 'Extra payload (ex.: topic_id para forum_reply).';

-- ─── Tópicos ───
create table if not exists public.academy_forum_topics (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('finance', 'investments', 'entrepreneurship')),
  title text not null,
  content text not null default '',
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  author_avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists academy_forum_topics_category_created_idx
  on public.academy_forum_topics (category, created_at desc);

comment on table public.academy_forum_topics is 'Tópicos do fórum por categoria da Academia.';

-- ─── Comentários ───
create table if not exists public.academy_forum_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.academy_forum_topics (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_comment_id uuid references public.academy_forum_comments (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  author_name text not null default '',
  author_avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists academy_forum_comments_topic_created_idx
  on public.academy_forum_comments (topic_id, created_at desc);

comment on table public.academy_forum_comments is 'Comentários e respostas no fórum da Academia.';

-- ─── RLS ───
alter table public.academy_forum_topics enable row level security;
alter table public.academy_forum_comments enable row level security;

drop policy if exists "forum_topics_select_all" on public.academy_forum_topics;
create policy "forum_topics_select_all"
  on public.academy_forum_topics for select
  to authenticated
  using (true);

drop policy if exists "forum_topics_insert_own" on public.academy_forum_topics;
create policy "forum_topics_insert_own"
  on public.academy_forum_topics for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "forum_topics_update_own" on public.academy_forum_topics;
create policy "forum_topics_update_own"
  on public.academy_forum_topics for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "forum_topics_delete_own" on public.academy_forum_topics;
create policy "forum_topics_delete_own"
  on public.academy_forum_topics for delete
  to authenticated
  using (auth.uid() = author_id);

drop policy if exists "forum_comments_select_all" on public.academy_forum_comments;
create policy "forum_comments_select_all"
  on public.academy_forum_comments for select
  to authenticated
  using (true);

drop policy if exists "forum_comments_insert_own" on public.academy_forum_comments;
create policy "forum_comments_insert_own"
  on public.academy_forum_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "forum_comments_delete_own" on public.academy_forum_comments;
create policy "forum_comments_delete_own"
  on public.academy_forum_comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- ─── Notificação ao inserir comentário ───
create or replace function public.academy_forum_notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_rec public.academy_forum_topics%rowtype;
  p_rec public.academy_forum_comments%rowtype;
  recipient uuid;
  t_title text;
  actor_name text;
  meta jsonb;
begin
  select * into t_rec from public.academy_forum_topics where id = new.topic_id;
  if not found then
    return new;
  end if;

  t_title := left(trim(t_rec.title), 120);
  if t_title is null or t_title = '' then
    t_title := 'Topic';
  end if;

  select coalesce(
    nullif(trim(raw_user_meta_data->>'full_name'), ''),
    nullif(trim(raw_user_meta_data->>'name'), ''),
    split_part(email, '@', 1)
  )
  into actor_name
  from auth.users
  where id = new.author_id;

  actor_name := coalesce(nullif(trim(actor_name), ''), 'Someone');

  if new.parent_comment_id is null then
    recipient := t_rec.author_id;
    if recipient is null or recipient = new.author_id then
      return new;
    end if;
    meta := jsonb_build_object(
      'topic_id', new.topic_id::text,
      'comment_id', new.id::text,
      'kind', 'reply_to_topic',
      'actor_name', actor_name,
      'topic_title', t_title
    );
  else
    select * into p_rec from public.academy_forum_comments where id = new.parent_comment_id;
    if not found then
      return new;
    end if;
    recipient := p_rec.author_id;
    if recipient = new.author_id then
      return new;
    end if;
    meta := jsonb_build_object(
      'topic_id', new.topic_id::text,
      'comment_id', new.id::text,
      'kind', 'reply_to_comment',
      'actor_name', actor_name,
      'topic_title', t_title
    );
  end if;

  insert into public.app_notifications (user_id, title, body, notification_type, metadata)
  values (
    recipient,
    'Forum',
    left(trim(new.content), 200),
    'forum_reply',
    meta
  );

  return new;
end;
$$;

drop trigger if exists trg_academy_forum_comment_notify on public.academy_forum_comments;
create trigger trg_academy_forum_comment_notify
  after insert on public.academy_forum_comments
  for each row
  execute function public.academy_forum_notify_on_comment();

revoke all on function public.academy_forum_notify_on_comment() from public;
