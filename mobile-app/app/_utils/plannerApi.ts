import { PLANNER_ENDPOINTS } from '@/app/_constants/apiEndpoints'
import { apiFetchJson } from '@/app/_utils/apiClient'

export type PlannerTask = {
  _id: string;
  category: 'banquet' | 'catering' | 'photo' | 'parlor' | 'other';
  name: string;
  estimatedCost: number;
  actualCost: number;
  isCompleted: boolean;
  booking?: any;
};

export type PlannerData = {
  _id: string;
  totalBudget: number;
  eventDate?: string;
  eventType?: string;
  tasks: PlannerTask[];
};

export const getPlanner = async (): Promise<PlannerData | null> => {
  try {
    const response = await apiFetchJson<{ planner: PlannerData }>(
      PLANNER_ENDPOINTS.getPlanner,
      { method: 'GET', auth: true },
      'Failed to fetch planner.'
    );
    return response.planner || null;
  } catch (error) {
    console.error('Error fetching planner:', error);
    return null;
  }
};

export const updatePlannerDetails = async (data: { totalBudget?: number; eventDate?: string; eventType?: string }) => {
  return apiFetchJson<{ planner: PlannerData }>(
    PLANNER_ENDPOINTS.updatePlanner,
    {
      method: 'PUT',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    'Failed to update planner.'
  );
};

export const addPlannerTask = async (task: { category: string; name: string; estimatedCost?: number; actualCost?: number }) => {
  return apiFetchJson<{ planner: PlannerData }>(
    PLANNER_ENDPOINTS.addTask,
    {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    },
    'Failed to add task.'
  );
};

export const updatePlannerTask = async (taskId: string, task: { name?: string; estimatedCost?: number; actualCost?: number; isCompleted?: boolean }) => {
  return apiFetchJson<{ planner: PlannerData }>(
    PLANNER_ENDPOINTS.updateTask(taskId),
    {
      method: 'PUT',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    },
    'Failed to update task.'
  );
};

export const deletePlannerTask = async (taskId: string) => {
  return apiFetchJson<{ planner: PlannerData }>(
    PLANNER_ENDPOINTS.deleteTask(taskId),
    {
      method: 'DELETE',
      auth: true,
    },
    'Failed to delete task.'
  );
};
