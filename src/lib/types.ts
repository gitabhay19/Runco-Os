// Shared client-side types for pipeline data.

export interface StageDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  color: string;
  isTerminal: boolean;
}

export interface PhoneDTO {
  id: string;
  number: string;
  label: string | null;
}

export interface EmailDTO {
  id: string;
  address: string;
  label: string | null;
}

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  designation?: string | null;
  avatarColor?: string | null;
}

export interface StageNoteDTO {
  id: string;
  stageId: string;
  text: string;
  stage: { id: string; name: string; color: string; order: number };
  createdAt: string;
  updatedAt: string;
}

export interface DealDTO {
  id: string;
  companyName: string;
  contactName: string;
  designation: string | null;
  description: string | null;
  website: string | null;
  followUpDate: string | null;
  value: number | null;
  currency: string;
  activityStatus: "ACTIVE" | "IDLE" | "STALE";
  position: number;
  stageId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  phones: PhoneDTO[];
  emails: EmailDTO[];
  assignees: { user: UserLite }[];
  stage: StageDTO;
  createdBy: UserLite;
  stageNotes: StageNoteDTO[];
}

export interface StageHistoryDTO {
  id: string;
  fromStage: { id: string; name: string; color: string } | null;
  toStage: { id: string; name: string; color: string };
  movedBy: { id: string; name: string; email: string; avatarColor: string };
  createdAt: string;
  note: string | null;
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: UserLite;
  createdBy: { id: string; name: string; email: string; avatarColor: string | null };
  createdAt: string;
  updatedAt: string;
}
