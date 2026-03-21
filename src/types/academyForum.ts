import type { AcademyBookCategory } from '../data/academyBooks';

export type ForumTopic = {
  id: string;
  category: AcademyBookCategory;
  title: string;
  content: string;
  author: string;
  authorId: string | null;
  authorAvatarUrl: string | null;
  createdAt: string;
};

export type TopicComment = {
  id: string;
  topicId: string;
  author: string;
  authorId: string | null;
  authorAvatarUrl: string | null;
  parentCommentId: string | null;
  reactions: Record<string, string[]>;
  content: string;
  createdAt: string;
};
