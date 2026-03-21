import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import type { AcademyBookCategory } from '../data/academyBooks';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  fetchForumTopicsAndComments,
  insertForumTopic,
  insertForumComment,
} from '../lib/academyForum';
import type { ForumTopic, TopicComment } from '../types/academyForum';

export type { ForumTopic, TopicComment };

export type ReadingStatus = 'none' | 'want' | 'reading' | 'done';

function mergeSessionReactions(
  base: Record<string, string[]>,
  overlay?: Record<string, string[]>
): Record<string, string[]> {
  if (!overlay || Object.keys(overlay).length === 0) return base;
  const keys = new Set([...Object.keys(base), ...Object.keys(overlay)]);
  const out: Record<string, string[]> = {};
  keys.forEach((k) => {
    out[k] = Array.from(new Set([...(base[k] || []), ...(overlay[k] || [])]));
  });
  return out;
}

function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  const meta = user?.user_metadata;
  const full = typeof meta?.full_name === 'string' ? meta.full_name : '';
  if (full.trim()) return full.trim();
  const email = user?.email?.split('@')[0];
  return email?.trim() || 'Member';
}

function avatarUrl(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  const meta = user?.user_metadata;
  const u = meta?.avatar_url;
  return typeof u === 'string' && u.length > 0 ? u : null;
}

type AcademyContextValue = {
  readingStatusByBook: Record<string, ReadingStatus>;
  favorites: Record<string, boolean>;
  topicsByCategory: Record<AcademyBookCategory, ForumTopic[]>;
  commentsByTopicId: Record<string, TopicComment[]>;
  forumLoading: boolean;
  refreshForum: () => Promise<void>;
  getTopicComments: (topicId: string) => TopicComment[];
  setReadingStatus: (bookId: string, status: ReadingStatus) => void;
  toggleFavorite: (bookId: string) => void;
  createTopic: (category: AcademyBookCategory, title: string, content: string) => Promise<boolean>;
  addCommentToTopic: (topicId: string, content: string) => Promise<boolean>;
  addReplyToComment: (topicId: string, parentCommentId: string, content: string) => Promise<boolean>;
  toggleCommentReaction: (topicId: string, commentId: string, reaction: string) => void;
};

const AcademyContext = createContext<AcademyContextValue | null>(null);

export function AcademyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [readingStatusByBook, setReadingStatusByBook] = useState<Record<string, ReadingStatus>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [topicsByCategory, setTopicsByCategory] = useState<Record<AcademyBookCategory, ForumTopic[]>>({
    finance: [],
    investments: [],
    entrepreneurship: [],
  });
  const [commentsByTopicId, setCommentsByTopicId] = useState<Record<string, TopicComment[]>>({});
  const [sessionReactions, setSessionReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [forumLoading, setForumLoading] = useState(false);

  const loadForum = useCallback(async () => {
    if (!user?.id) {
      setTopicsByCategory({ finance: [], investments: [], entrepreneurship: [] });
      setCommentsByTopicId({});
      setForumLoading(false);
      return;
    }
    setForumLoading(true);
    try {
      const { topicsByCategory: t, commentsByTopicId: c, error } = await fetchForumTopicsAndComments(supabase);
      if (error) {
        console.warn('[AcademyContext] forum load:', error.message);
      }
      setTopicsByCategory(t);
      setCommentsByTopicId(c);
    } finally {
      setForumLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadForum();
  }, [loadForum]);

  const getTopicComments = useCallback(
    (topicId: string) => {
      const list = commentsByTopicId[topicId] || [];
      return list.map((c) => ({
        ...c,
        reactions: mergeSessionReactions(c.reactions, sessionReactions[c.id]),
      }));
    },
    [commentsByTopicId, sessionReactions]
  );

  const createTopic = useCallback(
    async (category: AcademyBookCategory, title: string, content: string): Promise<boolean> => {
      const cleanTitle = title.trim();
      if (!cleanTitle || !user?.id) return false;
      const { topic, error } = await insertForumTopic(supabase, user.id, {
        category,
        title: cleanTitle,
        content: content.trim(),
        authorName: displayName(user),
        authorAvatarUrl: avatarUrl(user),
      });
      if (error || !topic) {
        console.warn('[AcademyContext] createTopic:', error?.message);
        return false;
      }
      setTopicsByCategory((prev) => ({
        ...prev,
        [category]: [topic, ...(prev[category] || [])],
      }));
      return true;
    },
    [user]
  );

  const addCommentToTopic = useCallback(
    async (topicId: string, content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || !user?.id) return false;
      const { comment, error } = await insertForumComment(supabase, user.id, {
        topicId,
        content: trimmed,
        parentCommentId: null,
        authorName: displayName(user),
        authorAvatarUrl: avatarUrl(user),
      });
      if (error || !comment) {
        console.warn('[AcademyContext] addComment:', error?.message);
        return false;
      }
      setCommentsByTopicId((prev) => ({
        ...prev,
        [topicId]: [comment, ...(prev[topicId] || [])],
      }));
      return true;
    },
    [user]
  );

  const addReplyToComment = useCallback(
    async (topicId: string, parentCommentId: string, content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || !user?.id) return false;
      const { comment, error } = await insertForumComment(supabase, user.id, {
        topicId,
        content: trimmed,
        parentCommentId,
        authorName: displayName(user),
        authorAvatarUrl: avatarUrl(user),
      });
      if (error || !comment) {
        console.warn('[AcademyContext] addReply:', error?.message);
        return false;
      }
      setCommentsByTopicId((prev) => ({
        ...prev,
        [topicId]: [comment, ...(prev[topicId] || [])],
      }));
      return true;
    },
    [user]
  );

  const toggleCommentReaction = useCallback((_topicId: string, commentId: string, reaction: string) => {
    const actorId = user?.id;
    if (!actorId) return;
    setSessionReactions((prev) => {
      const current = prev[commentId] || {};
      const actors = current[reaction] || [];
      const nextActors = actors.includes(actorId)
        ? actors.filter((id) => id !== actorId)
        : [...actors, actorId];
      return {
        ...prev,
        [commentId]: {
          ...current,
          [reaction]: nextActors,
        },
      };
    });
  }, [user?.id]);

  const value = useMemo<AcademyContextValue>(
    () => ({
      readingStatusByBook,
      favorites,
      topicsByCategory,
      commentsByTopicId,
      forumLoading,
      refreshForum: loadForum,
      getTopicComments,
      setReadingStatus: (bookId, status) => {
        setReadingStatusByBook((prev) => ({ ...prev, [bookId]: status }));
      },
      toggleFavorite: (bookId) => {
        setFavorites((prev) => ({ ...prev, [bookId]: !prev[bookId] }));
      },
      createTopic,
      addCommentToTopic,
      addReplyToComment,
      toggleCommentReaction,
    }),
    [
      readingStatusByBook,
      favorites,
      topicsByCategory,
      commentsByTopicId,
      forumLoading,
      loadForum,
      getTopicComments,
      createTopic,
      addCommentToTopic,
      addReplyToComment,
      toggleCommentReaction,
    ]
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error('useAcademy must be used inside AcademyProvider');
  return ctx;
}
