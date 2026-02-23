import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Pressable,
} from 'react-native';
import { GiftedChat, type IMessage, Bubble, InputToolbar, Send, Day, SystemMessage } from 'react-native-gifted-chat';
import { Check, CheckCheck, Clock, Trash2 } from 'lucide-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocationString } from '@/services/location';
import { getUpcomingEventsString } from '@/services/calendar';
import { useChatStore } from '@/store/chat';
import { useSettingsStore } from '@/store/settings';
import { ConnectionDot } from '@/components/ConnectionDot';
import { TypingIndicator } from '@/components/TypingIndicator';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { VoiceButton } from '@/components/VoiceButton';
import { AttachButton, type MediaAttachment } from '@/components/AttachButton';
import { Message, MessageStatus } from '@/types/message';
import { MessageQueueService } from '@/services/MessageQueueService';
import { MessageStorageService } from '@/services/MessageStorageService';
import { connectionManager } from '@/services/ConnectionManager';
import { ChatEmptyState } from '@/components/ChatEmptyState';


const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const ME = { _id: 'me' };
const QUICK_ACTIONS = [
    {
        label: 'Daily Brief',
        prompt: 'Use workflow action daily_brief and return my concise executive brief with priorities and risks.',
    },
    {
        label: 'Goal Loop',
        prompt: 'Use workflow action goal_plan with goal "Ship my top priority this week" and schedule daily check-ins.',
    },
    {
        label: 'Relationship Nudge',
        prompt: 'Use workflow action relationship_nudge and give me one actionable relationship reminder.',
    },
] as const;

