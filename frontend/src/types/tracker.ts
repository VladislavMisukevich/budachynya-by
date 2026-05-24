export interface TrackerStep {
  month: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

export interface TrackerPlan {
  targetUniversity: string;
  targetFaculty: string;
  targetSpecialty: string;
  requiredScore: number;
  currentScore: number;
  gap: number;
  feasibility: 'high' | 'medium' | 'low';
  feasibilityText: string;
  weakSubjects: string[];
  strongSubjects: string[];
  steps: TrackerStep[];
  generatedAt: string;
}
