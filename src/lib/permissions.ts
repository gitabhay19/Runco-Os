import "server-only";
import { prisma } from "@/lib/prisma";

export const RESOURCES = ["pipeline", "tasks", "contacts", "analytics"] as const;
export type Resource = (typeof RESOURCES)[number];

export type ResourceAccess = Record<Resource, boolean>;

const ALL_TRUE: ResourceAccess = {
  pipeline: true,
  tasks: true,
  contacts: true,
  analytics: true,
};

const ALL_FALSE: ResourceAccess = {
  pipeline: false,
  tasks: false,
  contacts: false,
  analytics: false,
};

/**
 * Returns the per-resource view permissions for a user.
 *  - Admins always get full access.
 *  - Regular users: read from the Permission table.
 *    If no row exists for a resource, default to TRUE (legacy behaviour).
 */
export async function getResourceAccess(userId: string, role: "ADMIN" | "USER"): Promise<ResourceAccess> {
  if (role === "ADMIN") return { ...ALL_TRUE };

  const rows = await prisma.permission.findMany({
    where: { userId, resource: { in: RESOURCES as readonly string[] as string[] } },
    select: { resource: true, canView: true },
  });
  const map: ResourceAccess = { ...ALL_TRUE };
  for (const r of rows) {
    if ((RESOURCES as readonly string[]).includes(r.resource)) {
      map[r.resource as Resource] = r.canView;
    }
  }
  return map;
}

export async function canViewResource(
  userId: string,
  role: "ADMIN" | "USER",
  resource: Resource
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const row = await prisma.permission.findUnique({
    where: { userId_resource: { userId, resource } },
    select: { canView: true },
  });
  if (!row) return true; // default for legacy users
  return row.canView;
}

/**
 * Replaces a user's resource permissions with the supplied map.
 * Use only for non-admin users — admins are managed via the role column.
 */
export async function setResourceAccess(userId: string, access: Partial<ResourceAccess>) {
  const ops = (Object.entries(access) as [Resource, boolean][])
    .filter(([r]) => (RESOURCES as readonly string[]).includes(r))
    .map(([resource, canView]) =>
      prisma.permission.upsert({
        where: { userId_resource: { userId, resource } },
        update: { canView, canEdit: canView, canDelete: false },
        create: { userId, resource, canView, canEdit: canView, canDelete: false },
      })
    );
  if (ops.length > 0) await prisma.$transaction(ops);
}

/**
 * Picks the first allowed route for a user, used to bounce them away from
 * a page they can't view. Falls back to /profile if everything is off.
 */
export function firstAllowedRoute(access: ResourceAccess): string {
  if (access.pipeline) return "/pipeline";
  if (access.tasks) return "/tasks";
  if (access.contacts) return "/contacts";
  if (access.analytics) return "/analytics";
  return "/profile";
}

export function emptyAccess(): ResourceAccess {
  return { ...ALL_FALSE };
}