export default function AgentChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    // Ensure id is a string (it could be array technically)
    const agentId = Array.isArray(id) ? id[0] : id;

    const router = useRouter();
    const [giftedMessages, setGiftedMessages] = useState<IMessage[]>([]);
    const insets = useSafeAreaInsets();
    const { agentConnected, agentLatency, messages, addMessage, hydrateMessages, clearMessages, typingAgents } = useChatStore();
    const { agents, attachLocation, attachCalendar } = useSettingsStore();

    const activeAgent = agents.find((a) => a.id === agentId);
    const isTyping = typingAgents[agentId] || false;
    const connected = agentConnected[agentId] ?? false;
    const latencyMs = agentLatency[agentId] ?? null;

    const stripSystemPrefix = useCallback((text: string, isOwn: boolean) => {
        if (isOwn) return text;
        return text.replace(/^\[[^\]]+\]\s*/u, '').trim();
    }, []);

    // Track foreground/background state -> Moved to ConnectionManager
    // Hydrate messages when entering screen
    useEffect(() => {
        if (activeAgent) {
            // Clear previous messages first to avoid flash?
            // For now just hydrate, store will replace.
            hydrateMessages(activeAgent.id);
        }
    }, [activeAgent?.id]);

    // Sync store messages to GiftedChat
    useEffect(() => {
        const mapped: IMessage[] = messages
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((m) => ({
                _id: m.id,
                text: stripSystemPrefix(m.content, m.isOwn),
                createdAt: new Date(m.timestamp),
                user: m.isOwn ? ME : { _id: 'agent', name: activeAgent?.name ?? 'Agent' },
                pending: m.status === MessageStatus.PENDING,
                sent: m.status === MessageStatus.SENT,
                received: m.status === MessageStatus.DELIVERED,
            }));
        setGiftedMessages(mapped);
    }, [messages, activeAgent?.name, stripSystemPrefix]);

    const onSend = useCallback(
        async (newMessages: IMessage[] = []) => {
            if (!activeAgent) return;
            const text = newMessages[0].text;
            if (!text) return;

            const metadata: Record<string, string> = {};
            if (attachLocation) {
                const loc = await getLocationString();
                if (loc) metadata.location = loc;
            }
            if (attachCalendar) {
                const cal = await getUpcomingEventsString(1);
                if (cal) metadata.calendar = cal;
            }

            const messageId = generateId();
            const newMessage: Message = {
                id: messageId,
                msg_id: messageId,
                content: text,
                timestamp: Date.now(),
                isOwn: true,
                agentId: activeAgent.id,
                status: MessageStatus.PENDING,
                metadata: Object.keys(metadata).length ? (metadata as any) : undefined,
            };

            addMessage(activeAgent.id, newMessage);

            if (connected) {
                connectionManager.sendMessage(activeAgent.id, text, messageId);
            } else {
                await MessageQueueService.enqueue(newMessage);
            }
        },
        [attachLocation, attachCalendar, activeAgent?.id, connected, addMessage]
    );

    // Add an image/video bubble immediately and notify the agent about the upload
    const sendMedia = useCallback(
        async (attachment: MediaAttachment) => {
            if (!activeAgent) return;

            // Add a GiftedChat message with the local URI so the preview renders instantly
            const msgId = generateId();
            const giftedMsg: IMessage = {
                _id: msgId,
                text: '',
                createdAt: new Date(),
                user: ME,
                ...(attachment.kind === 'image'
                    ? { image: attachment.localUri }
                    : { video: attachment.localUri }),
            };
            setGiftedMessages((prev) => [giftedMsg, ...prev]);

            // Tell the agent about the file via the normal text channel
            const agentText = `[${attachment.kind === 'video' ? 'Video' : 'Image'} attached: ${attachment.serverPath}]\nPlease use view_image to analyse this file.`;
            if (connected) {
                connectionManager.sendMessage(activeAgent.id, agentText, msgId);
            }
        },
        [activeAgent, connected, setGiftedMessages]
    );

    const renderBubble = useCallback((props: any) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: {
                    backgroundColor: '#005c4b',
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    borderBottomLeftRadius: 10,
                },
                left: {
                    backgroundColor: '#202c33',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 10,
                    borderBottomLeftRadius: 10,
                },
            }}
            textStyle={{
                right: { color: '#e9edef' },
                left: { color: '#e9edef' },
            }}
            renderMessageText={(props: any) => {
                if (!props.currentMessage) return null;
                return (
                    <MarkdownMessage
                        content={props.currentMessage.text}
                        isOwn={props.currentMessage.user._id === ME._id}
                    />
                );
            }}
            renderTicks={(msg: any) => {
                const m = msg;
                if (!m.user || m.user._id !== ME._id) return null;
                const size = 10;
                const color = 'rgba(255,255,255,0.7)';
                if (m.pending) return <Text style={{ marginRight: 2 }}><Clock size={size} color={color} /></Text>;
                if (m.sent && !m.received) return <Text style={{ marginRight: 2 }}><Check size={size} color={color} /></Text>;
                if (m.received) return <Text style={{ marginRight: 2 }}><CheckCheck size={size} color={color} /></Text>;
                return null;
            }}
        />
    ), []);

    const renderInputToolbar = useCallback((props: any) => (
        <InputToolbar
            {...props}
            containerStyle={styles.inputToolbar}
            primaryStyle={styles.inputPrimary}
            renderAccessory={() => (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickActionRow}
                    keyboardShouldPersistTaps="handled"
                >
                    {QUICK_ACTIONS.map((action) => (
                        <Pressable
                            key={action.label}
                            style={styles.quickActionChip}
                            onPress={() =>
                                onSend([{ _id: generateId(), text: action.prompt, createdAt: new Date(), user: ME }])
                            }
                        >
                            <Text style={styles.quickActionText}>{action.label}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        />
    ), [onSend]);

    const renderSend = useCallback((props: any) => (
        <View style={styles.sendRow}>
            {activeAgent?.url && (
                <AttachButton
                    serverUrl={activeAgent.url}
                    onMedia={sendMedia}
                />
            )}
            {activeAgent?.url && (
                <VoiceButton
                    serverUrl={activeAgent.url}
                    onTranscript={(text) =>
                        onSend([{ _id: generateId(), text, createdAt: new Date(), user: ME }])
                    }
                />
            )}
            <Send {...props} containerStyle={styles.sendContainer} isSendButtonAlwaysVisible>
                <View style={[styles.sendBtn, !connected && styles.sendBtnDisabled]}>
                    <Text style={styles.sendIcon}>➤</Text>
                </View>
            </Send>
        </View>
    ), [connected, activeAgent?.url, sendMedia, onSend]);


    const renderFooter = useCallback(() => (
        isTyping ? (
            <View style={styles.typingContainer}>
                <TypingIndicator />
            </View>
        ) : null
    ), [isTyping]);

    const renderChatEmpty = useCallback(() => (
        <ChatEmptyState
            agentName={activeAgent?.name ?? 'Agent'}
            onPrompt={(text) =>
                onSend([{ _id: generateId(), text, createdAt: new Date(), user: ME }])
            }
        />
    ), [activeAgent?.name, onSend]);

    const clearChat = useCallback(() => {
        Alert.alert(
            'Clear chat',
            'This will delete all messages in this conversation. Cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        setGiftedMessages([]);
                        clearMessages();
                        await MessageStorageService.clearMessages(agentId);
                    },
                },
            ],
        );
    }, [agentId, clearMessages]);

    if (!activeAgent) {
        return (
            <SafeAreaView style={styles.safe}>
                <Stack.Screen options={{ headerShown: true, title: 'Agent Not Found' }} />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Agent not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: () => (
                        <View style={styles.headerContent}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarTextSmall}>{activeAgent.name[0].toUpperCase()}</Text>
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{activeAgent.name}</Text>
                                <ConnectionDot connected={connected} connecting={!connected && connectionManager.isConnected(agentId) === false} latency={latencyMs} />

                            </View>
                        </View>
                    ),
                    headerBackTitle: '', // Ensures no text shows
                    headerTintColor: '#fff', // White back arrow
                    headerStyle: { backgroundColor: '#0f172a' },
                    headerShadowVisible: false,
                    headerTitleAlign: 'left',
                    headerRight: () => (
                        <Pressable onPress={clearChat} hitSlop={12} style={{ marginRight: 4 }}>
                            <Trash2 color="#64748b" size={18} strokeWidth={2} />
                        </Pressable>
                    ),
                }}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <GiftedChat
                    messages={giftedMessages}
                    onSend={onSend}
                    user={ME}
                    renderBubble={renderBubble}
                    renderInputToolbar={renderInputToolbar}
                    renderSend={renderSend}
                    isSendButtonAlwaysVisible
                    textInputProps={{
                        placeholder: 'Message',
                        placeholderTextColor: '#94a3b8',
                        keyboardAppearance: 'dark',
                        style: styles.textInput,
                    }}
                    renderDay={(props) => <Day {...props} />}
                    renderSystemMessage={(props) => (
                        <SystemMessage {...props} containerStyle={styles.systemMsgContainer} textStyle={styles.systemMsgText} />
                    )}
                    renderFooter={renderFooter}
                    renderChatEmpty={renderChatEmpty}
                    renderAvatar={null}
                    listProps={{
                        style: { backgroundColor: '#0b141a' },
                        contentContainerStyle: { paddingTop: 8, paddingBottom: 10, paddingHorizontal: 4 },
                    }}
                    minInputToolbarHeight={60}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0f172a' },
    flex: { flex: 1 },
    // Header
    headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: -10 },
    headerTextContainer: { marginLeft: 10, justifyContent: 'center' },
    avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
    avatarTextSmall: { color: '#fff', fontSize: 16, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },

    // Input Toolbar
    inputToolbar: {
        backgroundColor: '#0f172a',
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderTopWidth: 0,
    },
    inputPrimary: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 2,
    },
    composerContainer: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 4,
        justifyContent: 'center',
    },
    textInput: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 20,
        marginTop: 6,
        marginBottom: 6,
    },
    attachBtn: {
        padding: 4,
    },
    attachIcon: {
        color: '#94a3b8',
        fontSize: 24,
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginBottom: 6,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#00af9c', // WhatsApp Teal
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#334155' },
    sendIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
    sendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 4 },
    quickActionRow: {
        paddingHorizontal: 8,
        paddingBottom: 8,
        gap: 8,
    },
    quickActionChip: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    quickActionText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '600',
    },

    systemMsgContainer: { marginVertical: 6 },
    systemMsgText: { color: '#475569', fontSize: 12 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#475569' },
    typingContainer: {
        marginLeft: 12,
        marginBottom: 6,
    },
});
