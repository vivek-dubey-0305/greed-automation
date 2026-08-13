import { View, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { StatusBadge } from '../src/components/StatusBadge';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { PLATFORMS } from '../src/constants/Platform';
import { api } from '../src/services/api';

export default function ResultScreen() {
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const selectedPlatforms = useCampaignStore(state => state.selectedPlatforms);
  const platformPosts = useCampaignStore(state => state.platformPosts);
  const updatePlatformPost = useCampaignStore(state => state.updatePlatformPost);
  const resetCampaign = useCampaignStore(state => state.resetCampaign);
  
  const [isSimulating, setIsSimulating] = useState(true);

  // Poll backend for actual campaign status
  useEffect(() => {
    if (!campaignId) return;
    
    let mounted = true;
    let pollInterval: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      try {
        const { data } = await api.getCampaign(campaignId);
        
        // Map backend state to frontend state
        let allDone = true;

        data.platforms.forEach((cp: any) => {
          // Backend returns uppercase, frontend expects lowercase
          const platform = cp.platform.toLowerCase();
          const post = data.posts.find((p: any) => p.campaignPlatformId === cp.id);
          
          if (!post) {
            updatePlatformPost(platform, { status: 'PUBLISHING' });
            allDone = false;
            return;
          }

          if (post.status === 'PUBLISHED') {
             updatePlatformPost(platform, { status: 'SUCCESS' });
          } else if (post.status === 'FAILED') {
             // Find attempt error
             const attempt = data.attempts.find((a: any) => a.platformPostId === post.id && a.status === 'FAILED');
             updatePlatformPost(platform, { 
               status: 'FAILED',
               error: {
                 code: 'PUBLISH_ERROR',
                 category: 'UNKNOWN',
                 userMessage: attempt?.error || 'Failed to publish post',
                 retryable: false
               }
             });
          } else if (post.status === 'AWAITING_APPROVAL') {
             // We already approved in preview.tsx, so tell backend to approve and publish
             updatePlatformPost(platform, { status: 'PUBLISHING' });
             allDone = false;
             
             // Fire and forget approve call
             api.approvePost(post.id).catch(err => console.error('Failed to auto-approve post:', err));
          } else {
             updatePlatformPost(platform, { status: 'PUBLISHING' });
             allDone = false;
          }
        });

        if (allDone && mounted) {
          setIsSimulating(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial check
    checkStatus();
    
    // Poll every 3 seconds
    pollInterval = setInterval(checkStatus, 3000);

    return () => { 
      mounted = false; 
      clearInterval(pollInterval);
    };
  }, [campaignId]);

  const handleRetry = (platformId: string) => {
    updatePlatformPost(platformId, { status: 'RETRYING' });
    
    setTimeout(() => {
      updatePlatformPost(platformId, { status: 'SUCCESS', error: undefined });
    }, 2000);
  };

  const handleFinish = () => {
    resetCampaign();
    router.replace('/');
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="mb-8 items-center">
          <Text className="text-2xl font-bold text-slate-900 mb-2">
            {isSimulating ? 'Publishing...' : 'Campaign Results'}
          </Text>
          <Text className="text-slate-500 text-center px-4">
            {isSimulating 
              ? 'Please wait while we connect to social platforms.' 
              : 'Your campaign has been processed.'}
          </Text>
        </View>

        <View className="gap-4 mb-8">
          {selectedPlatforms.map(platformId => {
            const config = PLATFORMS.find(p => p.id === platformId);
            const post = platformPosts[platformId];
            
            return (
              <Card key={platformId}>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-semibold text-slate-900">{config?.name}</Text>
                  <StatusBadge status={post?.status || 'IDLE'} />
                </View>
                
                {post?.status === 'FAILED' && post.error && (
                  <View className="mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
                    <Text className="text-red-700 text-sm mb-3">
                      {post.error.userMessage}
                    </Text>
                    {post.error.retryable && (
                      <Button 
                        title="Retry Now" 
                        onPress={() => handleRetry(platformId)} 
                        variant="danger" 
                        size="sm" 
                      />
                    )}
                  </View>
                )}

                {post?.status === 'WARNING' && post.warning && (
                  <View className="mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <Text className="text-amber-700 text-sm">
                      {post.warning}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
        
        {!isSimulating && (
          <Button 
            title="Return Home" 
            onPress={handleFinish} 
            className="mb-8"
          />
        )}
      </ScrollView>
    </Screen>
  );
}
