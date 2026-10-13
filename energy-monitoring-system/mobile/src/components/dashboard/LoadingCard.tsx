/**
 * LoadingCard Component
 * 
 * Animated skeleton placeholder shown while data is loading.
 * Provides visual feedback during initial data fetch.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingCardProps {
  height?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ height = 100 }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create pulsing animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={[styles.card, { minHeight: height }]}>
      <Animated.View style={[styles.skeleton, styles.titleSkeleton, { opacity }]} />
      <Animated.View style={[styles.skeleton, styles.valueSkeleton, { opacity }]} />
      <Animated.View style={[styles.skeleton, styles.unitSkeleton, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  titleSkeleton: {
    width: '40%',
    height: 14,
    marginBottom: 12,
  },
  valueSkeleton: {
    width: '60%',
    height: 32,
    marginBottom: 8,
  },
  unitSkeleton: {
    width: '30%',
    height: 16,
  },
});

export default LoadingCard;
