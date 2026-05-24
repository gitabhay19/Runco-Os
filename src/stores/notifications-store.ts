"use client";

import { create } from "zustand";
import type { NotificationDTO } from "@/lib/realtime-events";

interface NotificationsState {
  notifications: NotificationDTO[];
  unreadCount: number;
  loaded: boolean;
  setAll(items: NotificationDTO[], unreadCount: number): void;
  add(item: NotificationDTO): void;
  markAllRead(): void;
  markRead(id: string): void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loaded: false,
  setAll: (notifications, unreadCount) =>
    set({ notifications, unreadCount, loaded: true }),
  add: (item) =>
    set((s) => ({
      notifications: [item, ...s.notifications].slice(0, 50),
      unreadCount: item.readAt ? s.unreadCount : s.unreadCount + 1,
    })),
  markAllRead: () =>
    set((s) => ({
      unreadCount: 0,
      notifications: s.notifications.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() }
      ),
    })),
  markRead: (id) =>
    set((s) => {
      const idx = s.notifications.findIndex((n) => n.id === id);
      if (idx === -1) return s;
      const target = s.notifications[idx];
      if (target.readAt) return s;
      const next = [...s.notifications];
      next[idx] = { ...target, readAt: new Date().toISOString() };
      return { notifications: next, unreadCount: Math.max(0, s.unreadCount - 1) };
    }),
}));
