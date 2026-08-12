import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { X, ArrowLeft, ArrowRight, Plus } from 'lucide-react-native';
import { MediaAsset } from '../types';
import { CONFIG } from '../constants/Config';
import { IconButton } from './IconButton';
import { cn } from './Button';

interface ImageGridProps {
  media: MediaAsset[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  className?: string;
}

export function ImageGrid({ media, onAdd, onRemove, onReorder, className }: ImageGridProps) {
  const isFull = media.length >= CONFIG.MAX_IMAGES;

  return (
    <View className={cn('w-full', className)}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-slate-700">
          Media ({media.length}/{CONFIG.MAX_IMAGES})
        </Text>
        {isFull && (
          <Text className="text-xs text-amber-600 font-medium">Maximum reached</Text>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
        <View className="flex-row items-center gap-3 pr-4">
          {!isFull && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onAdd}
              className="w-28 h-36 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 items-center justify-center"
            >
              <View className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center mb-2">
                <Plus color="#475569" size={20} />
              </View>
              <Text className="text-xs font-medium text-slate-500">Add Media</Text>
            </TouchableOpacity>
          )}

          {media.map((item, index) => (
            <View key={item.id} className="w-28 h-36 rounded-xl overflow-hidden relative border border-slate-200 bg-slate-100">
              <Image
                source={item.uri}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              
              {/* Primary Label */}
              {index === 0 && (
                <View className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 rounded text-white shadow-sm">
                  <Text className="text-[10px] font-bold text-white uppercase">Primary</Text>
                </View>
              )}

              {/* Controls Overlay */}
              <View className="absolute top-1 right-1">
                <IconButton
                  icon={X}
                  size={14}
                  variant="primary"
                  className="w-6 h-6 bg-black/50"
                  onPress={() => onRemove(item.id)}
                />
              </View>

              {/* Reorder Controls */}
              <View className="absolute bottom-2 left-0 w-full flex-row justify-center gap-2">
                {index > 0 && (
                  <IconButton
                    icon={ArrowLeft}
                    size={14}
                    variant="primary"
                    className="w-7 h-7 bg-black/50"
                    onPress={() => onReorder(index, index - 1)}
                  />
                )}
                {index < media.length - 1 && (
                  <IconButton
                    icon={ArrowRight}
                    size={14}
                    variant="primary"
                    className="w-7 h-7 bg-black/50"
                    onPress={() => onReorder(index, index + 1)}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {media.length === 0 && (
        <View className="mt-4 bg-slate-50 p-4 rounded-xl items-center border border-slate-200">
          <Text className="text-slate-500 text-sm mb-3">No images selected yet</Text>
          <Text className="text-slate-400 text-xs text-center mb-4">
            Select up to {CONFIG.MAX_IMAGES} images to create your campaign.
          </Text>
        </View>
      )}
    </View>
  );
}
