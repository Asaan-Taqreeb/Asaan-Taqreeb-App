import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/app/_context/ThemeContext';
import { Spacing } from '@/app/_constants/theme';

interface AudioPlayerProps {
  audioUrl: string;
  isSender: boolean;
}

export default function AudioPlayer({ audioUrl, isSender }: AudioPlayerProps) {
  const { colors } = useTheme();
  
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const handlePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.duration && status.currentTime >= status.duration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const sInt = Math.floor(seconds);
    const m = Math.floor(sInt / 60);
    const s = sInt % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine standard display colors based on whether it is the current user's message
  const textColor = isSender ? colors.white : colors.textPrimary;
  const progressBg = isSender ? 'rgba(255, 255, 255, 0.25)' : 'rgba(17, 24, 8, 0.1)';
  const progressFill = isSender ? colors.white : colors.primary;

  const durationSec = status.duration || 0;
  const currentTimeSec = status.currentTime || 0;
  const percent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;
  const isLoading = !status.isLoaded;

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
        ) : status.playing ? (
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
            {formatTime(currentTimeSec)}
          </Text>
          <Text style={[styles.timeText, { color: textColor, opacity: 0.7 }]}>
            {formatTime(durationSec)}
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
