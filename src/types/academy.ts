export type AcademyMetric = {
  id: string;
  labelKey: string;
  value: string;
};

export type AcademyProgressData = {
  metrics: AcademyMetric[];
  booksGoal: number;
  booksCompleted: number;
  daysRemaining: number;
};
