import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { StatusBadge } from '../src/components/StatusBadge';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { PLATFORMS } from '../src/constants/Platform';

export default function ResultScreen() {
  const router = useRouter();
  const selectedPlatforms = useCampaignStore(state => state.selectedPlatforms);
  const platformPosts = useCampaignStore(state => state.platformPosts);
  const updatePlatformPost = useCampaignStore(state => state.updatePlatformPost);
  const resetCampaign = useCampaignStore(state => state.resetCampaign);
  
  const [isSimulating, setIsSimulating] = useState(true);

  // Simulate Publishing
  useEffect(() => {
    let mounted = true;
    
    selectedPlatforms.forEach((platform, index) => {
      // Set to publishing immediately
      updatePlatformPost(platform, { status: 'PUBLISHING' });

      // Simulate network response
      setTimeout(() => {
        if (!mounted) return;
        
        // Randomly simulate a failure or warning for demonstration
        // Just fail Facebook if it's there to show the retry UI, else succeed.
        if (platform === 'facebook') {
          updatePlatformPost(platform, { 
            status: 'FAILED',
            error: {
              code: 'AUTH_EXPIRED',
              category: 'AUTHENTICATION',
              userMessage: 'Facebook session expired.',
              retryable: true
            }
          });
        } else if (platform === 'x') {
           updatePlatformPost(platform, { status: 'WARNING', warning: 'Media resolution downgraded' });
        } else {
          updatePlatformPost(platform, { status: 'SUCCESS' });
        }
        
        // End simulation after last item
        if (index === selectedPlatforms.length - 1) {
          setIsSimulating(false);
        }
      }, 1500 + (index * 1000));
    });

    return () => { mounted = false; };
  }, []);

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
