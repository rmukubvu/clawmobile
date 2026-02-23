import React, { useState, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Square } from 'lucide-react-native';

interface AudioMessageProps {
    uri: string;
    /** Duration in seconds (optional label) */
    durationSecs?: number;
}

/**
 * A compact audio player that renders inside a GiftedChat bubble via renderCustomView.
 * Tap the play button to start/stop playback.
 */
export function AudioMessage({ uri, durationSecs }: AudioMessageProps) {
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const toggle = useCallback(async () => {
        if (playing && sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setPlaying(false);
            return;
        }

        setLoading(true);
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const { sound: s } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                (status) => {
                    if (!status.isLoaded) return;
                    if (status.didJustFinish) {
                        setPlaying(false);
                        setSound(null);
                    }
                },
            );
            setSound(s);
            setPlaying(true);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [uri, playing, sound]);

    const label = durationSecs ? formatDuration(durationSecs) : '🎤';

    return (
        <View style={styles.row}>
            <Pressable onPress={toggle} style={styles.btn}>
                {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : playing ? (
                    <Square color="#fff" size={14} fill="#fff" />
                ) : (
                    <Play color="#fff" size={14} fill="#fff" />
                )}
            </Pressable>
            <View style={styles.bar} />
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
        minWidth: 160,
    },
    btn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    label: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        minWidth: 28,
    },
});
