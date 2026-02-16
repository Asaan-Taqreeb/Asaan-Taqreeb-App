import { router } from 'expo-router'
import { ArrowLeft, Send, Bot } from 'lucide-react-native'
import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/app/constants/theme'
import { getChatById, addMessageToChat, Message } from '@/app/utils/chatStorage'

const AI_CHAT_ID = 'ai-assistant'
const AI_CHAT_NAME = 'AI Assistant'

const AI_RESPONSES = [
    "I can help you find the perfect vendors for your event! What type of service are you looking for?",
    "Based on your requirements, I recommend checking out our featured vendors in that category.",
    "Would you like me to suggest some packages that fit your budget?",
    "I can help you compare different vendors. What's your approximate guest count?",
    "Our banquet halls are very popular! Would you like to see options with different capacities?",
    "For catering services, prices typically range based on the number of guests. How many people are you expecting?"
]

export default function AIChatScreen() {
    const insets = useSafeAreaInsets()
    const scrollViewRef = useRef<ScrollView>(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load chat history on mount
    useEffect(() => {
        loadChatHistory()
    }, [])

    const loadChatHistory = async () => {
        const chat = await getChatById(AI_CHAT_ID)
        if (chat && chat.messages.length > 0) {
            setMessages(chat.messages)
        } else {
            // Initial welcome message
            const welcomeMessage: Message = {
                id: Date.now(),
                text: "👋 Hi! I'm your Asaan Taqreeb AI assistant. I can help you plan your perfect event! Ask me about vendors, packages, pricing, or any questions you have.",
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

    useEffect(() => {
        if (!isLoading) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [messages, isLoading])

    const getAIResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase()
        
        if (lowerMessage.includes('banquet') || lowerMessage.includes('hall')) {
            return "I can help you find banquet halls! Our venues range from 200 to 1000+ guest capacity. What's your expected guest count?"
        } else if (lowerMessage.includes('catering') || lowerMessage.includes('food')) {
            return "We have excellent catering services! Packages typically start from PKR 1,500 per person. Would you like to see options based on your guest count?"
        } else if (lowerMessage.includes('photo') || lowerMessage.includes('photography')) {
            return "Our photography services offer various packages including basic coverage, full-day shoots, and premium packages with videography. What type of coverage are you looking for?"
        } else if (lowerMessage.includes('parlor') || lowerMessage.includes('salon') || lowerMessage.includes('makeup')) {
            return "We have professional parlor services with bridal packages, party makeup, and styling. Would you like to see our featured salons?"
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
            return "I can help you find services within your budget! Which category are you interested in? (Banquet, Catering, Photography, or Parlor)"
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! Feel free to ask if you need any more help planning your event! 😊"
        } else {
            return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)]
        }
    }

    const handleSend = async () => {
        if (message.trim()) {
            const newMessage: Message = {
                id: Date.now(),
                text: message.trim(),
                sender: 'user',
                timestamp: new Date()
            }
            
            setMessages(prev => [...prev, newMessage])
            const userMsg = message.trim()
            setMessage('')

            // Save user message
            await addMessageToChat(AI_CHAT_ID, newMessage, {
                type: 'ai',
                name: AI_CHAT_NAME
            })

            // Simulate AI response
            setTimeout(async () => {
                const aiResponse: Message = {
                    id: Date.now() + 1,
                    text: getAIResponse(userMsg),
                    sender: 'ai',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, aiResponse])
                
                // Save AI response
                await addMessageToChat(AI_CHAT_ID, aiResponse, {
                    type: 'ai',
                    name: AI_CHAT_NAME
                })
            }, 1000)
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
                    <ArrowLeft color={Colors.primary} size={24} />
                </Pressable>
                <View className='flex-row items-center gap-3 flex-1'>
                    <View className='rounded-full p-2' style={{backgroundColor: Colors.primary}}>
                        <Bot color={Colors.white} size={24} />
                    </View>
                    <View>
                        <Text className='text-xl font-extrabold' style={{color: Colors.textPrimary}}>AI Assistant</Text>
                        <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Always Online</Text>
                    </View>
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
                            className='px-4 py-3 rounded-2xl max-w-[80%]'
                            style={{
                                backgroundColor: msg.sender === 'user' ? Colors.primary : Colors.white,
                                borderWidth: msg.sender === 'ai' ? 1 : 0,
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
                        placeholder='Ask me anything...'
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
