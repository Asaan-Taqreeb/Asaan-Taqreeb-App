import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Send } from 'lucide-react-native'
import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, getCategoryColor } from '@/app/_constants/theme'
import { getChatById, addMessageToChat, Message } from '@/app/_utils/chatStorage'

export default function VendorChatScreen() {
    const insets = useSafeAreaInsets()
    const params = useLocalSearchParams()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    let vendor = null
    if (params.vendor) {
        try {
            vendor = JSON.parse(params.vendor as string)
        } catch (e) {
            vendor = null
        }
    }

    const vendorName = vendor?.name || "Vendor"
    const vendorCategory = vendor?.category || ""
    const vendorLocation = vendor?.location || ""
    const categoryColor = vendor ? getCategoryColor(vendor.category) : Colors.primary
    const chatId = `vendor-${vendorName.toLowerCase().replace(/\s+/g, '-')}`

    // Load chat history on mount
    useEffect(() => {
        loadChatHistory()
    }, [])

    const loadChatHistory = async () => {
        const chat = await getChatById(chatId)
        if (chat && chat.messages.length > 0) {
            setMessages(chat.messages)
        } else {
            // Initial welcome message from vendor
            const welcomeMessage: Message = {
                id: Date.now(),
                text: "Hello! Thanks for your interest. How can I help you with your event?",
                sender: 'vendor',
                timestamp: new Date()
            }
            setMessages([welcomeMessage])
            // Save welcome message
            await addMessageToChat(chatId, welcomeMessage, {
                type: 'vendor',
                name: vendorName,
                category: vendorCategory,
                location: vendorLocation
            })
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (message.trim()) {
            const newMessage: Message = {
                id: Date.now(),
                text: message.trim(),
                sender: 'user',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, newMessage])
            setMessage('')

            // Save user message
            await addMessageToChat(chatId, newMessage, {
                type: 'vendor',
                name: vendorName,
                category: vendorCategory,
                location: vendorLocation
            })

            // Simulate vendor response (in real app, this would be actual messaging)
            setTimeout(async () => {
                const vendorResponse: Message = {
                    id: Date.now() + 1,
                    text: "Thank you for your message. I'll get back to you shortly!",
                    sender: 'vendor',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, vendorResponse])
                
                // Save vendor response
                await addMessageToChat(chatId, vendorResponse, {
                    type: 'vendor',
                    name: vendorName,
                    category: vendorCategory,
                    location: vendorLocation
                })
            }, 1500)
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    if (isLoading) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <View className='flex-1 justify-center items-center'>
                    <Text style={{color: Colors.textSecondary}}>Loading chat...</Text>
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
            <View className='flex-row items-center gap-4 px-5 py-4' style={{borderBottomWidth: 1, borderBottomColor: Colors.border}}>
                <Pressable
                    className='rounded-full p-2 active:opacity-70'
                    style={{backgroundColor: Colors.lightGray}}
                    onPress={() => router.back()}
                >
                    <ArrowLeft color={categoryColor} size={24} />
                </Pressable>
                <View className='flex-1'>
                    <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>{vendorName}</Text>
                    <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Online</Text>
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className='flex-1 px-5 py-4'
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        className={`mb-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <View
                            className='px-4 py-3 rounded-2xl max-w-[75%]'
                            style={{
                                backgroundColor: msg.sender === 'user' ? categoryColor : Colors.white,
                                borderWidth: msg.sender === 'vendor' ? 1 : 0,
                                borderColor: Colors.border
                            }}
                        >
                            <Text
                                className='text-base leading-relaxed'
                                style={{color: msg.sender === 'user' ? Colors.white : Colors.textPrimary}}
                            >
                                {msg.text}
                            </Text>
                        </View>
                        <Text className='text-xs mt-1 px-1' style={{color: Colors.textTertiary}}>
                            {formatTime(msg.timestamp)}
                        </Text>
                    </View>
                ))}
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
                        style={{backgroundColor: message.trim() ? categoryColor : Colors.borderDark}}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send color={Colors.white} size={24} fill={Colors.white} />
                    </Pressable>
                </View>
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
