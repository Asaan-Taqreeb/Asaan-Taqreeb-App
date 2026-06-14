import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Calculator, Calendar, CheckCircle, Edit2, Plus, Trash2, X } from 'lucide-react-native'
import { router } from 'expo-router'
import { Colors, Shadows, Spacing } from '@/app/_constants/theme'
import { getPlanner, updatePlannerDetails, addPlannerTask, updatePlannerTask, deletePlannerTask, PlannerData, PlannerTask } from '@/app/_utils/plannerApi'
import { useUser } from '@/app/_context/UserContext'
import ClientTabHeader from '../Component/ClientTabHeader'

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
    const [taskEstCost, setTaskEstCost] = useState('')
    const [taskActCost, setTaskActCost] = useState('')

    const loadPlanner = useCallback(async () => {
        if (user?.isGuest) {
            setPlanner(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const data = await getPlanner()
            setPlanner(data)
        } catch (error) {
            console.log('Failed to load planner', error)
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
            Alert.alert('Error', 'Failed to update budget')
        }
    }

    const handleSaveTask = async () => {
        if (!taskName) {
            Alert.alert('Error', 'Task name is required')
            return
        }
        try {
            const est = parseInt(taskEstCost) || 0
            const act = parseInt(taskActCost) || 0

            if (editingTask) {
                const res = await updatePlannerTask(editingTask._id, {
                    name: taskName,
                    estimatedCost: est,
                    actualCost: act,
                })
                setPlanner(res.planner)
            } else {
                const res = await addPlannerTask({
                    category: taskCategory,
                    name: taskName,
                    estimatedCost: est,
                    actualCost: act,
                })
                setPlanner(res.planner)
            }
            setIsTaskModalVisible(false)
            setEditingTask(null)
        } catch (error: any) {
            console.error('Save task error:', error)
            Alert.alert('Error', error?.message || 'Failed to save task. Please check your connection and try again.')
        }
    }

    const handleDeleteTask = (taskId: string) => {
        Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await deletePlannerTask(taskId)
                        setPlanner(res.planner)
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete task')
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
            Alert.alert('Error', 'Failed to update task')
        }
    }

    const openTaskModal = (task?: PlannerTask) => {
        if (task) {
            setEditingTask(task)
            setTaskName(task.name)
            setTaskCategory(task.category)
            setTaskEstCost(task.estimatedCost ? task.estimatedCost.toString() : '')
            setTaskActCost(task.actualCost ? task.actualCost.toString() : '')
        } else {
            setEditingTask(null)
            setTaskName('')
            setTaskCategory('other')
            setTaskEstCost('')
            setTaskActCost('')
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
    let totalEstimated = 0
    let totalActual = 0

    planner?.tasks.forEach(t => {
        totalEstimated += t.estimatedCost || 0
        totalActual += t.actualCost || 0
    })

    const totalSpentOrEstimated = planner?.tasks.reduce((sum, t) => {
        // If task has actual cost, use it, else use estimated
        return sum + (t.actualCost > 0 ? t.actualCost : (t.estimatedCost || 0))
    }, 0) || 0

    const progressPercentage = totalBudget > 0 ? Math.min((totalSpentOrEstimated / totalBudget) * 100, 100) : 0
    const isOverBudget = totalSpentOrEstimated > totalBudget && totalBudget > 0

    return (
        <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
            <ClientTabHeader title="Event Planner" subtitle="Manage your event budget & tasks" />

            <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110}}>
                {/* Budget Overview Card */}
                <View className='rounded-3xl p-5 mb-6' style={[{backgroundColor: Colors.white}, Shadows.medium]}>
                    <View className='flex-row justify-between items-center mb-4'>
                        <Text className='text-base font-bold' style={{color: Colors.textPrimary}}>Total Budget</Text>
                        <Pressable onPress={() => {
                            setBudgetInput(totalBudget.toString())
                            setIsEditingBudget(true)
                        }}>
                            <Edit2 size={16} color={Colors.primary} />
                        </Pressable>
                    </View>

                    {isEditingBudget ? (
                        <View className='flex-row items-center gap-2 mb-4'>
                            <TextInput
                                value={budgetInput}
                                onChangeText={setBudgetInput}
                                keyboardType='numeric'
                                className='flex-1 border rounded-lg px-3 py-2 text-base font-bold'
                                style={{borderColor: Colors.border, color: Colors.textPrimary}}
                                autoFocus
                            />
                            <Pressable 
                                className='bg-primary px-4 py-2.5 rounded-lg'
                                style={{backgroundColor: Colors.primary}}
                                onPress={handleSaveBudget}
                            >
                                <Text className='text-white font-bold'>Save</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Text className='text-3xl font-extrabold mb-4' style={{color: Colors.primary}}>
                            PKR {totalBudget.toLocaleString()}
                        </Text>
                    )}

                    {/* Progress Bar */}
                    <View className='h-3 rounded-full mb-2 overflow-hidden' style={{backgroundColor: Colors.lightGray}}>
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
                            Planned/Spent: PKR {totalSpentOrEstimated.toLocaleString()}
                        </Text>
                        <Text className='text-xs font-semibold' style={{color: isOverBudget ? Colors.error : Colors.textSecondary}}>
                            {isOverBudget ? 'Over Budget!' : `Remaining: PKR ${(totalBudget - totalSpentOrEstimated).toLocaleString()}`}
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
                {planner?.tasks.map(task => (
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
                            <View className='flex-row items-center gap-3'>
                                <Text className='text-xs font-medium uppercase' style={{color: Colors.textTertiary}}>{task.category}</Text>
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
                ))}
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

                        <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Task Name</Text>
                        <TextInput
                            value={taskName}
                            onChangeText={setTaskName}
                            placeholder="e.g. Venue Booking"
                            className='border rounded-xl px-4 py-3 mb-4 text-base'
                            style={{borderColor: Colors.border, color: Colors.textPrimary}}
                        />

                        <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-4'>
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

                        <View className='flex-row gap-4 mb-6'>
                            <View className='flex-1'>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Estimated Cost</Text>
                                <TextInput
                                    value={taskEstCost}
                                    onChangeText={setTaskEstCost}
                                    keyboardType='numeric'
                                    placeholder="0"
                                    className='border rounded-xl px-4 py-3 text-base'
                                    style={{borderColor: Colors.border, color: Colors.textPrimary}}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='text-sm font-bold mb-2' style={{color: Colors.textPrimary}}>Actual Cost</Text>
                                <TextInput
                                    value={taskActCost}
                                    onChangeText={setTaskActCost}
                                    keyboardType='numeric'
                                    placeholder="0"
                                    className='border rounded-xl px-4 py-3 text-base'
                                    style={{borderColor: Colors.border, color: Colors.textPrimary}}
                                />
                            </View>
                        </View>

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
