import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

export const dealInclude = {
  phones: true,
  emails: true,
  assignees: { include: { user: true } },
  stage: true,
  createdBy: true,
  stageNotes: { include: { stage: true }, orderBy: { stage: { order: "asc" } } },
} as const;

export type DealWithRelations = Awaited<
  ReturnType<typeof prisma.deal.findFirstOrThrow<{ include: typeof dealInclude }>>
>;

/**
 * Build a where-clause that respects role-based visibility:
 *   - Admins: see everything
 *   - Users: see deals where they are assigned, or where they created the deal
 */
export function visibilityWhere(user: SessionUser) {
  if (user.role === "ADMIN") return {};
  return {
    OR: [
      { assignees: { some: { userId: user.id } } },
      { createdById: user.id },
    ],
  };
}

export function canEditDeal(user: SessionUser, deal: { assignees: { userId: string }[]; createdById: string }) {
  if (user.role === "ADMIN") return true;
  if (deal.createdById === user.id) return true;
  return deal.assignees.some((a) => a.userId === user.id);
}
