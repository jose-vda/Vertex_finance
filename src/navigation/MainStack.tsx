import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import EditGoalScreen from '../screens/EditGoalScreen';
import AddInvestmentScreen from '../screens/AddInvestmentScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import PlanningScreen from '../screens/PlanningScreen';
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
    </Stack.Navigator>
  );
}
