import { Redirect } from 'expo-router';
import React from 'react';

export default function HomeScreen() {
  // This instantly bypasses the home screen and loads your live Dashboard!
  return <Redirect href="/dashboard" />;
}