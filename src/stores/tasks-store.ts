"use client";

import { create } from "zustand";
import type { TaskDTO } from "@/lib/types";

interface TasksState {
  tasks: TaskDTO[];
  loaded: boolean;
  setTasks(tasks: TaskDTO[]): void;
  upsertTask(task: TaskDTO): void;
  removeTask(id: string): void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loaded: false,
  setTasks: (tasks) => set({ tasks, loaded: true }),
  upsertTask: (task) =>
    set((s) => {
      const idx = s.tasks.findIndex((t) => t.id === task.id);
      if (idx === -1) return { tasks: [task, ...s.tasks] };
      const next = [...s.tasks];
      next[idx] = task;
      return { tasks: next };
    }),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
}));
