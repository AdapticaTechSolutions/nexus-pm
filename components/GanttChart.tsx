/**
 * Gantt Chart Component
 * 
 * Visualizes project timeline with tasks, dependencies, and milestones.
 * Supports:
 * - Task bars with start/end dates
 * - Dependency arrows between tasks
 * - Milestone markers
 * - Task grouping by task groups/epics
 * 
 * @module components/GanttChart
 */

import React, { useMemo } from 'react';
import { Project, Task, Milestone } from '../types';
import { getAppConfig } from '../config/AppConfig';

interface GanttChartProps {
  tasks: Task[];
  project: Project;
  milestones?: Milestone[]; // Optional milestones to display
  taskGroups?: { id: string; name: string }[]; // Optional task groups for grouping
}

/**
 * Gantt Chart Component
 * 
 * Renders a timeline visualization of project tasks with support for:
 * - Task dependencies (arrows showing relationships)
 * - Milestones (key project dates)
 * - Task grouping by epics/groups
 * - Visual status indicators
 */
const GanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  project, 
  milestones = [],
  taskGroups = []
}) => {
  const config = getAppConfig();
  
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);
  const totalDays = Math.max(1, (projectEnd.getTime() - projectStart.getTime()) / (1000 * 3600 * 24));
  
  /**
   * Calculate X position for a date on the timeline
   * Returns percentage (0-100) of where the date falls in the project timeline
   */
  const getX = (dateStr: string): number => {
    const d = new Date(dateStr);
    const diff = (d.getTime() - projectStart.getTime()) / (1000 * 3600 * 24);
    return Math.max(0, Math.min(100, (diff / totalDays) * 100));
  };

  /**
   * Calculate width percentage for a date range
   */
  const getWidth = (start: string, end: string): number => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.max(0, (e.getTime() - s.getTime()) / (1000 * 3600 * 24));
    return Math.max(1, (diff / totalDays) * 100); // Minimum 1% width for visibility
  };

  /**
   * Get task color based on status
   */
  const getTaskColor = (status: string): string => {
    switch (status) {
      case 'done':
        return 'bg-emerald-500';
      case 'in-progress':
        return 'bg-blue-600';
      case 'review':
        return 'bg-purple-500';
      case 'blocked':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-slate-400';
      default:
        return 'bg-slate-300';
    }
  };

  /**
   * Build dependency arrows between tasks
   * Returns SVG path data for drawing arrows
   */
  const getDependencyArrows = useMemo(() => {
    if (!config.features.taskDependenciesEnabled) {
      return [];
    }

    const arrows: Array<{
      fromTask: Task;
      toTask: Task;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }> = [];

    tasks.forEach((task, taskIndex) => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return;
      }

      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          const fromX = getX(depTask.endDate);
          const toX = getX(task.startDate);
          const fromY = taskIndex * 48 + 16; // Task row height
          const toY = tasks.indexOf(task) * 48 + 16;

          arrows.push({
            fromTask: depTask,
            toTask: task,
            fromX,
            fromY,
            toX,
            toY,
          });
        }
      });
    });

    return arrows;
  }, [tasks, config.features.taskDependenciesEnabled]);

  // Sort tasks by start date, then by dependencies
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      // First sort by start date
      const dateDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Then by dependencies (tasks with dependencies come after their dependencies)
      if (a.dependencies.includes(b.id)) return 1;
      if (b.dependencies.includes(a.id)) return -1;
      
      return 0;
    });
    return sorted;
  }, [tasks]);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px]">
        {/* Header timeline */}
        <div className="flex border-b border-slate-100 mb-4 pb-2">
          <div className="w-48 shrink-0 font-bold text-xs text-slate-400 uppercase tracking-widest">Tasks</div>
          <div className="flex-1 relative h-6">
            <div className="absolute left-0 text-[10px] text-slate-400 font-bold">
              {projectStart.toLocaleDateString()}
            </div>
            <div className="absolute right-0 text-[10px] text-slate-400 font-bold">
              {projectEnd.toLocaleDateString()}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-bold">
              Timeline
            </div>
          </div>
        </div>

        {/* Task rows with dependency arrows */}
        <div className="relative space-y-3">
          {/* Dependency arrows overlay */}
          {config.features.taskDependenciesEnabled && getDependencyArrows.length > 0 && (
            <svg 
              className="absolute inset-0 pointer-events-none z-0" 
              style={{ height: `${sortedTasks.length * 48}px` }}
            >
              {getDependencyArrows.map((arrow, idx) => {
                const midX = (arrow.fromX + arrow.toX) / 2;
                return (
                  <g key={idx}>
                    {/* Arrow line */}
                    <path
                      d={`M ${arrow.fromX}% ${arrow.fromY} L ${arrow.toX}% ${arrow.toY}`}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                    {/* Dependency label */}
                    {arrow.toX - arrow.fromX > 5 && (
                      <text
                        x={`${midX}%`}
                        y={arrow.fromY - 5}
                        className="text-[8px] fill-slate-400"
                        textAnchor="middle"
                      >
                        depends on
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
          )}

          {/* Task bars */}
          {sortedTasks.map((task, index) => {
            const left = getX(task.startDate);
            const width = getWidth(task.startDate, task.endDate);
            const taskGroup = task.groupId 
              ? taskGroups.find(g => g.id === task.groupId)
              : null;
            
            return (
              <div key={task.id} className="flex items-center group relative z-10">
                <div className="w-48 shrink-0 pr-4">
                  {taskGroup && (
                    <div className="text-[9px] text-blue-600 font-semibold mb-1">
                      {taskGroup.name}
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-700 truncate">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                  </div>
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="text-[9px] text-slate-400 mt-1">
                      Depends on {task.dependencies.length} task(s)
                    </div>
                  )}
                </div>
                <div className="flex-1 h-8 bg-slate-50 rounded-lg relative overflow-visible">
                  {/* Vertical guides */}
                  <div className="absolute inset-0 flex justify-between px-2 opacity-10 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-px h-full bg-slate-400"></div>
                    ))}
                  </div>

                  {/* Task bar */}
                  <div 
                    className={`absolute h-full rounded shadow-sm flex items-center px-2 transition-all duration-300 ${getTaskColor(task.status)}`}
                    style={{ 
                      left: `${left}%`, 
                      width: `${width}%`,
                      minWidth: width < 2 ? '8px' : undefined,
                    }}
                    title={`${task.title} (${task.status})`}
                  >
                    {width > 10 && (
                      <span className="text-[10px] text-white font-bold truncate">
                        {task.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestones section */}
        {config.features.milestonesEnabled && milestones.length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-xs font-bold text-slate-700">Milestones</span>
            </div>
            <div className="flex items-center">
              <div className="w-48 shrink-0"></div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full relative">
                {milestones.map((milestone, idx) => {
                  const milestoneX = getX(milestone.targetDate);
                  return (
                    <div
                      key={milestone.id}
                      className="absolute -top-1 transform -translate-x-1/2"
                      style={{ left: `${milestoneX}%` }}
                      title={`${milestone.name} - ${new Date(milestone.targetDate).toLocaleDateString()}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        milestone.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-semibold whitespace-nowrap">
                        {milestone.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Project end marker */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center">
            <div className="w-48 shrink-0"></div>
            <div className="flex-1 relative">
              <div 
                className="absolute -top-1 transform -translate-x-1/2"
                style={{ left: '100%' }}
              >
                <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm"></div>
                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-semibold whitespace-nowrap">
                  Project End
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
