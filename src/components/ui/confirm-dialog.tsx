"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 shadow-2xl">
        <DialogHeader className="px-7 pb-5 pt-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border"
            style={{
              borderColor: isDanger ? "hsl(0 72% 60% / 0.3)" : "hsl(38 92% 60% / 0.3)",
              backgroundColor: isDanger ? "hsl(0 72% 60% / 0.1)" : "hsl(38 92% 60% / 0.1)",
            }}
          >
            {isDanger ? (
              <Trash2 className="h-5 w-5 text-destructive" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
          </div>
          <DialogTitle className="font-display text-[20px] font-bold tracking-[-0.02em] text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="border-t border-border bg-canvas/40 px-7 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className={
              isDanger
                ? "flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:flex-none"
                : "flex-1 sm:flex-none"
            }
          >
            {isDanger && <Trash2 className="h-3.5 w-3.5" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
