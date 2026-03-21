import type { NavigatorScreenParams } from '@react-navigation/native';
import type { EnrichedInvestment } from '../context/WalletContext';
import type { AssetType } from '../lib/priceService';

export type AssetPreviewParam = {
  ticker: string;
  name?: string | null;
  type: AssetType;
  currentPrice?: number | null;
};

export type MainStackParamList = {
  Main: undefined;
  EditGoal: undefined;
  AddInvestment: undefined;
  AssetDetail: { investment?: EnrichedInvestment; assetPreview?: AssetPreviewParam };
  Planning: undefined;
  BookList: { category: 'finance' | 'investments' | 'entrepreneurship' };
  BookDetail: { bookId: string };
  TopicForum: { category: 'finance' | 'investments' | 'entrepreneurship' };
  TopicThread: { topicId: string };
  PriceAlerts: undefined;
};

export type RootNavigationParams = NavigatorScreenParams<MainStackParamList>;
