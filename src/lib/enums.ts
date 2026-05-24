// String-based enums kept in app code so the schema stays portable
// between SQLite (dev) and Postgres (prod).

export const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const ActivityStatus = {
  ACTIVE: "ACTIVE",
  IDLE: "IDLE",
  STALE: "STALE",
} as const;
export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus];
