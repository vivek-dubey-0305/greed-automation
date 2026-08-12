import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

const STEPS = [
  'Analyzing your images...',
  'Understanding your campaign...',
  'Adapting content for each platform...',
  'Preparing your previews...'
];

export default function ProcessingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let stepIndex = 0;
    
    // Mock the state transitions
    const interval = setInterval(() => {
      if (stepIndex < STEPS.length - 1) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
        ]).start();
        
        setTimeout(() => {
          stepIndex++;
          setCurrentStep(stepIndex);
        }, 200);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.replace('/preview');
        }, 800);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Screen className="items-center justify-center bg-blue-600">
      <View className="items-center max-w-[80%]">
        <ActivityIndicator size="large" color="white" className="mb-8" />
        
        <View className="h-20 justify-center items-center">
          <Animated.Text 
            style={{ opacity: fadeAnim }} 
            className="text-white text-xl font-medium text-center"
          >
            {STEPS[currentStep]}
          </Animated.Text>
        </View>

        <View className="mt-8 flex-row items-center">
          {STEPS.map((_, idx) => (
            <View 
              key={idx} 
              className={`h-1.5 rounded-full mx-1 ${
                idx === currentStep ? 'w-6 bg-white' : 
                idx < currentStep ? 'w-2 bg-blue-300' : 'w-2 bg-blue-400/50'
              }`} 
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}
