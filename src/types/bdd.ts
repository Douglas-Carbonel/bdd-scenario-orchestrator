export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  apiKey: string;
  createdAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  companyId: string;
  productId?: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed';
}

export interface TestSuite {
  id: string;
  name: string;
  companyId: string;
  productId?: string;
  parentId: string | null;
  order: number;
  createdAt: Date;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ExecutionType = 'manual' | 'automated';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  companyId: string;
}

export interface Scenario {
  id: string;
  title: string;
  companyId: string;
  productId?: string;
  sprintId?: string;
  suiteId?: string;
  feature: string;
  given: string[];
  when: string[];
  then: string[];
  tags: string[];
  priority: Priority;
  assigneeId?: string;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'draft' | 'ready' | 'running' | 'passed' | 'failed';
  executionType: ExecutionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestRun {
  id: string;
  scenarioId: string;
  sprintId?: string;
  executedBy: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  status: 'running' | 'passed' | 'failed';
  errorMessage?: string;
  logs?: string[];
  evidenceUrls?: string[];
}

export interface SuiteTreeNode extends TestSuite {
  children: SuiteTreeNode[];
  scenarios: Scenario[];
}

// Stats for reports
export interface DailyStats {
  date: string;
  passed: number;
  failed: number;
  total: number;
}
