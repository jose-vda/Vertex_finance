import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import EditGoalScreen from '../screens/EditGoalScreen';
import AddInvestmentScreen from '../screens/AddInvestmentScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import PlanningScreen from '../screens/PlanningScreen';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';
import TopicForumScreen from '../screens/TopicForumScreen';
import TopicThreadScreen from '../screens/TopicThreadScreen';
import PriceAlertsScreen from '../screens/PriceAlertsScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Main">
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
      <Stack.Screen name="AddInvestment" component={AddInvestmentScreen} />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
      <Stack.Screen name="Planning" component={PlanningScreen} options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
      <Stack.Screen name="BookList" component={BookListScreen} options={{ animation: 'slide_from_right', animationDuration: 260 }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ animation: 'slide_from_right', animationDuration: 260 }} />
      <Stack.Screen name="TopicForum" component={TopicForumScreen} options={{ animation: 'slide_from_right', animationDuration: 260 }} />
      <Stack.Screen name="TopicThread" component={TopicThreadScreen} options={{ animation: 'slide_from_right', animationDuration: 260 }} />
      <Stack.Screen
        name="PriceAlerts"
        component={PriceAlertsScreen}
        options={{
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
          // Animação fica toda no ecrã (Reanimated) — evita efeito “duplo” com o stack.
          animation: 'none',
        }}
      />
    </Stack.Navigator>
  );
}
