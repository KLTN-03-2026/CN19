import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import EventSelectScreen from '../screens/EventSelectScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventStatsScreen from '../screens/EventStatsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        statusBarStyle: 'light'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EventSelect" component={EventSelectScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EventStats" component={EventStatsScreen} />
    </Stack.Navigator>
  );
}
