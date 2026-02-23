import { AgentConnection, AgentConnectionOptions, WSInbound } from './websocket';
import { useChatStore } from '@/store/chat';
import { AgentProfile } from '@/store/settings';
import { MessageStatus } from '@/types/message';
import { AppState, AppStateStatus } from 'react-native';
import { showLocalNotification } from '@/services/notifications';

/**
 * Multi-agent ConnectionManager.
 *
 * Maintains one WebSocket connection per agent (keyed by agentId).
 * Any number of agents can be connected simultaneously.
 */
class ConnectionManager {
    private connections = new Map<string, AgentConnection>();
    private agentProfiles = new Map<string, AgentProfile>();
    private appState: AppStateStatus = AppState.currentState;

    constructor() {
        AppState.addEventListener('change', (next) => {
            this.appState = next;
        });
    }

    /** Connect to an agent. No-op if already connected. */
    public connect(agent: AgentProfile) {
        if (this.connections.has(agent.id)) {
            const existing = this.connections.get(agent.id)!;
            if (existing.connected) return; // already up
            existing.connect(); // reconnect if dropped
            return;
        }

        this.agentProfiles.set(agent.id, agent);
        const store = useChatStore.getState();

        const conn = new AgentConnection({
            url: agent.url,
            clientId: agent.clientId,
            token: agent.token,
        });

        conn.onStatusChange = (connected) => {
            // Only update global connected flag if this is the "foreground" agent
            // (the one the user is currently viewing). For background agents we just keep going.
            store.setAgentConnected(agent.id, connected);
            if (connected) {
                store.hydrateMessages(agent.id);
            }
        };

        conn.onLatencyChange = (ms) => {
            store.setAgentLatency(agent.id, ms);
        };

        conn.onMessage = (msg: WSInbound) => {
            const addIncoming = (content: string, kind?: string) => {
                store.addMessage(agent.id, {
                    id: Date.now().toString(),
                    msg_id: Date.now().toString(),
                    content,
                    timestamp: Date.now(),
                    isOwn: false,
                    agentId: agent.id,
                    status: MessageStatus.READ,
                    metadata: kind ? ({ model: kind } as any) : undefined,
                });
                store.setTyping(agent.id, false);
                if (this.appState === 'background' || this.appState === 'inactive') {
                    showLocalNotification(agent.name, content);
                }
            };

            switch (msg.type) {
                case 'message':
                    addIncoming(msg.content);
                    break;

                case 'notification':
                    addIncoming(msg.content, 'notification');
                    break;

                case 'daily_brief':
                    addIncoming(`🗓️ Daily Brief\n\n${msg.content}`, 'daily_brief');
                    break;

                case 'goal_checkin':
                    addIncoming(`🎯 Goal Check-in\n\n${msg.content}`, 'goal_checkin');
                    break;

                case 'workflow_result':
                    addIncoming(`⚙️ Workflow Update\n\n${msg.content}`, 'workflow_result');
                    break;

                case 'text_delta':
                    if (msg.message_id) {
                        const exists = store.messages.some((m) => m.id === msg.message_id);
                        if (!exists) {
                            store.addMessage(agent.id, {
                                id: msg.message_id,
                                msg_id: msg.message_id,
                                content: '',
                                timestamp: Date.now(),
                                isOwn: false,
                                agentId: agent.id,
                                status: MessageStatus.READ,
                            });
                        }
                        store.appendMessageContent(agent.id, msg.message_id, msg.content);
                        store.setTyping(agent.id, false);
                    }
                    break;

                case 'ack':
                    if (msg.msg_id) {
                        store.updateMessageStatus(msg.msg_id, MessageStatus.DELIVERED);
                    }
                    break;

                case 'typing':
                    store.setTyping(agent.id, msg.is_typing);
                    break;
            }
        };

        this.connections.set(agent.id, conn);
        conn.connect();
    }

    /** Disconnect a specific agent. */
    public disconnect(agentId: string) {
        const conn = this.connections.get(agentId);
        if (conn) {
            conn.disconnect();
            this.connections.delete(agentId);
            this.agentProfiles.delete(agentId);
        }
        useChatStore.getState().setAgentConnected(agentId, false);
        useChatStore.getState().setAgentLatency(agentId, 0);
    }

    /** Disconnect all agents. */
    public disconnectAll() {
        for (const id of this.connections.keys()) {
            this.disconnect(id);
        }
    }

    /** Send a message to a specific agent. */
    public sendMessage(agentId: string, content: string, msgId?: string) {
        const conn = this.connections.get(agentId);
        if (conn) {
            conn.sendMessage(content, msgId);
        }
    }

    public isConnected(agentId: string): boolean {
        return this.connections.get(agentId)?.connected ?? false;
    }

    public getConnectedAgentIds(): string[] {
        return [...this.connections.keys()];
    }
}

export const connectionManager = new ConnectionManager();
