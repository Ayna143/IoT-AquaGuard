// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// 1. Import Ionicons which works perfectly on both Android and iOS!
import { Ionicons } from '@expo/vector-icons'; 
import { HapticTab } from '@/components/haptic-tab';

const BLUE = '#1A6BCC';
const GRAY = '#9CA3AF'; 
const NAV_BG = '#FFFFFF';
const BORDER = '#E4E8F0';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="dashboard" 
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor: NAV_BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
          
          height: Platform.OS === 'ios' ? 88 : 70, 
          
          paddingBottom: Platform.OS === 'ios' ? 28 : 14, 
          
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      {/* --- HIDDEN ROUTES --- */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="shared" options={{ href: null }} />
      <Tabs.Screen name="view-tank" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} /> 

      {/* --- VISIBLE TABS --- */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tanks',
          // 2. Updated to use Ionicons (bar-chart / bar-chart-outline)
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "bar-chart" : "bar-chart-outline"} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          // Updated to use Ionicons (time / time-outline)
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "time" : "time-outline"} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          // Updated to use Ionicons (settings / settings-outline)
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "settings" : "settings-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}