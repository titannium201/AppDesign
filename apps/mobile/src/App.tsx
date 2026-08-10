import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import type { RootStackParamList, MainTabParamList } from '@app/shared';
import { COLORS } from '@app/shared';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileFormScreen } from './screens/ProfileFormScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ScanSelectScreen } from './screens/ScanSelectScreen';
import { ScanPrepareScreen } from './screens/ScanPrepareScreen';
import { ScanningScreen } from './screens/ScanningScreen';
import { ScanReportScreen } from './screens/ScanReportScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: 88,
          paddingTop: 8,
          backgroundColor: COLORS.card,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '恢复', tabBarIcon: () => <Text>🏃</Text> }}
      />
      <MainTab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: '记录', tabBarIcon: () => <Text>📊</Text> }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '我的', tabBarIcon: () => <Text>👤</Text> }}
      />
    </MainTab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootStack.Navigator
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          initialRouteName="Welcome">
          <RootStack.Screen name="Welcome" component={WelcomeScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="ProfileForm" component={ProfileFormScreen} />
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="ScanSelect" component={ScanSelectScreen} />
          <RootStack.Screen name="ScanPrepare" component={ScanPrepareScreen} />
          <RootStack.Screen name="Scanning" component={ScanningScreen} />
          <RootStack.Screen name="ScanReport" component={ScanReportScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
