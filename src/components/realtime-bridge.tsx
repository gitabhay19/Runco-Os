"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import type { RealtimeEvent } from "@/lib/realtime-events";

interface Props {
  enabled: boolean;
}

export function RealtimeBridge({ enabled }: Props) {
  const pipelineRef = useRef(usePipelineStore.getState());
  const tasksRef = useRef(useTasksStore.getState());

  useEffect(() => {
    return usePipelineStore.subscribe((state) => {
      pipelineRef.current = state;
    });
  }, []);
  useEffect(() => {
    return useTasksStore.subscribe((state) => {
      tasksRef.current = state;
    });
  }, []);

  // Hydrate notifications on mount.
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        useNotificationsStore.getState().setAll(d.notifications ?? [], d.unreadCount ?? 0);
      })
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource("/api/events");

    es.onmessage = (msg) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }
      handle(event);
    };

    return () => es.close();
  }, [enabled]);

  return null;
}

function handle(event: RealtimeEvent) {
  const pipeline = usePipelineStore.getState();
  const tasks = useTasksStore.getState();
  const notifs = useNotificationsStore.getState();

  switch (event.type) {
    case "deal:created":
      pipeline.upsertDeal(event.deal);
      break;

    case "deal:updated":
      pipeline.upsertDeal(event.deal);
      break;

    case "deal:moved": {
      const before = pipeline.deals.find((d) => d.id === event.deal.id);
      pipeline.upsertDeal(event.deal);
      if (before && before.stageId !== event.deal.stageId) {
        toast.message(`${event.deal.companyName} moved`, {
          description: `Now in ${event.deal.stage.name}`,
        });
      }
      break;
    }

    case "deal:deleted":
      pipeline.removeDeal(event.dealId);
      break;

    case "task:created":
      tasks.upsertTask(event.task);
      break;

    case "task:updated":
      tasks.upsertTask(event.task);
      break;

    case "task:deleted":
      tasks.removeTask(event.taskId);
      break;

    case "notification:new": {
      notifs.add(event.notification);
      const n = event.notification;
      toast.message(n.title, { description: n.body ?? undefined });
      break;
    }
  }
}
