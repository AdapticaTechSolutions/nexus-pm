
import { Project, Task, TaskStatus } from '../types';

/**
 * Calculates how many months have passed between two dates.
 * Returns a partial month as well (e.g., 2.5 months).
 */
export const calculateMonthsElapsed = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const now = new Date();
  
  if (now < start) return 0;

  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const days = now.getDate() - start.getDate();

  // Basic fractional month calculation
  return (years * 12) + months + (days / 30);
};

export const calculateAccruedResourceCosts = (project: Project): number => {
  if (!project.resourceAllocations) return 0;

  return project.resourceAllocations.reduce((total, alloc) => {
    // We only bill from the allocation's start date or project start date
    const billingStart = new Date(alloc.startDate) > new Date(project.startDate) 
      ? alloc.startDate 
      : project.startDate;
    
    const elapsed = calculateMonthsElapsed(billingStart);
    return total + (elapsed * alloc.monthlyRate);
  }, 0);
};

export const getTotalProjectSpend = (project: Project): number => {
  const manualExpenses = project.budgetSpent || 0;
  const accruedResources = calculateAccruedResourceCosts(project);
  return manualExpenses + accruedResources;
};

export const getProjectHealthStatus = (project: Project, tasks: Task[]): 'green' | 'yellow' | 'red' => {
  const totalSpend = getTotalProjectSpend(project);
  const spentRatio = totalSpend / project.budgetAllocated;
  
  const now = new Date();
  const delayedTasks = tasks.some(t => t.status !== TaskStatus.DONE && new Date(t.endDate) < now);

  // If over budget - definitely Red
  if (spentRatio >= 1.0) return 'red';
  
  // If approaching budget limit OR delayed - Yellow
  if (spentRatio >= 0.85 || delayedTasks) return 'yellow';
  
  // If we have resources, check if future burn will exceed budget before completion
  const monthlyBurn = project.resourceAllocations?.reduce((sum, a) => sum + a.monthlyRate, 0) || 0;
  const projectEnd = new Date(project.endDate);
  const monthsRemaining = Math.max(0, (projectEnd.getFullYear() - now.getFullYear()) * 12 + (projectEnd.getMonth() - now.getMonth()));
  
  const projectedFinalSpend = totalSpend + (monthlyBurn * monthsRemaining);
  if (projectedFinalSpend > project.budgetAllocated) return 'yellow';

  return 'green';
};
