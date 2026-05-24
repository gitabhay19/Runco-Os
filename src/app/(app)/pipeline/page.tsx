import { redirect } from "next/navigation";
import { Topbar } from "@/components/app-shell/topbar";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { prisma } from "@/lib/prisma";
import { dealInclude, visibilityWhere } from "@/lib/deals";
import { requireUser } from "@/lib/session";
import { canViewResource, getResourceAccess, firstAllowedRoute } from "@/lib/permissions";
import type { DealDTO, StageDTO, UserLite } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await requireUser();
  if (!(await canViewResource(user.id, user.role, "pipeline"))) {
    redirect(firstAllowedRoute(await getResourceAccess(user.id, user.role)));
  }

  const [stages, dealsRaw, usersRaw] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.deal.findMany({
      where: visibilityWhere(user),
      include: dealInclude,
      orderBy: [{ stageId: "asc" }, { position: "asc" }],
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        avatarColor: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const stagesDTO: StageDTO[] = stages.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    order: s.order,
    color: s.color,
    isTerminal: s.isTerminal,
  }));

  const dealsDTO: DealDTO[] = dealsRaw.map((d) => ({
    id: d.id,
    companyName: d.companyName,
    contactName: d.contactName,
    designation: d.designation,
    description: d.description,
    followUpDate: d.followUpDate?.toISOString() ?? null,
    value: d.value,
    currency: d.currency,
    activityStatus: d.activityStatus as "ACTIVE" | "IDLE" | "STALE",
    position: d.position,
    stageId: d.stageId,
    createdById: d.createdById,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    phones: d.phones.map((p) => ({ id: p.id, number: p.number, label: p.label })),
    emails: d.emails.map((e) => ({ id: e.id, address: e.address, label: e.label })),
    assignees: d.assignees.map((a) => ({
      user: {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        role: a.user.role as "ADMIN" | "USER",
        designation: a.user.designation,
        avatarColor: a.user.avatarColor,
      },
    })),
    stage: {
      id: d.stage.id,
      name: d.stage.name,
      slug: d.stage.slug,
      description: d.stage.description,
      order: d.stage.order,
      color: d.stage.color,
      isTerminal: d.stage.isTerminal,
    },
    createdBy: {
      id: d.createdBy.id,
      name: d.createdBy.name,
      email: d.createdBy.email,
      role: d.createdBy.role as "ADMIN" | "USER",
      designation: d.createdBy.designation,
      avatarColor: d.createdBy.avatarColor,
    },
    stageNotes: d.stageNotes.map((n) => ({
      id: n.id,
      stageId: n.stageId,
      text: n.text,
      stage: {
        id: n.stage.id,
        name: n.stage.name,
        color: n.stage.color,
        order: n.stage.order,
      },
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  }));

  const usersDTO: UserLite[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "ADMIN" | "USER",
    designation: u.designation,
    avatarColor: u.avatarColor,
  }));

  const currentUser: UserLite =
    usersDTO.find((u) => u.id === user.id) ?? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor ?? null,
    };

  return (
    <>
      <Topbar title="Pipeline" subtitle="Sales workspace" />
      <PipelineBoard
        initialStages={stagesDTO}
        initialDeals={dealsDTO}
        users={usersDTO}
        currentUser={currentUser}
      />
    </>
  );
}
