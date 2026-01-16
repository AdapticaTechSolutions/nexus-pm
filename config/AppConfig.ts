/**
 * Application Configuration
 * 
 * Centralized configuration system for feature flags and application settings.
 * This allows enabling/disabling features without code changes.
 * 
 * @module config/AppConfig
 */

/**
 * Feature flags configuration
 * Controls which features are enabled in the application
 */
export interface FeatureFlags {
  /** Enable/disable Gantt chart view */
  ganttChartEnabled: boolean;
  
  /** Enable/disable Kanban board view */
  kanbanBoardEnabled: boolean;
  
  /** Enable/disable budget tracking features */
  budgetTrackingEnabled: boolean;
  
  /** Enable/disable client ticketing system */
  clientTicketingEnabled: boolean;
  
  /** Enable/disable client portal access */
  clientPortalEnabled: boolean;
  
  /** Enable/disable task dependencies */
  taskDependenciesEnabled: boolean;
  
  /** Enable/disable milestones */
  milestonesEnabled: boolean;
  
  /** Enable/disable team management */
  teamManagementEnabled: boolean;
  
  /** Enable/disable analytics/reporting */
  analyticsEnabled: boolean;
}

/**
 * Task workflow configuration
 * Defines the available statuses and their transitions
 */
export interface TaskWorkflowConfig {
  /** Available statuses for tasks */
  statuses: string[];
  
  /** Allowed transitions between statuses */
  transitions: Record<string, string[]>; // fromStatus -> [toStatus1, toStatus2, ...]
  
  /** Default status for new tasks */
  defaultStatus: string;
}

/**
 * Ticket workflow configuration
 * Defines the available statuses and their transitions for tickets
 */
export interface TicketWorkflowConfig {
  /** Available statuses for tickets */
  statuses: string[];
  
  /** Allowed transitions between statuses */
  transitions: Record<string, string[]>;
  
  /** Default status for new tickets */
  defaultStatus: string;
}

/**
 * Application configuration
 * Main configuration object containing all settings
 */
export interface AppConfig {
  /** Feature flags */
  features: FeatureFlags;
  
  /** Task workflow configuration */
  taskWorkflow: TaskWorkflowConfig;
  
  /** Ticket workflow configuration */
  ticketWorkflow: TicketWorkflowConfig;
  
  /** Default currency code */
  defaultCurrency: string;
  
  /** Application name */
  appName: string;
  
  /** Application version */
  version: string;
}

/**
 * Default application configuration
 * 
 * This is the baseline configuration. In a production system,
 * this would typically be loaded from environment variables,
 * a database, or a configuration file.
 */
export const defaultAppConfig: AppConfig = {
  features: {
    ganttChartEnabled: true,
    kanbanBoardEnabled: true,
    budgetTrackingEnabled: true,
    clientTicketingEnabled: true,
    clientPortalEnabled: true,
    taskDependenciesEnabled: true,
    milestonesEnabled: true,
    teamManagementEnabled: true,
    analyticsEnabled: false, // Disabled by default
  },
  
  taskWorkflow: {
    statuses: ['todo', 'in-progress', 'review', 'blocked', 'done', 'cancelled'],
    transitions: {
      'todo': ['in-progress', 'blocked', 'cancelled'],
      'in-progress': ['review', 'blocked', 'todo'],
      'review': ['done', 'in-progress', 'blocked'],
      'blocked': ['todo', 'in-progress'],
      'done': [], // Terminal state
      'cancelled': [], // Terminal state
    },
    defaultStatus: 'todo',
  },
  
  ticketWorkflow: {
    statuses: ['open', 'in-progress', 'pending', 'resolved', 'closed', 'cancelled'],
    transitions: {
      'open': ['in-progress', 'pending', 'cancelled'],
      'in-progress': ['pending', 'resolved', 'open'],
      'pending': ['in-progress', 'resolved', 'open'],
      'resolved': ['closed', 'open'],
      'closed': [], // Terminal state
      'cancelled': [], // Terminal state
    },
    defaultStatus: 'open',
  },
  
  defaultCurrency: 'USD',
  appName: 'Nexus PM',
  version: '1.0.0',
};

/**
 * Get the current application configuration
 * 
 * In a real application, this would fetch from a config service,
 * environment variables, or user preferences.
 * 
 * @returns Current application configuration
 */
export const getAppConfig = (): AppConfig => {
  // For now, return default config
  // In production, this could read from localStorage, API, or env vars
  const stored = localStorage.getItem('appConfig');
  if (stored) {
    try {
      return { ...defaultAppConfig, ...JSON.parse(stored) };
    } catch {
      return defaultAppConfig;
    }
  }
  return defaultAppConfig;
};

/**
 * Update application configuration
 * 
 * @param updates Partial configuration updates
 */
export const updateAppConfig = (updates: Partial<AppConfig>): void => {
  const current = getAppConfig();
  const updated = { ...current, ...updates };
  localStorage.setItem('appConfig', JSON.stringify(updated));
};
