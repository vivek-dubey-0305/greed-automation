import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { TextInput } from '../src/components/TextInput';
import { ImageGrid } from '../src/components/ImageGrid';
import { useMediaPicker } from '../src/hooks/useMediaPicker';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { PLATFORMS } from '../src/constants/Platform';
import { cn } from '../src/components/Button';
import { LucideIcon } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { mockGenerateContent } from '../src/services/mock/automationService';

export default function CreateCampaignScreen() {
  const router = useRouter();
  const { pickImages } = useMediaPicker();
  
  const instruction = useCampaignStore(state => state.instruction);
  const postType = useCampaignStore(state => state.postType);
  const media = useCampaignStore(state => state.media);
  const selectedPlatforms = useCampaignStore(state => state.selectedPlatforms);
  
  const setInstruction = useCampaignStore(state => state.setInstruction);
  const addMedia = useCampaignStore(state => state.addMedia);
  const removeMedia = useCampaignStore(state => state.removeMedia);
  const reorderMedia = useCampaignStore(state => state.reorderMedia);
  const togglePlatform = useCampaignStore(state => state.togglePlatform);
  const updatePlatformPost = useCampaignStore(state => state.updatePlatformPost);

  const handleAddImages = async () => {
    const assets = await pickImages(media.length);
    if (assets.length > 0) {
      addMedia(assets);
    }
  };

  const isFormValid = instruction.trim().length > 0 && selectedPlatforms.length > 0;

  const handleGenerate = () => {
    if (!isFormValid) return;
    
    // Switch to processing screen
    router.push('/processing');

    // Start mock generation async
    mockGenerateContent(instruction, selectedPlatforms).then((posts) => {
      // In a real app we'd trigger state updates cleanly
      Object.keys(posts).forEach(platformId => {
        updatePlatformPost(platformId, posts[platformId]);
      });
      // Route pushed from processing screen when done
    });
  };

  return (
    <Screen safeArea={false}>
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Media Section */}
        <View className="mb-6">
          <ImageGrid
            media={media}
            onAdd={handleAddImages}
            onRemove={removeMedia}
            onReorder={reorderMedia}
          />
        </View>

        {/* Instruction Section */}
        <View className="mb-8">
          <TextInput
            label="What do you want to post?"
            placeholder="Example: Announce our new AI workshop and encourage people to register."
            value={instruction}
            onChangeText={setInstruction}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Post Type Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 mb-3">Post Format</Text>
          <View className="flex-row bg-slate-100 p-1 rounded-xl">
            {(['FEED', 'STORY', 'REEL'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => useCampaignStore.getState().setPostType(type)}
                className={cn(
                  'flex-1 py-2.5 items-center rounded-lg',
                  postType === type ? 'bg-white shadow-sm' : ''
                )}
              >
                <Text className={cn(
                  'font-medium text-sm',
                  postType === type ? 'text-blue-600' : 'text-slate-600'
                )}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Platform Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 mb-3">Select Platforms</Text>
          <View className="flex-row flex-wrap gap-3">
            {PLATFORMS.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id);
              // Capitalize first letter for icon component name matching usually (Wait, Lucide icons are not named 'instagram' etc exactly). 
              // We'll use a placeholder text if we can't map it dynamically easily or map icon names manually.
              return (
                <TouchableOpacity
                  key={platform.id}
                  activeOpacity={0.7}
                  disabled={!platform.supported}
                  onPress={() => togglePlatform(platform.id)}
                  className={cn(
                    'w-[47%] p-4 rounded-xl border flex-row items-center',
                    isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white',
                    !platform.supported && 'opacity-50'
                  )}
                >
                  <View className={cn(
                    'w-8 h-8 rounded-full items-center justify-center mr-3',
                    isSelected ? 'bg-blue-600' : 'bg-slate-100'
                  )}>
                    <Text className={cn(
                      'font-bold text-lg',
                      isSelected ? 'text-white' : 'text-slate-600'
                    )}>
                      {platform.name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={cn(
                      'font-semibold',
                      isSelected ? 'text-blue-900' : 'text-slate-800'
                    )}>
                      {platform.name}
                    </Text>
                    {!platform.supported && (
                      <Text className="text-[10px] text-slate-500 mt-0.5">Coming soon</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Area */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-8">
        <Button 
          title="Generate Content" 
          onPress={handleGenerate}
          disabled={!isFormValid}
          size="lg"
        />
      </View>
    </Screen>
  );
}
