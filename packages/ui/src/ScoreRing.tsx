import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, scoreLabel } from '@app/shared';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 12, label }: ScoreRingProps) {
  const { label: status, color } = scoreLabel(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#E5E5EA',
          },
        ]}
      />
      <View
        style={[
          styles.foreground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
          },
        ]}
      />
      <View style={styles.center}>
        <Text style={[styles.score, { fontSize: size * 0.32 }]}>{score}</Text>
        <Text style={[styles.status, { fontSize: size * 0.13, color }]}>
          {label ?? status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  foreground: {
    position: 'absolute',
    borderStyle: 'solid',
    transform: [{ rotate: '-45deg' }],
  },
  center: {
    alignItems: 'center',
  },
  score: {
    fontWeight: '700',
    color: COLORS.text,
  },
  status: {
    marginTop: 2,
    fontWeight: '600',
  },
});
