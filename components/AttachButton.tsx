import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paperclip } from 'lucide-react-native';

export interface MediaAttachment {
    localUri: string;
    serverPath: string;
    mimeType: string;
    /** 'image' | 'video' */
    kind: 'image' | 'video';
}

interface AttachButtonProps {
    onMedia: (attachment: MediaAttachment) => void;
    serverUrl: string;
}

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

export function AttachButton({ onMedia, serverUrl }: AttachButtonProps) {
    const handlePress = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo access to attach images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,   // images + videos
            allowsMultipleSelection: false,
            allowsEditing: false,
            quality: 0.85,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = uri.split('/').pop() ?? 'file';
        const mimeType = asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
        const kind: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';

        try {
            const form = new FormData();
            form.append('file', { uri, name: filename, type: mimeType } as any);

            const res = await fetch(`${baseUrl(serverUrl)}/upload`, { method: 'POST', body: form });
            if (!res.ok) { Alert.alert('Upload failed', `Server error ${res.status}`); return; }

            const json = await res.json() as { path?: string; error?: string };
            if (json.error || !json.path) { Alert.alert('Upload failed', json.error ?? 'Unknown error'); return; }

            onMedia({ localUri: uri, serverPath: json.path, mimeType, kind });
        } catch (e: any) {
            Alert.alert('Upload failed', e?.message ?? 'Network error');
        }
    }, [serverUrl, onMedia]);

    return (
        <Pressable onPress={handlePress} style={styles.btn}>
            <Paperclip color="#94a3b8" size={22} strokeWidth={2} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
