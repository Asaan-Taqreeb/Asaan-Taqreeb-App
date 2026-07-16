import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native'
import { showAlert } from '@/app/_utils/alert'
import React, { useCallback, useState, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Calculator, Calendar, CheckCircle, Edit2, Plus, Trash2, X } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'
import { getPlanner, updatePlannerDetails, addPlannerTask, updatePlannerTask, deletePlannerTask, PlannerData, PlannerTask } from '@/app/_utils/plannerApi'
import { getMyBookings, ClientBookingItem } from '@/app/_utils/bookingsApi'
import { useUser } from '@/app/_context/UserContext'
import ClientTabHeader from '../Component/ClientTabHeader'

const TEMPLATES = {
    grandWedding: {
        budget: 1000000,
        tasks: [
            { name: 'Banquet & Venue Booking', category: 'banquet', estimatedCost: 500000 },
            { name: 'Catering & Food Service', category: 'catering', estimatedCost: 250000 },
            { name: 'Photography & Videography Team', category: 'photo', estimatedCost: 120000 },
            { name: 'Bridal Salon & Makeup Booking', category: 'parlor', estimatedCost: 50000 },
            { name: 'Decorations & Floral Arrangements', category: 'other', estimatedCost: 60000 },
            { name: 'Guest Invitation Cards', category: 'other', estimatedCost: 20000 }
        ]
    },
    intimateCeremony: {
        budget: 400000,
        tasks: [
            { name: 'Cozy Venue / Backyard Setup', category: 'banquet', estimatedCost: 150000 },
            { name: 'Buffet Catering', category: 'catering', estimatedCost: 120000 },
            { name: 'Event Portrait Photographer', category: 'photo', estimatedCost: 60000 },
            { name: 'Makeup Artist Booking', category: 'parlor', estimatedCost: 30000 },
            { name: 'Invitations & Digital E-cards', category: 'other', estimatedCost: 5000 },
            { name: 'Minimal Decor & Sound System', category: 'other', estimatedCost: 35000 }
        ]
    },
    basicParty: {
        budget: 150000,
        tasks: [
            { name: 'Party Venue Rental', category: 'banquet', estimatedCost: 50000 },
            { name: 'Catering & Beverages', category: 'catering', estimatedCost: 50000 },
            { name: 'Event Photography', category: 'photo', estimatedCost: 25000 },
            { name: 'Party Decor & Balloons', category: 'other', estimatedCost: 20000 },
            { name: 'Digital Invitations', category: 'other', estimatedCost: 5000 }
        ]
    }
}

const QUICK_SUGGESTIONS = [
    { label: 'Venue Book', name: 'Venue Booking', category: 'banquet' },
    { label: 'Catering', name: 'Catering Service', category: 'catering' },
    { label: 'Photo/Video', name: 'Photography', category: 'photo' },
    { label: 'Bridal Salon', name: 'Bridal Makeup', category: 'parlor' },
    { label: 'Decor', name: 'Decor & Flowers', category: 'other' },
    { label: 'Invitations', name: 'Invitations', category: 'other' }
]

