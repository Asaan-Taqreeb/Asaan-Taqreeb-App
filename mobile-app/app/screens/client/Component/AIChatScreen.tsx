import { router } from 'expo-router'
import { ArrowLeft, Send, Bot, Sparkles, Trash2 } from 'lucide-react-native'
import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { getChatById, addMessageToChat, Message, deleteChat } from '@/app/_utils/chatStorage'
import { getAIResponseFromGroq, ChatMessage } from '@/app/_utils/aiAssistantApi'

import { getAllServices } from '@/app/_utils/servicesApi'

const AI_CHAT_ID = 'ai-assistant'
const AI_CHAT_NAME = 'AI Assistant'

export default function AIChatScreen() {
    const insets = useSafeAreaInsets()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const [vendorContext, setVendorContext] = useState('')

    // Load chat history and vendor context on mount
    useEffect(() => {
        loadChatHistory()
        loadVendorContext()
    }, [])

    const loadVendorContext = async () => {
        try {
            const vendors = await getAllServices()
            // Create a compact summary of vendors for the AI
            const summary = vendors.slice(0, 15).map(v => 
                `- ${v.name} (${v.category}): PKR ${v.price || v.packages?.[0]?.price || 'Contact'}, Rating: ${v.rating}, Location: ${v.location}`
            ).join('\n')
            setVendorContext(summary)
        } catch (error) {
            console.error('Failed to load vendor context:', error)
        }
    }

    const loadChatHistory = async () => {
        const chat = await getChatById(AI_CHAT_ID)
        if (chat && chat.messages.length > 0) {
            setMessages(chat.messages)
        } else {
            // Initial welcome message
            const welcomeMessage: Message = {
                id: Date.now(),
                text: "👋 Hi! I'm your **Asaan Taqreeb** AI assistant. I can help you plan your perfect event! Ask me about vendors, packages, pricing, or any questions you have.",
                sender: 'ai',
                timestamp: new Date()
            }
            setMessages([welcomeMessage])
            // Save welcome message
            await addMessageToChat(AI_CHAT_ID, welcomeMessage, {
                type: 'ai',
                name: AI_CHAT_NAME
            })
        }
        setIsLoading(false)
    }

    const handleDeleteChat = () => {
        Alert.alert(
            "Delete Conversation",
            "Are you sure you want to clear your conversation history with the AI Assistant?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        await deleteChat(AI_CHAT_ID)
                        // Reset to welcome message
                        const welcomeMsg: Message = {
                            id: Date.now(),
                            text: "Conversation cleared. How can I help you start over?",
                            sender: 'ai',
                            timestamp: new Date()
                        }
                        setMessages([welcomeMsg])
                        await addMessageToChat(AI_CHAT_ID, welcomeMsg, { 
                            type: 'ai', 
                            name: AI_CHAT_NAME 
                        })
                    }
                }
            ]
        )
    }

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (message.trim() && !isTyping) {
            const userText = message.trim()
            const newMessage: Message = {
                id: Date.now(),
                text: userText,
                sender: 'user',
                timestamp: new Date()
            }
            
            setMessages(prev => [...prev, newMessage])
            setMessage('')
            setIsTyping(true)

            // Save user message
            await addMessageToChat(AI_CHAT_ID, newMessage, {
                type: 'ai',
                name: AI_CHAT_NAME
            })

            // Prepare history for AI (convert to Groq format)
            const history: ChatMessage[] = messages.slice(-5).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }))

            try {
                // Pass vendorContext to get data-driven responses
                const responseText = await getAIResponseFromGroq(userText, history, vendorContext)
                
                const aiResponse: Message = {
                    id: Date.now() + 1,
                    text: responseText,
                    sender: 'ai',
                    timestamp: new Date()
                }

                setMessages(prev => [...prev, aiResponse])
                
                // Save AI response
                await addMessageToChat(AI_CHAT_ID, aiResponse, {
                    type: 'ai',
                    name: AI_CHAT_NAME
                })
            } catch (error) {
                // Fallback handled in the API utility
            } finally {
                setIsTyping(false)
            }
        }
    }

    // Simple markdown-lite renderer for React Native Text
    const renderMessageText = (text: string, isUser: boolean) => {
        const lines = text.split('\n');
        
        return (
            <View>
                {lines.map((line, lineIdx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine && lineIdx !== lines.length - 1) return <View key={lineIdx} style={{ height: 8 }} />;
                    
                    const isBullet = trimmedLine.startsWith('*') || trimmedLine.startsWith('•') || (trimmedLine.startsWith('-') && !trimmedLine.startsWith('---'));
                    const cleanLine = isBullet ? trimmedLine.substring(1).trim() : line;
                    
                    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                    
                    return (
                        <Text
                            key={lineIdx}
                            style={{
                                fontSize: 15,
                                lineHeight: 22,
                                color: isUser ? Colors.white : Colors.textPrimary,
                                marginBottom: lineIdx === lines.length - 1 ? 0 : 4,
                            }}
                        >
                            {isBullet && (
                                <Text style={{ fontWeight: 'bold' }}>• </Text>
                            )}
                            {parts.map((part, index) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                        <Text key={index} style={{ fontWeight: '800' }}>
                                            {part.substring(2, part.length - 2)}
                                        </Text>
                                    );
                                }
                                return part;
                            })}
                        </Text>
                    );
                })}
            </View>
        );
    }

    const formatTime = (date: Date) => {
        const d = new Date(date)
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (isLoading) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <View className='flex-1 justify-center items-center'>
                    <ActivityIndicator color={Colors.primary} />
                    <Text className="mt-4 font-medium" style={{color: Colors.textSecondary}}>Waking up AI Assistant...</Text>
                </View>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View className='flex-row items-center gap-4 px-6 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
                <Pressable
                    className='rounded-full p-2 active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={Colors.primary} size={22} />
                </Pressable>
                <View className='flex-row items-center gap-3 flex-1'>
                    <View className='rounded-xl p-2' style={{backgroundColor: Colors.primary + '15'}}>
                        <Bot color={Colors.primary} size={24} />
                    </View>
                    <View>
                        <Text className='text-lg font-bold' style={{color: Colors.textPrimary}}>AI Partner</Text>
                        <View className="flex-row items-center gap-1">
                            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <Text className='text-[10px] font-bold uppercase tracking-wider' style={{color: Colors.textSecondary}}>Online</Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    className='p-2 active:opacity-70'
                    onPress={handleDeleteChat}
                >
                    <Trash2 color={Colors.textTertiary} size={22} />
                </Pressable>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className='flex-1'
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        className={`mb-6 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <View
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.sender === 'user' ? Colors.primary : Colors.white,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 20,
                                maxWidth: '85%',
                                borderBottomRightRadius: msg.sender === 'user' ? 4 : 20,
                                borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 20,
                                shadowColor: Colors.shadow,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 4,
                                elevation: 3,
                                borderWidth: msg.sender === 'ai' ? 1 : 0,
                                borderColor: Colors.border,
                                flexDirection: 'column',
                            }}
                        >
                            {renderMessageText(msg.text, msg.sender === 'user')}
                        </View>
                        <View className="flex-row items-center mt-1.5 px-1">
                            {msg.sender === 'ai' && <Sparkles size={10} color={Colors.primary} className="mr-1" />}
                            <Text className='text-[10px] font-bold' style={{color: Colors.textTertiary}}>
                                {formatTime(msg.timestamp)}
                            </Text>
                        </View>
                    </View>
                ))}
                
                {isTyping && (
                    <View className='items-start mb-6'>
                        <View className='px-5 py-4 rounded-2xl bg-white border border-gray-100 flex-row items-center gap-3' style={{borderBottomLeftRadius: 4}}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thinking...</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Message Input */}
            <View className='px-5 py-5' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                <View className='flex-row items-center gap-3'>
                    <View className="flex-1 rounded-2xl flex-row items-center px-4 py-1" style={{backgroundColor: Colors.lightGray}}>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder='Describe your event needs...'
                            placeholderTextColor={Colors.textTertiary}
                            className='flex-1 text-sm py-3'
                            style={{color: Colors.textPrimary}}
                            multiline
                            maxLength={500}
                        />
                    </View>
                    <Pressable
                        className='rounded-2xl p-3.5 active:opacity-80 items-center justify-center'
                        style={{backgroundColor: message.trim() && !isTyping ? Colors.primary : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim() || isTyping}
                    >
                        <Send color={Colors.white} size={20} />
                    </Pressable>
                </View>
                <Text className="text-[9px] text-center mt-3 font-bold text-gray-300 uppercase tracking-widest">
                    AI can make mistakes. Verify important info.
                </Text>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.background
    },
})
