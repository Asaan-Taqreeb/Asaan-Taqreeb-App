import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/app/_context/ThemeContext';
import { Spacing } from '@/app/_constants/theme';

interface AudioPlayerProps {
  audioUrl: string;
  isSender: boolean;
}

export default function AudioPlayer({ audioUrl, isSender }: AudioPlayerProps) {
  const { colors } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (sound) {
        sound.unloadAsync().catch((err) => console.log('Error unloading sound:', err));
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!isMountedRef.current) return;
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0).catch(() => {});
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      } else {
        setIsLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        if (isMountedRef.current) {
          setSound(newSound);
          setIsLoading(false);
        } else {
          newSound.unloadAsync().catch(() => {});
        }
      }
    } catch (error) {
      console.error('Failed to load/play sound:', error);
      setIsLoading(false);
    }
  };

  const formatTime = (millis: number) => {
    if (!millis || isNaN(millis)) return '0:00';
    const seconds = Math.floor(millis / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine standard display colors based on whether it is the current user's message
  const textColor = isSender ? colors.white : colors.textPrimary;
  const progressBg = isSender ? 'rgba(255, 255, 255, 0.25)' : 'rgba(17, 24, 8, 0.1)';
  const progressFill = isSender ? colors.white : colors.primary;

  const percent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePlayPause}
        className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: isSender ? 'rgba(255, 255, 255, 0.2)' : colors.lightGray }}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : isPlaying ? (
          <Pause size={18} color={textColor} fill={textColor} />
        ) : (
          <Play size={18} color={textColor} fill={textColor} style={{ marginLeft: 2 }} />
        )}
      </Pressable>

      <View style={styles.rightContainer}>
        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: progressFill }
            ]}
          />
        </View>

        {/* Time displays */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: textColor }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: textColor, opacity: 0.7 }]}>
            {formatTime(duration || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    paddingVertical: Spacing.xs,
  },
  rightContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
