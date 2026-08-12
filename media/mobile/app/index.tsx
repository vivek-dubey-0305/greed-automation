import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Settings } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { StatusBadge } from '../src/components/StatusBadge';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const resetCampaign = useCampaignStore(state => state.resetCampaign);

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

        {/* Mock Recent Campaigns */}
        <View className="gap-4">
          <Card>
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="font-semibold text-slate-900 mb-1">AI Workshop Launch</Text>
                <Text className="text-xs text-slate-500">Today at 10:24 AM</Text>
              </View>
              <StatusBadge status="COMPLETED" />
            </View>
            <Text className="text-sm text-slate-600 mt-2" numberOfLines={2}>
              Announcing our new AI workshop on automation...
            </Text>
          </Card>

          <Card>
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="font-semibold text-slate-900 mb-1">Product Update 2.0</Text>
                <Text className="text-xs text-slate-500">Yesterday</Text>
              </View>
              <StatusBadge status="PARTIALLY_COMPLETED" />
            </View>
            <Text className="text-sm text-slate-600 mt-2" numberOfLines={2}>
              Version 2.0 is out! Here are the new features...
            </Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
