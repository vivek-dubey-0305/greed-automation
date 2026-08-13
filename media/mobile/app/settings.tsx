import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useSocialStore } from '../src/store/useSocialStore';
import { useEffect } from 'react';
import { Share2, Plus, Trash2 } from 'lucide-react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { api } from '../src/services/api';

WebBrowser.maybeCompleteAuthSession();

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', iconName: 'instagram', color: 'text-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', iconName: 'linkedin', color: 'text-blue-600' },
  { id: 'x', name: 'X (Twitter)', iconName: 'twitter', color: 'text-gray-900 dark:text-white' },
];

export default function SettingsScreen() {
  const { accounts, loading, fetchAccounts, disconnectAccount } = useSocialStore();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async (platformId: string) => {
    try {
      // 1. Determine return URL for Expo
      const returnUrl = Linking.createURL('oauth'); // e.g. exp://192.168.1.6:8081/--/oauth

      // 2. Get the auth URL from backend, passing the returnUrl
      const res = await api.get(`/oauth/${platformId}/url?returnUrl=${encodeURIComponent(returnUrl)}`);
      if (!res.url) throw new Error('No URL returned from backend');
      
      const authRes = await WebBrowser.openAuthSessionAsync(res.url, returnUrl);
      
      if (authRes.type === 'success' && authRes.url) {
        // The backend handles the callback and then redirects to greedsocial://oauth?status=success...
        const { queryParams } = Linking.parse(authRes.url);
        
        if (queryParams?.status === 'success') {
          Alert.alert('Success', `Connected to ${platformId}!`);
          fetchAccounts();
        } else if (queryParams?.status === 'error') {
          Alert.alert('Error', (queryParams.message as string) || 'Authentication failed');
        }
      }
    } catch (e: any) {
      Alert.alert('Connection Error', e.message);
    }
  };

  const handleDisconnect = (id: string, platformName: string) => {
    Alert.alert('Disconnect', `Are you sure you want to disconnect ${platformName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount(id) }
    ]);
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      <Stack.Screen options={{ title: 'Connected Accounts' }} />
      
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row items-center space-x-2 mb-6">
          <Share2 className="text-zinc-900 dark:text-zinc-100" size={24} />
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Social Accounts</Text>
        </View>

        {loading && accounts.length === 0 ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : (
          <View className="space-y-4">
            {PLATFORMS.map(platform => {
              const connected = accounts.find(a => a.platform === platform.id);

              return (
                <View 
                  key={platform.id} 
                  className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-white dark:bg-black rounded-full items-center justify-center border border-zinc-200 dark:border-zinc-800 mr-4">
                      <FontAwesome5 name={platform.iconName} size={24} className={platform.color} />
                    </View>
                    <View>
                      <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{platform.name}</Text>
                      {connected ? (
                        <Text className="text-sm text-green-600 dark:text-green-400">
                          Connected as {connected.displayName || connected.username}
                        </Text>
                      ) : (
                        <Text className="text-sm text-zinc-500">Not connected</Text>
                      )}
                    </View>
                  </View>

                  {connected ? (
                    <TouchableOpacity 
                      onPress={() => handleDisconnect(connected.id, platform.name)}
                      className="p-2"
                    >
                      <Trash2 size={20} className="text-red-500" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handleConnect(platform.id)}
                      className="bg-black dark:bg-white px-4 py-2 rounded-full flex-row items-center"
                    >
                      <Plus size={16} className="text-white dark:text-black mr-1" />
                      <Text className="text-white dark:text-black font-semibold">Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
