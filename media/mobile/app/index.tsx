import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, InteractionManager } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Settings, Trash2 } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { StatusBadge } from '../src/components/StatusBadge';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { useCallback, useState } from 'react';
import { api } from '../src/services/api';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const router = useRouter();
  const resetCampaign = useCampaignStore(state => state.resetCampaign);
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.data);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchCampaigns();
      });
      return () => task.cancel();
    }, [])
  );

  const handleDelete = (campaignId: string) => {
    Alert.alert(
      "Delete Campaign",
      "Do you want to delete this campaign only from the app, or also delete the published posts from social platforms?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "App Only", 
          onPress: () => performDelete(campaignId, false),
          style: "destructive"
        },
        { 
          text: "App + Social Platforms", 
          onPress: () => performDelete(campaignId, true),
          style: "destructive" 
        }
      ]
    );
  };

  const performDelete = async (campaignId: string, deleteOnPlatforms: boolean) => {
    try {
      await api.deleteCampaign(campaignId, deleteOnPlatforms);
      if (deleteOnPlatforms) {
        Toast.show({
          type: 'success',
          text1: 'Deleted',
          text2: 'Campaign and external posts deleted. (If already deleted on platform, we skipped it).',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Deleted',
          text2: 'Campaign deleted locally.',
        });
      }
      fetchCampaigns();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete campaign',
      });
    }
  };

  const handleCreate = () => {
    resetCampaign();
    router.push('/create');
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="flex-row justify-between items-start mb-8">
          <View>
            <Text className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</Text>
            <Text className="text-base text-slate-500">
              What are we automating today?
            </Text>
          </View>
          
          <Button 
            onPress={() => router.push('/settings')} 
            variant="outline" 
            className="p-3 w-12 h-12 items-center justify-center rounded-full"
          >
            <Settings size={20} className="text-slate-700" />
          </Button>
        </View>

        <Button 
          title="Create New Campaign" 
          onPress={handleCreate}
          size="lg"
          className="mb-10 shadow-sm"
        >
          <View className="flex-row items-center justify-center">
            <Plus color="white" size={20} className="mr-2" />
            <Text className="text-white font-semibold text-lg">Create Campaign</Text>
          </View>
        </Button>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-slate-800">Recent Campaigns</Text>
        </View>

        <View className="gap-4">
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : campaigns.length === 0 ? (
            <Text className="text-slate-500 text-center py-8">No campaigns yet. Create one to get started!</Text>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-slate-900 mb-1" numberOfLines={1}>
                      {campaign.instruction || 'Untitled Campaign'}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {new Date(campaign.createdAt).toLocaleDateString()} at {new Date(campaign.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <TouchableOpacity onPress={() => handleDelete(campaign.id)} className="p-1">
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                {campaign.platforms && campaign.platforms.length > 0 && (
                  <Text className="text-xs text-blue-600 mt-2 font-medium">
                    {campaign.platforms.join(', ')}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
