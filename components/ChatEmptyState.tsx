import React, { useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatEmptyStateProps {
    agentName: string;
    onPrompt: (text: string) => void;
}

/** Returns time-of-day greeting */
function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

/** Curated starter prompts — varied across categories */
const ALL_PROMPTS = [
    "What can you help me with?",
    "Summarise my goals so far",
    "Give me a morning briefing",
    "What do you remember about me?",
    "Set a reminder for tomorrow at 9am",
    "Search the web for something interesting",
    "What files are in my workspace?",
    "Help me brainstorm ideas",
    "What's on my calendar today?",
    "Tell me something I should know",
];

/** Pick 4 random prompts, stable per render */
function pickPrompts(): string[] {
    const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
}

export function ChatEmptyState({ agentName, onPrompt }: ChatEmptyStateProps) {
    // Stable on mount so prompts don't shuffle on re-render
    const prompts = useMemo(pickPrompts, []);

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            // GiftedChat inverts the FlatList, so we counter-rotate
            style={{ transform: [{ scaleY: -1 }] }}
        >
            {/* Gradient orb avatar */}
            <View style={styles.orbWrap}>
                <LinearGradient
                    colors={['#a78bfa', '#6366f1', '#38bdf8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.orb}
                />
                <View style={styles.orbShine} />
            </View>

            {/* Greeting */}
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.tagline}>How can {agentName} help you?</Text>
            <Text style={styles.sub}>Choose a prompt below or write your own</Text>

            {/* Prompt chips */}
            <View style={styles.chips}>
                {prompts.map((p) => (
                    <Pressable
                        key={p}
                        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                        onPress={() => onPrompt(p)}
                    >
                        <Text style={styles.chipText}>{p}</Text>
                    </Pressable>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 48,
        gap: 10,
    },
    orbWrap: {
        width: 88,
        height: 88,
        marginBottom: 8,
        borderRadius: 44,
        // Glow effect via shadow
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 24,
        elevation: 12,
    },
    orb: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    orbShine: {
        position: 'absolute',
        top: 10,
        left: 16,
        width: 28,
        height: 14,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.35)',
        transform: [{ rotate: '-20deg' }],
    },
    greeting: {
        fontSize: 26,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'center',
        marginTop: 4,
    },
    tagline: {
        fontSize: 17,
        fontWeight: '500',
        color: '#cbd5e1',
        textAlign: 'center',
    },
    sub: {
        fontSize: 13,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 12,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 4,
    },
    chip: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: '47%',
    },
    chipPressed: {
        backgroundColor: '#2d3f55',
        borderColor: '#6366f1',
    },
    chipText: {
        color: '#e2e8f0',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
});
