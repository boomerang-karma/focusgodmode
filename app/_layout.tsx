import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppProvider } from '../src/context/AppContext';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgElevated },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="practice/[drillId]"
            options={{ title: 'Practice', presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="practice/session"
            options={{ title: 'Avadhana Session', presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="practice/builder"
            options={{ title: 'Session builder', presentation: 'modal' }}
          />
          <Stack.Screen name="practice/result" options={{ title: 'Session result' }} />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
