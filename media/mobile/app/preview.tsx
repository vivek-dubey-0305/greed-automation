import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { TextInput } from '../src/components/TextInput';
import { StatusBadge } from '../src/components/StatusBadge';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { PLATFORMS } from '../src/constants/Platform';
import { cn } from '../src/components/Button';
import { PlatformPost } from '../src/types';
import { api } from '../src/services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDE_WIDTH = SCREEN_WIDTH - 64; // Account for screen px-4 and Card padding

export default function PreviewScreen() {
  const router = useRouter();
  const selectedPlatforms = useCampaignStore(state => state.selectedPlatforms);
  const platformPosts = useCampaignStore(state => state.platformPosts);
  const updatePlatformPost = useCampaignStore(state => state.updatePlatformPost);
  
  const [activeTab, setActiveTab] = useState(selectedPlatforms[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const media = useCampaignStore(state => state.media);
  const instruction = useCampaignStore(state => state.instruction);
  
  const currentPost = platformPosts[activeTab];
  const platformConfig = PLATFORMS.find(p => p.id === activeTab);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save
      updatePlatformPost(activeTab, { caption: editCaption });
      setIsEditing(false);
    } else {
      // Start edit
      setEditCaption(currentPost?.caption || '');
      setIsEditing(true);
    }
  };

  const handleApprove = (platformId: string) => {
    updatePlatformPost(platformId, { status: 'APPROVED' });
  };

  const allApproved = selectedPlatforms.every(
    p => platformPosts[p]?.status === 'APPROVED'
  );

  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    
    try {
      // 1. Create campaign
      const { data: { campaignId } } = await api.createCampaign(instruction, selectedPlatforms);
      
      // 2. Upload media
      for (const m of media) {
        if (m.base64) {
           await api.addMedia(campaignId, m.base64, 'image', 'jpeg');
        }
      }
      
      // 3. Start campaign
      await api.startCampaign(campaignId);
      
      // Navigate to result with campaignId
      router.push({ pathname: '/result', params: { campaignId } });
    } catch (error: any) {
      console.error('Publish error:', error);
      Alert.alert('Publish Failed', error.message || 'An error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!currentPost) {
    return (
      <Screen className="items-center justify-center">
        <Text>Loading previews...</Text>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      {/* Tabs */}
      <View className="bg-white border-b border-slate-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {selectedPlatforms.map(platformId => {
            const config = PLATFORMS.find(p => p.id === platformId);
            const isActive = activeTab === platformId;
            const post = platformPosts[platformId];
            
            return (
              <TouchableOpacity
                key={platformId}
                onPress={() => {
                  setActiveTab(platformId);
                  setIsEditing(false);
                }}
                className={cn(
                  'px-4 py-4 border-b-2',
                  isActive ? 'border-blue-600' : 'border-transparent'
                )}
              >
                <View className="flex-row items-center">
                  <Text className={cn(
                    'font-medium mr-2',
                    isActive ? 'text-blue-600' : 'text-slate-600'
                  )}>
                    {config?.name}
                  </Text>
                  {post?.status === 'APPROVED' && (
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row items-center justify-between mb-4">
          <StatusBadge status={currentPost.status} />
          <Button 
            title={isEditing ? 'Save' : 'Edit'} 
            variant="ghost" 
            size="sm"
            onPress={handleEditToggle}
            className="px-2 py-1"
            textClassName="text-blue-600"
          />
        </View>

        <Card className="mb-6">
          {media.length > 0 ? (
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                className="w-full h-48 rounded-lg mb-4"
                snapToInterval={SLIDE_WIDTH}
                decelerationRate="fast"
              >
                {media.map((m, index) => (
                  <View key={index} style={{ width: SLIDE_WIDTH }} className="h-48 rounded-lg overflow-hidden">
                    <Image 
                      source={{ uri: m.uri }} 
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
                ))}
              </ScrollView>
              {media.length > 1 && (
                <View className="flex-row justify-center gap-2 mb-4">
                  {media.map((_, idx) => (
                    <View key={idx} className="w-2 h-2 rounded-full bg-slate-300" />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-40 bg-slate-100 rounded-lg border border-slate-200 items-center justify-center mb-4">
              <Text className="text-slate-400">Media Preview</Text>
            </View>
          )}

          {isEditing ? (
            <TextInput
              multiline
              value={editCaption}
              onChangeText={setEditCaption}
              className="min-h-[150px] text-base"
            />
          ) : (
            <>
              <Text className="text-slate-800 text-base leading-relaxed mb-4">
                {currentPost.caption}
              </Text>
              {currentPost.hashtags.length > 0 && (
                <Text className="text-blue-600 font-medium">
                  {currentPost.hashtags.join(' ')}
                </Text>
              )}
            </>
          )}
        </Card>

        {currentPost.status !== 'APPROVED' && !isEditing && (
          <Button
            title={`Approve for ${platformConfig?.name}`}
            onPress={() => handleApprove(activeTab)}
            variant="outline"
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
        <Button
          title={isPublishing ? 'Publishing...' : (allApproved ? 'Publish Now' : 'Approve All & Publish')}
          onPress={() => {
            selectedPlatforms.forEach(p => handleApprove(p));
            handlePublish();
          }}
          disabled={isEditing || isPublishing}
        />
      </View>
    </Screen>
  );
}