export default function PlannerScreen() {
    const insets = useSafeAreaInsets()
    const { user } = useUser()
    const [planner, setPlanner] = useState<PlannerData | null>(null)
    const [loading, setLoading] = useState(true)

    const [isEditingBudget, setIsEditingBudget] = useState(false)
    const [budgetInput, setBudgetInput] = useState('')

    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
    const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
    const [taskName, setTaskName] = useState('')
    const [taskCategory, setTaskCategory] = useState('other')
 
    const [isPrepopulating, setIsPrepopulating] = useState(false)
    const [bookings, setBookings] = useState<ClientBookingItem[]>([])

    const mapBookingCategoryToTaskCategory = (bookingCat: string): string => {
        const cat = bookingCat.toUpperCase()
        if (cat === 'BANQUET_HALL') return 'banquet'
        if (cat === 'CATERING') return 'catering'
        if (cat === 'PHOTOGRAPHY') return 'photo'
        if (cat === 'PARLOR_SALON') return 'parlor'
        return 'other'
    }

    const getActiveBookingForTask = (taskCategory: string) => {
        // Return first booking matching the category that is not rejected/cancelled
        const match = bookings.find(b => 
            mapBookingCategoryToTaskCategory(b.category) === taskCategory && 
            b.status !== 'rejected'
        )
        return match || null
    }

    const handleApplyTemplate = async (templateKey: 'grandWedding' | 'intimateCeremony' | 'basicParty') => {
        try {
            setIsPrepopulating(true)
            const template = TEMPLATES[templateKey]
            
            // 1. Update the total budget
            const budgetRes = await updatePlannerDetails({ totalBudget: template.budget })
            let currentPlanner = budgetRes.planner
            
            // 2. Add starter tasks sequentially
            for (const t of template.tasks) {
                const taskRes = await addPlannerTask(t)
                currentPlanner = taskRes.planner
            }
            
            setPlanner(currentPlanner)
            showAlert('Success', 'Planner prepopulated with starter tasks!')
        } catch (error) {
            console.error('Failed to prepopulate:', error)
            showAlert('Error', 'Failed to apply template. Please try again.')
        } finally {
            setIsPrepopulating(false)
        }
    }

    const handleApplyTemplatePress = (templateKey: 'grandWedding' | 'intimateCeremony' | 'basicParty') => {
        const hasTasks = planner && planner.tasks.length > 0
        if (hasTasks) {
            showAlert(
                'Prepopulate Planner',
                'This will add the template tasks to your current list. Do you want to proceed?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Tasks', onPress: () => handleApplyTemplate(templateKey) }
                ]
            )
        } else {
            handleApplyTemplate(templateKey)
        }
    }

    const loadPlanner = useCallback(async () => {
        if (user?.isGuest) {
            setPlanner(null)
            setBookings([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const [plannerData, bookingsData] = await Promise.all([
                getPlanner(),
                getMyBookings(true).catch(() => [] as ClientBookingItem[])
            ])
            setPlanner(plannerData)
            setBookings(bookingsData)
        } catch (error) {
            console.log('Failed to load planner details', error)
        } finally {
            setLoading(false)
        }
    }, [user?.isGuest])

    useFocusEffect(
        useCallback(() => {
            loadPlanner()
        }, [loadPlanner])
    )

    const handleSaveBudget = async () => {
        if (!planner) return
        try {
            const parsedBudget = parseInt(budgetInput) || 0
            const res = await updatePlannerDetails({ totalBudget: parsedBudget })
            setPlanner(res.planner)
            setIsEditingBudget(false)
        } catch (error) {
            showAlert('Error', 'Failed to update budget')
        }
    }

    const handleSaveTask = async () => {
        if (!taskName) {
            showAlert('Error', 'Task name is required')
            return
        }
        try {
            if (editingTask) {
                const res = await updatePlannerTask(editingTask._id, {
                    name: taskName,
                })
                setPlanner(res.planner)
            } else {
                const res = await addPlannerTask({
                    category: taskCategory,
                    name: taskName,
                    estimatedCost: 0,
                    actualCost: 0,
                })
                setPlanner(res.planner)
            }
            setIsTaskModalVisible(false)
            setEditingTask(null)
        } catch (error: any) {
            console.error('Save task error:', error)
            showAlert('Error', error?.message || 'Failed to save task. Please check your connection and try again.')
        }
    }

    const handleDeleteTask = (taskId: string) => {
        showAlert('Delete Task', 'Are you sure you want to delete this task?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await deletePlannerTask(taskId)
                        setPlanner(res.planner)
                    } catch (error) {
                        showAlert('Error', 'Failed to delete task')
                    }
                }
            }
        ])
    }

    const toggleTaskCompletion = async (task: PlannerTask) => {
        try {
            const res = await updatePlannerTask(task._id, { isCompleted: !task.isCompleted })
            setPlanner(res.planner)
        } catch (error) {
            showAlert('Error', 'Failed to update task')
        }
    }

    const openTaskModal = (task?: PlannerTask) => {
        if (task) {
            setEditingTask(task)
            setTaskName(task.name)
            setTaskCategory(task.category)
        } else {
            setEditingTask(null)
            setTaskName('')
            setTaskCategory('other')
        }
        setIsTaskModalVisible(true)
    }

    if (user?.isGuest) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <ClientTabHeader title="Event Planner" subtitle="Manage your event budget & tasks" />
                <View className='flex-1 items-center justify-center p-6 gap-2'>
                    <View className='w-20 h-20 rounded-full items-center justify-center mb-4' style={{backgroundColor: Colors.lightGray}}>
                        <Calculator size={36} color={Colors.accent} />
                    </View>
                    <Text className='text-xl font-bold text-center' style={{color: Colors.textPrimary}}>Planner Locked</Text>
                    <Text className='text-sm font-medium text-center text-slate-500 max-w-[280px] leading-relaxed mb-6'>
                        Sign in to access your budget calculator, checklist tasks, and expense tracker.
                    </Text>
                    <Pressable
                        className='py-3.5 px-10 rounded-xl active:opacity-85'
                        style={{backgroundColor: Colors.primary}}
                        onPress={() => router.push('/screens/client/Component/LoginScreen')}
                    >
                        <Text className='text-center font-bold text-sm' style={{color: Colors.white}}>Sign In</Text>
                    </Pressable>
                </View>
            </View>
        )
    }

    if (loading) {
        return (
            <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
                <ClientTabHeader title="Event Planner" subtitle="Manage your event budget & tasks" />
                <View className='flex-1 justify-center items-center p-5'>
                    <Text className='text-sm font-semibold' style={{color: Colors.textTertiary}}>Loading planner...</Text>
                </View>
            </View>
        )
    }

    const totalBudget = planner?.totalBudget || 0

    // Compute tasks dynamically by merging booking payments/prices
    const computedTasks = planner?.tasks.map(task => {
        const linkedBooking = getActiveBookingForTask(task.category)
        if (linkedBooking) {
            return {
                ...task,
                estimatedCost: linkedBooking.price,
                actualCost: linkedBooking.paidAmount,
                linkedBooking
            }
        }
        return task
    }) || []

    const totalSpentOrEstimated = computedTasks.reduce((sum, t) => {
        // If task has actual cost, use it, else use estimated
        return sum + (t.actualCost > 0 ? t.actualCost : (t.estimatedCost || 0))
    }, 0) || 0

    const progressPercentage = totalBudget > 0 ? Math.min((totalSpentOrEstimated / totalBudget) * 100, 100) : 0
    const isOverBudget = totalSpentOrEstimated > totalBudget

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <ClientTabHeader title="Event Planner" subtitle="Manage your event budget & tasks" />

            <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110}}>
                {/* Budget Overview Card */}
                <View className='rounded-3xl p-5 mb-6' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
                    <View className='flex-row justify-between items-center mb-4'>
                        <View>
                            <Text className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1'>Total Event Budget</Text>
                            {isEditingBudget ? (
                                <View className='flex-row items-center gap-2'>
                                    <TextInput
                                        value={budgetInput}
                                        onChangeText={setBudgetInput}
                                        keyboardType='numeric'
                                        className='border rounded-lg px-3 py-1.5 text-xl font-black w-32'
                                        style={{borderColor: Colors.border, color: Colors.textPrimary}}
                                        autoFocus
                                    />
                                    <Pressable 
                                        className='px-3 py-2 rounded-lg'
                                        style={{backgroundColor: Colors.primary}}
                                        onPress={handleSaveBudget}
                                    >
                                        <Text className='text-white font-bold text-xs'>Save</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <View className='flex-row items-center gap-2'>
                                    <Text className='text-2xl font-black' style={{color: Colors.primary}}>
                                        PKR {totalBudget.toLocaleString()}
                                    </Text>
                                    <Pressable onPress={() => {
                                        setBudgetInput(totalBudget.toString())
                                        setIsEditingBudget(true)
                                    }}>
                                        <Edit2 size={14} color={Colors.primary} />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                        
                        <View className='items-end'>
                            <Text className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1'>Actual Cost Spent</Text>
                            <Text className='text-2xl font-black' style={{color: Colors.textPrimary}}>
                                PKR {totalSpentOrEstimated.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View className='h-3 rounded-full mb-3 overflow-hidden' style={{backgroundColor: Colors.lightGray}}>
                        <View 
                            className='h-full rounded-full' 
                            style={{
                                width: `${progressPercentage}%`, 
                                backgroundColor: isOverBudget ? Colors.error : Colors.primary
                            }} 
                        />
                    </View>
                    <View className='flex-row justify-between items-center'>
                        <Text className='text-xs font-semibold' style={{color: Colors.textSecondary}}>
                            Status: {isOverBudget ? 'Over Budget' : 'On Track'}
                        </Text>
                        <Text className='text-xs font-semibold' style={{color: isOverBudget ? Colors.error : Colors.success}}>
                            {isOverBudget 
                                ? `Over Budget by: PKR ${(totalSpentOrEstimated - totalBudget).toLocaleString()}` 
                                : `Remaining: PKR ${(totalBudget - totalSpentOrEstimated).toLocaleString()}`
                            }
                        </Text>
                    </View>
                </View>

                {/* Tasks Header */}
                <View className='flex-row justify-between items-center mb-4'>
                    <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>Checklist & Costs</Text>
                    <Pressable 
                        className='flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full active:opacity-80'
                        style={{backgroundColor: Colors.primary}}
                        onPress={() => openTaskModal()}
                    >
                        <Plus size={16} color={Colors.white} />
                        <Text className='text-sm font-bold text-white'>Add Task</Text>
                    </Pressable>
                </View>

                {/* Tasks List */}
                {isPrepopulating ? (
                    <View className="py-12 items-center justify-center">
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text className="text-xs font-semibold text-slate-400 mt-2">Generating starter templates...</Text>
                    </View>
                ) : computedTasks && computedTasks.length > 0 ? (
                    computedTasks.map(task => (
                        <View key={task._id} className='rounded-2xl p-4 mb-3 flex-row items-center gap-3' style={[{backgroundColor: Colors.white, borderWidth: 1, borderColor: task.isCompleted ? Colors.border : Colors.white}, Shadows.small]}>
                            <Pressable onPress={() => toggleTaskCompletion(task)}>
                                <CheckCircle 
                                    size={24} 
                                    color={task.isCompleted ? Colors.success : Colors.textTertiary} 
                                    fill={task.isCompleted ? Colors.success + '20' : 'transparent'} 
                                />
                            </Pressable>
                            
                            <View className='flex-1'>
                                <Text className={`text-base font-bold mb-1 ${task.isCompleted ? 'line-through opacity-60' : ''}`} style={{color: Colors.textPrimary}}>
                                    {task.name}
                                </Text>
                                <View className='flex-row items-center gap-2 flex-wrap'>
                                    <Text className='text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500' style={{color: Colors.textSecondary}}>{task.category}</Text>
                                    {(task as any).linkedBooking && (
                                        <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <Text className="text-[10px] font-black text-emerald-700 uppercase">
                                                Linked: {(task as any).linkedBooking.vendorName} ({(task as any).linkedBooking.status})
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View className='items-end mr-2'>
                                <Text className='text-xs font-medium' style={{color: Colors.textSecondary}}>Est: {task.estimatedCost.toLocaleString()}</Text>
                                <Text className='text-sm font-extrabold' style={{color: task.actualCost > 0 ? Colors.primary : Colors.textTertiary}}>
                                    Act: {task.actualCost > 0 ? task.actualCost.toLocaleString() : '-'}
                                </Text>
                            </View>

                            <Pressable className='p-2' onPress={() => openTaskModal(task)}>
                                <Edit2 size={16} color={Colors.textSecondary} />
                            </Pressable>
                            <Pressable className='p-2 pl-0' onPress={() => handleDeleteTask(task._id)}>
                                <Trash2 size={16} color={Colors.error} />
                            </Pressable>
                        </View>
                    ))
                ) : (
                    <View className="rounded-3xl p-6 bg-slate-50 border border-dashed border-slate-200 items-center justify-center">
                        <Text className="text-base font-bold text-center mb-1" style={{ color: Colors.textPrimary }}>
                            No Tasks Added Yet
                        </Text>
                        <Text className="text-xs font-medium text-center text-slate-400 mb-5 max-w-[260px] leading-relaxed">
                            Simplify planning! Prepopulate with a curated budget & task template:
                        </Text>
                        
                        <View className="w-full gap-3">
                            <Pressable 
                                onPress={() => handleApplyTemplatePress('grandWedding')}
                                className="p-4 rounded-2xl bg-white border border-slate-100 flex-row justify-between items-center active:opacity-80"
                                style={Shadows.small}
                            >
                                <View className="flex-1 mr-4">
                                    <Text className="font-extrabold text-sm" style={{ color: Colors.textPrimary }}>Grand Wedding Starter</Text>
                                    <Text className="text-[10px] font-semibold text-slate-400 mt-0.5">6 core tasks • Budget: PKR 1,000,000</Text>
                                </View>
                                <Plus size={16} color={Colors.primary} />
                            </Pressable>
                            
                            <Pressable 
                                onPress={() => handleApplyTemplatePress('intimateCeremony')}
                                className="p-4 rounded-2xl bg-white border border-slate-100 flex-row justify-between items-center active:opacity-80"
                                style={Shadows.small}
                            >
                                <View className="flex-1 mr-4">
                                    <Text className="font-extrabold text-sm" style={{ color: Colors.textPrimary }}>Intimate Ceremony Starter</Text>
                                    <Text className="text-[10px] font-semibold text-slate-400 mt-0.5">6 core tasks • Budget: PKR 400,000</Text>
                                </View>
                                <Plus size={16} color={Colors.primary} />
                            </Pressable>
                            
                            <Pressable 
                                onPress={() => handleApplyTemplatePress('basicParty')}
                                className="p-4 rounded-2xl bg-white border border-slate-100 flex-row justify-between items-center active:opacity-80"
                                style={Shadows.small}
                            >
                                <View className="flex-1 mr-4">
                                    <Text className="font-extrabold text-sm" style={{ color: Colors.textPrimary }}>Basic Party/Event Starter</Text>
                                    <Text className="text-[10px] font-semibold text-slate-400 mt-0.5">5 core tasks • Budget: PKR 150,000</Text>
                                </View>
                                <Plus size={16} color={Colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Task Modal */}
            <Modal
                visible={isTaskModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsTaskModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{flex: 1}}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <Pressable style={{flex: 1}} onPress={() => setIsTaskModalVisible(false)}>
                        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} />
                    </Pressable>
                    <View className='bg-white rounded-t-3xl p-6'>
                        <View className='flex-row justify-between items-center mb-6'>
                            <Text className='text-xl font-bold' style={{color: Colors.textPrimary}}>
                                {editingTask ? 'Edit Task' : 'Add New Task'}
                            </Text>
                            <Pressable onPress={() => setIsTaskModalVisible(false)}>
                                <X size={24} color={Colors.textPrimary} />
                            </Pressable>
                        </View>

                        {editingTask && (computedTasks.find(t => t._id === editingTask._id) as any)?.linkedBooking && (
                            <View className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                                <Text className="text-xs font-bold text-emerald-800">
                                    Syncing with Booking: {(computedTasks.find(t => t._id === editingTask._id) as any).linkedBooking.vendorName}
                                </Text>
                                <Text className="text-[10px] text-emerald-600 mt-0.5 leading-relaxed">
                                    The estimated cost and actual cost are synced automatically with your booking price and recorded live payment.
                                </Text>
                            </View>
                        )}

                        <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Task Name</Text>
                        <TextInput
                            value={taskName}
                            onChangeText={setTaskName}
                            placeholder="e.g. Venue Booking"
                            className='border rounded-xl px-4 py-3 mb-3 text-base'
                            style={{borderColor: Colors.border, color: Colors.textPrimary}}
                        />

                        <Text className='text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest'>Quick Suggestions</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {QUICK_SUGGESTIONS.map((s, idx) => (
                                <Pressable
                                    key={idx}
                                    onPress={() => {
                                        setTaskName(s.name);
                                        setTaskCategory(s.category);
                                    }}
                                    className="px-3.5 py-2 rounded-full border border-slate-200 bg-slate-50 mr-2 active:opacity-70"
                                >
                                    <Text className="text-xs font-semibold text-slate-500">{s.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-6'>
                            {['banquet', 'catering', 'photo', 'parlor', 'other'].map(cat => (
                                <Pressable 
                                    key={cat}
                                    className='px-4 py-2 rounded-full mr-2 border'
                                    style={{
                                        borderColor: taskCategory === cat ? Colors.primary : Colors.border,
                                        backgroundColor: taskCategory === cat ? Colors.primary : 'transparent'
                                    }}
                                    onPress={() => setTaskCategory(cat)}
                                >
                                    <Text className='font-bold uppercase text-xs' style={{color: taskCategory === cat ? Colors.white : Colors.textSecondary}}>
                                        {cat}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable 
                            className='py-4 rounded-xl active:opacity-85'
                            style={{backgroundColor: Colors.primary}}
                            onPress={handleSaveTask}
                        >
                            <Text className='text-center font-bold text-white text-base'>
                                {editingTask ? 'Save Changes' : 'Add Task'}
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
})
