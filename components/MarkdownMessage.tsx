import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Platform, Pressable, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface MarkdownMessageProps {
    content: string;
    isOwn: boolean;
}

export function MarkdownMessage({ content, isOwn }: MarkdownMessageProps) {
    const [expanded, setExpanded] = useState(false);
    const isLong = content.length > 700;
    const rendered = useMemo(() => {
        if (expanded || !isLong) return content;
        return content.slice(0, 700).trimEnd() + '\n\n...';
    }, [content, expanded, isLong]);

    // Use simple Markdown for better performance in list
    return (
        <View style={styles.container}>
            <Markdown
                style={{
                    body: {
                        color: isOwn ? '#ffffff' : '#f1f5f9',
                        fontSize: 15,
                        lineHeight: 21,
                        padding: 0,
                        margin: 0,
                    },
                    paragraph: {
                        marginBottom: 6, // Reduced from 8
                        marginTop: 0,
                        flexWrap: 'wrap',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        width: '100%',
                    },
                    link: {
                        color: isOwn ? '#bae6fd' : '#38bdf8',
                        textDecorationLine: 'underline',
                    },
                    code_inline: {
                        backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        fontSize: 14,
                    },
                    fence: {
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderWidth: 1,
                        borderRadius: 6,
                        padding: 8,
                        marginVertical: 4,
                    },
                    code_block: {
                        color: '#e2e8f0',
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        fontSize: 13,
                    },
                    list_item: {
                        marginVertical: 2,
                    },
                }}
                rules={{
                    fence: (node: any, children: any, parent: any, styles: any) => {
                        return (
                            <SyntaxHighlighter
                                key={node.key}
                                language={node.sourceInfo ? node.sourceInfo.toLowerCase() : 'text'}
                                style={atomOneDark}
                                highlighter={"hljs"}
                                fontSize={12}
                                customStyle={{
                                    padding: 10,
                                    borderRadius: 6,
                                    marginVertical: 4,
                                    backgroundColor: '#0f172a',
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                }}
                            >
                                {node.content}
                            </SyntaxHighlighter>
                        );
                    }
                }}
            >
                {rendered}
            </Markdown>
            {isLong && (
                <Pressable
                    style={styles.readMoreBtn}
                    onPress={() => setExpanded((v) => !v)}
                >
                    <Text style={styles.readMoreText}>{expanded ? 'Show less' : 'Read more'}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    readMoreBtn: {
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    readMoreText: {
        color: '#93c5fd',
        fontSize: 12,
        fontWeight: '600',
    }
});
