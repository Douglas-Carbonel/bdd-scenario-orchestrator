export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed';
}

export interface TestSuite {
  id: string;
  name: string;
  companyId: string;
  parentId: string | null; // null = root level
  order: number;
  createdAt: Date;
}

export interface Scenario {
  id: string;
  title: string;
  companyId: string;
  sprintId?: string;
  suiteId?: string; // NEW: link to test suite
  feature: string;
  given: string[];
  when: string[];
  then: string[];
  tags: string[];
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  status: 'draft' | 'ready' | 'running' | 'passed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestRun {
  id: string;
  scenarioId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'passed' | 'failed';
  logs?: string[];
}

// Helper type for tree structure
export interface SuiteTreeNode extends TestSuite {
  children: SuiteTreeNode[];
  scenarios: Scenario[];
}
