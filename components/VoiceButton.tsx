import React, { useRef, useState, useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic } from 'lucide-react-native';

interface VoiceButtonProps {
    /** Called with the transcribed text when recording is done */
    onTranscript: (text: string) => void;
    /** Base URL of the ClawMobile backend — may be ws:// or http:// */
    serverUrl: string;
}

type State = 'idle' | 'recording' | 'transcribing' | 'error';

/** Converts ws:// → http://, wss:// → https://, strips path/query. */
function baseUrl(url: string): string {
    try {
        const u = new URL(url.replace(/^wss?/, (m) => (m === 'wss' ? 'https' : 'http')));
        return `${u.protocol}//${u.host}`;
    } catch {
        return url
            .replace(/^wss:\/\//, 'https://')
            .replace(/^ws:\/\//, 'http://')
            .replace(/(https?:\/\/[^/]+).*/, '$1');
    }
}

/**
 * VoiceButton — hold to record, release to transcribe.
 *
 * Usage:
 *   <VoiceButton onTranscript={(t) => setInputText(t)} serverUrl={agentUrl} />
 */
export function VoiceButton({ onTranscript, serverUrl }: VoiceButtonProps) {
    const [state, setState] = useState<State>('idle');
    const recordingRef = useRef<Audio.Recording | null>(null);
    const scale = useRef(new Animated.Value(1)).current;

    const animatePress = (pressed: boolean) => {
        Animated.spring(scale, {
            toValue: pressed ? 1.2 : 1,
            useNativeDriver: true,
            speed: 30,
        }).start();
    };

    const startRecording = useCallback(async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) return;

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );
            recordingRef.current = recording;
            setState('recording');
            animatePress(true);
        } catch {
            setState('error');
        }
    }, []);

    const stopAndTranscribe = useCallback(async () => {
        const recording = recordingRef.current;
        if (!recording) return;

        animatePress(false);
        setState('transcribing');

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            recordingRef.current = null;

            if (!uri) throw new Error('no uri');

            // Always use http:// — React Native fetch cannot POST to ws:// URLs
            const form = new FormData();
            form.append('file', { uri, name: 'voice.m4a', type: 'audio/m4a' } as any);

            const transcribeUrl = `${baseUrl(serverUrl)}/transcribe`;
            const res = await fetch(transcribeUrl, { method: 'POST', body: form });
            const json = await res.json();

            if (json.error) throw new Error(json.error);
            if (json.text) onTranscript(json.text as string);
            setState('idle');
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        }
    }, [onTranscript, serverUrl]);

    const color = {
        idle: '#6366f1',
        recording: '#ef4444',
        transcribing: '#f59e0b',
        error: '#ef4444',
    }[state];

    return (
        <Pressable
            onPressIn={startRecording}
            onPressOut={stopAndTranscribe}
            disabled={state === 'transcribing'}
        >
            <Animated.View style={[styles.button, { backgroundColor: color, transform: [{ scale }] }]}>
                {state === 'transcribing' ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Mic color="#fff" size={20} strokeWidth={2} />
                )}
                {state === 'recording' && <View style={styles.pulse} />}
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#ef4444',
        opacity: 0.4,
    },
});
