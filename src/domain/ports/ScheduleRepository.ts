// Repository interface for scheduled/recurring transaction operations (port/contract)
import type { Transaction } from '../ledger';
import { Money } from '../money';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ScheduledTransaction {
  id: string;
  templateTransaction: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'updatedAt'>;
  frequency: ScheduleFrequency;
  startDate: Date;
  endDate?: Date; // If null, runs indefinitely
  nextRunDate: Date;
  lastRunDate?: Date;
  isActive: boolean;
  maxOccurrences?: number;
  occurrenceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleRepository {
  // Schedule CRUD operations
  saveSchedule(schedule: ScheduledTransaction): Promise<void>;
  getSchedule(id: string): Promise<ScheduledTransaction | null>;
  getSchedules(filters?: ScheduleFilters): Promise<ScheduledTransaction[]>;
  updateSchedule(id: string, schedule: Partial<ScheduledTransaction>): Promise<void>;
  deleteSchedule(id: string): Promise<void>;
  
  // Schedule execution
  getDueSchedules(asOfDate?: Date): Promise<ScheduledTransaction[]>;
  executeSchedule(scheduleId: string, executionDate: Date): Promise<Transaction>;
  executeAllDueSchedules(asOfDate?: Date): Promise<Transaction[]>;
  
  // Schedule management
  pauseSchedule(id: string): Promise<void>;
  resumeSchedule(id: string): Promise<void>;
  getNextExecutionDate(scheduleId: string): Promise<Date | null>;
  
  // Bulk operations
  saveSchedules(schedules: ScheduledTransaction[]): Promise<void>;
  cleanupCompletedSchedules(): Promise<number>;
}

export interface ScheduleFilters {
  isActive?: boolean;
  frequency?: ScheduleFrequency | ScheduleFrequency[];
  nextRunFrom?: Date;
  nextRunTo?: Date;
  accountIds?: string[];
  minAmount?: Money;
  maxAmount?: Money;
  limit?: number;
  offset?: number;
}