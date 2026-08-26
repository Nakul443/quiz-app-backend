export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
} as const;

export type AttemptStatus = typeof ATTEMPT_STATUS[keyof typeof ATTEMPT_STATUS];