import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send } from 'lucide-react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ViewStyle, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/_constants/theme'
import { getChatHistory, sendMessage, markChatAsRead, Message } from '@/app/_utils/messagesApi'
import { useSocket } from '@/app/_context/SocketContext'
import { useUser } from '@/app/_context/UserContext'
import ImageViewerModal from '@/app/_components/ImageViewerModal'

export default function ClientChatScreen() {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    const params = useLocalSearchParams()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewerVisible, setViewerVisible] = useState(false)
    const [viewerImages, setViewerImages] = useState<string[]>([])
    const [viewerIndex, setViewerIndex] = useState(0)

    // Params will include the client's info
    const clientId = params.clientId as string
    const clientName = params.clientName as string || "Client"
    const { socket } = useSocket()
    const { user } = useUser()

    const chatId = (params.chatId as string) || (user?.id && clientId ? `chat_${clientId}_${user.id}` : '')

    const normalizeMessage = useCallback((msg: Message) => {
        const raw = msg as Message & { image?: string; image_url?: string }
        return {
            ...msg,
            imageUrl: raw.imageUrl || raw.image || raw.image_url || '',
        }
    }, [])

    const loadChatHistory = useCallback(async () => {
        if (!chatId) return
        try {
            const history = await getChatHistory(chatId)
            setMessages(history.map(normalizeMessage))
            await markChatAsRead(chatId)
        } catch (error) {
            console.log('Error loading chat history:', error)
        } finally {
            setIsLoading(false)
        }
    }, [chatId, normalizeMessage])

    useEffect(() => {
        loadChatHistory()
    }, [loadChatHistory])

    useEffect(() => {
        if (!socket || !chatId) return

        socket.emit('joinChat', chatId)

        socket.on('receiveMessage', (newMessage: Message) => {
            const normalizedMessage = normalizeMessage(newMessage)
            setMessages((prev) => {
                // If it's from me, I already handled it optimistically
                if (normalizedMessage.senderId._id === user?.id) return prev;
                
                if (prev.some((msg) => msg._id === normalizedMessage._id)) return prev;
                return [...prev, normalizedMessage];
            })
            markChatAsRead(chatId)
        })

        return () => {
            socket.emit('leaveChat', chatId)
            socket.off('receiveMessage')
        }
    }, [socket, chatId, user])

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (message.trim() && clientId && chatId) {
            const textToSend = message.trim()
            setMessage('')
            
            // Optimistic update
            const optimisticMessage: Message = {
                _id: Date.now().toString(),
                chatId,
                senderId: { _id: user?.id as string, name: user?.name as string, email: '' },
                receiverId: { _id: clientId, name: clientName, email: '' },
                text: textToSend,
                isRead: false,
                createdAt: new Date().toISOString()
            }
            setMessages(prev => [...prev, optimisticMessage])

            try {
                const savedMessage = normalizeMessage(await sendMessage(chatId, clientId, textToSend))
                setMessages(prev => {
                    // If socket already added the real message, just remove the optimistic placeholder
                    if (prev.some(m => m._id === savedMessage._id)) {
                        return prev.filter(m => m._id !== optimisticMessage._id)
                    }
                    return prev.map(m => m._id === optimisticMessage._id ? savedMessage : m)
                })
            } catch (error) {
                console.error("Failed to send message", error)
            }
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const renderMessageBody = (msg: Message, isUser: boolean) => (
        <View
            className='px-4 py-3 rounded-2xl max-w-[75%]'
            style={{
                backgroundColor: isUser ? Colors.primary : Colors.white,
                borderWidth: !isUser ? 1 : 0,
                borderColor: Colors.border
            }}
        >
            {msg.imageUrl ? (
                <Pressable
                    onPress={() => {
                        const imageOnlyMessages = messages.filter((item) => Boolean(item.imageUrl))
                        const images = imageOnlyMessages.map((item) => item.imageUrl as string)
                        const currentIndex = Math.max(0, images.findIndex((uri) => uri === msg.imageUrl))
                        setViewerImages(images)
                        setViewerIndex(currentIndex)
                        setViewerVisible(true)
                    }}
                >
                    <Image
                        source={{ uri: msg.imageUrl }}
                        style={{ width: 220, height: 220, borderRadius: 16, marginBottom: msg.text ? 10 : 0 }}
                        resizeMode='cover'
                    />
                </Pressable>
            ) : null}
            {msg.text ? (
                <Text
                    className='text-base leading-relaxed'
                    style={{color: isUser ? Colors.white : Colors.textPrimary}}
                >
                    {msg.text}
                </Text>
            ) : null}
        </View>
    )

    if (isLoading) {
        return (
            <View style={StyleSheet.flatten([styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]) as ViewStyle}>
                <View className='flex-1 justify-center items-center'>
                    <Text style={{color: Colors.textSecondary}}>Loading chat...</Text>
                </View>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: Colors.background }}>
            {/* Header */}
            <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white}}>
                <Pressable
                    className='rounded-full p-2 active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={Colors.primary} size={24} />
                </Pressable>
                <View className='flex-1'>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>{clientName}</Text>
                    <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Client</Text>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className='flex-1 px-5 py-4'
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => {
                    const isUser = msg.senderId._id === user?.id
                    return (
                    <View
                        key={msg._id}
                        className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                        {renderMessageBody(msg, isUser)}
                        <Text className='text-xs mt-1 px-1' style={{color: Colors.textTertiary}}>
                            {formatTime(new Date(msg.createdAt))}
                        </Text>
                    </View>
                    )
                })}
            </ScrollView>

            {/* Message Input */}
            <View className='px-5 py-4' style={{borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white}}>
                <View className='flex-row items-center gap-3'>
                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder='Type a message...'
                        placeholderTextColor={Colors.textTertiary}
                        className='flex-1 rounded-full px-5 py-3 text-base'
                        style={{backgroundColor: Colors.lightGray, color: Colors.textPrimary}}
                        multiline
                        maxLength={500}
                    />
                    <Pressable
                        className='rounded-full p-3 active:opacity-80'
                        style={{backgroundColor: message.trim() ? Colors.primary : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send color={Colors.white} size={24} fill={Colors.white} />
                    </Pressable>
                </View>
            </View>

            <ImageViewerModal
                visible={viewerVisible}
                images={viewerImages}
                index={viewerIndex}
                onRequestClose={() => setViewerVisible(false)}
            />
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
