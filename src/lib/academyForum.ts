import type { SupabaseClient } from '@supabase/supabase-js';
import type { AcademyBookCategory } from '../data/academyBooks';
import type { ForumTopic, TopicComment } from '../types/academyForum';

type TopicRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  created_at: string;
};

type CommentRow = {
  id: string;
  topic_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  author_name: string;
  author_avatar_url: string | null;
  created_at: string;
};

function mapTopic(row: TopicRow): ForumTopic {
  return {
    id: row.id,
    category: row.category as AcademyBookCategory,
    title: row.title,
    content: row.content ?? '',
    author: row.author_name || '—',
    authorId: row.author_id,
    authorAvatarUrl: row.author_avatar_url,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): TopicComment {
  return {
    id: row.id,
    topicId: row.topic_id,
    author: row.author_name || '—',
    authorId: row.author_id,
    authorAvatarUrl: row.author_avatar_url,
    parentCommentId: row.parent_comment_id,
    reactions: {},
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function fetchForumTopicsAndComments(
  supabase: SupabaseClient
): Promise<{
  topicsByCategory: Record<AcademyBookCategory, ForumTopic[]>;
  commentsByTopicId: Record<string, TopicComment[]>;
  error: Error | null;
}> {
  const empty: Record<AcademyBookCategory, ForumTopic[]> = {
    finance: [],
    investments: [],
    entrepreneurship: [],
  };

  const { data: topicRows, error: topicErr } = await supabase
    .from('academy_forum_topics')
    .select('id,category,title,content,author_id,author_name,author_avatar_url,created_at')
    .order('created_at', { ascending: false });

  if (topicErr) {
    if (
      topicErr.code === 'PGRST116' ||
      topicErr.message?.includes('does not exist') ||
      topicErr.message?.includes('schema cache')
    ) {
      return { topicsByCategory: empty, commentsByTopicId: {}, error: null };
    }
    return { topicsByCategory: empty, commentsByTopicId: {}, error: new Error(topicErr.message) };
  }

  const topics = ((topicRows ?? []) as TopicRow[]).map(mapTopic);
  const topicsByCategory = { ...empty };
  for (const t of topics) {
    if (topicsByCategory[t.category]) {
      topicsByCategory[t.category].push(t);
    }
  }

  const topicIds = topics.map((t) => t.id);
  const commentsByTopicId: Record<string, TopicComment[]> = {};
  if (topicIds.length === 0) {
    return { topicsByCategory, commentsByTopicId, error: null };
  }

  const { data: commentRows, error: commentErr } = await supabase
    .from('academy_forum_comments')
    .select('id,topic_id,author_id,parent_comment_id,content,author_name,author_avatar_url,created_at')
    .in('topic_id', topicIds)
    .order('created_at', { ascending: false });

  if (commentErr) {
    return { topicsByCategory, commentsByTopicId: {}, error: new Error(commentErr.message) };
  }

  for (const row of (commentRows ?? []) as CommentRow[]) {
    const c = mapComment(row);
    if (!commentsByTopicId[c.topicId]) commentsByTopicId[c.topicId] = [];
    commentsByTopicId[c.topicId].push(c);
  }

  return { topicsByCategory, commentsByTopicId, error: null };
}

export async function insertForumTopic(
  supabase: SupabaseClient,
  userId: string,
  params: {
    category: AcademyBookCategory;
    title: string;
    content: string;
    authorName: string;
    authorAvatarUrl: string | null;
  }
): Promise<{ topic: ForumTopic | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('academy_forum_topics')
    .insert({
      category: params.category,
      title: params.title.trim(),
      content: params.content.trim(),
      author_id: userId,
      author_name: params.authorName.trim() || 'Member',
      author_avatar_url: params.authorAvatarUrl,
    })
    .select('id,category,title,content,author_id,author_name,author_avatar_url,created_at')
    .single();

  if (error || !data) {
    return { topic: null, error: new Error(error?.message || 'insert topic failed') };
  }
  return { topic: mapTopic(data as TopicRow), error: null };
}

export async function insertForumComment(
  supabase: SupabaseClient,
  userId: string,
  params: {
    topicId: string;
    content: string;
    parentCommentId: string | null;
    authorName: string;
    authorAvatarUrl: string | null;
  }
): Promise<{ comment: TopicComment | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('academy_forum_comments')
    .insert({
      topic_id: params.topicId,
      author_id: userId,
      parent_comment_id: params.parentCommentId,
      content: params.content.trim(),
      author_name: params.authorName.trim() || 'Member',
      author_avatar_url: params.authorAvatarUrl,
    })
    .select('id,topic_id,author_id,parent_comment_id,content,author_name,author_avatar_url,created_at')
    .single();

  if (error || !data) {
    return { comment: null, error: new Error(error?.message || 'insert comment failed') };
  }
  return { comment: mapComment(data as CommentRow), error: null };
}
