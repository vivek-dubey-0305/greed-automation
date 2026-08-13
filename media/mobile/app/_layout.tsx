import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerShadowVisible: false,
          headerTintColor: '#0f172a',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Greed Social',
            headerLargeTitle: true,
          }} 
        />
        <Stack.Screen 
          name="create" 
          options={{ 
            title: 'Create Campaign',
            presentation: 'modal' 
          }} 
        />
        <Stack.Screen 
          name="processing" 
          options={{ 
            headerShown: false,
            gestureEnabled: false
          }} 
        />
        <Stack.Screen 
          name="preview" 
          options={{ 
            title: 'Review Campaign',
            gestureEnabled: false
          }} 
        />
        <Stack.Screen 
          name="result" 
          options={{ 
            title: 'Campaign Status',
            headerBackVisible: false,
            gestureEnabled: false
          }} 
        />
      </Stack>
      <Toast />
    </>
  );
}
