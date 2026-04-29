import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { HapticTab } from '../../components/haptic-tab'; 

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
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="shared" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} /> 

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tanks',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "bar-chart" : "bar-chart-outline"} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "time" : "time-outline"} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person-circle' : 'person-circle-outline'} 
              size={26} 
              color={color} 
            />
            ),
          }}
        />
    </Tabs>
  );
}