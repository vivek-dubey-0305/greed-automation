import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { MediaAsset } from '../types';
import { CONFIG } from '../constants/Config';

export const useMediaPicker = () => {
  const pickImages = async (currentCount: number): Promise<MediaAsset[]> => {
    if (currentCount >= CONFIG.MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only select up to ${CONFIG.MAX_IMAGES} images.`);
      return [];
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return [];
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: CONFIG.MAX_IMAGES - currentCount,
        quality: 0.8,
      });

      if (result.canceled) {
        return [];
      }

      // Convert to our internal MediaAsset model
      const assets: MediaAsset[] = result.assets.map((asset, index) => ({
        id: asset.assetId || `media-${Date.now()}-${index}`,
        uri: asset.uri,
        type: asset.type || undefined,
        filename: asset.fileName || `image-${Date.now()}-${index}.jpg`,
        width: asset.width,
        height: asset.height,
        size: asset.fileSize,
        order: currentCount + index,
        localStatus: 'selected'
      }));

      return assets;
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An error occurred while picking images.');
      return [];
    }
  };

  return { pickImages };
};
