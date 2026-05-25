import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { dealInclude, visibilityWhere } from "@/lib/deals";
import { dealRowToDTO } from "@/lib/dto";
import { canViewResource } from "@/lib/permissions";

/**
 * Returns a deduplicated list of contacts derived from the deals visible to the user.
 * The contact identity is (companyName, contactName).
 */
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!(await canViewResource(user.id, user.role, "contacts"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dealsRaw = await prisma.deal.findMany({
    where: visibilityWhere(user),
    include: dealInclude,
    orderBy: { updatedAt: "desc" },
  });

  const deals = dealsRaw.map(dealRowToDTO);

  const map = new Map<
    string,
    {
      key: string;
      companyName: string;
      contactName: string;
      designation: string | null;
      emails: string[];
      phones: string[];
      lastUpdatedAt: string;
      createdAt: string;
      followUpDate: string | null;
      latestStage: { id: string; name: string; color: string };
      dealIds: string[];
    }
  >();

  for (const d of deals) {
    const key = `${d.companyName.toLowerCase()}|${d.contactName.toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        companyName: d.companyName,
        contactName: d.contactName,
        designation: d.designation,
        emails: d.emails.map((e) => e.address),
        phones: d.phones.map((p) => p.number),
        lastUpdatedAt: d.updatedAt,
        createdAt: d.createdAt,
        followUpDate: d.followUpDate,
        latestStage: { id: d.stage.id, name: d.stage.name, color: d.stage.color },
        dealIds: [d.id],
      });
    } else {
      existing.dealIds.push(d.id);
      for (const e of d.emails) {
        if (!existing.emails.includes(e.address)) existing.emails.push(e.address);
      }
      for (const p of d.phones) {
        if (!existing.phones.includes(p.number)) existing.phones.push(p.number);
      }
      // Earliest contact creation
      if (new Date(d.createdAt).getTime() < new Date(existing.createdAt).getTime()) {
        existing.createdAt = d.createdAt;
      }
      // Closest upcoming follow-up
      if (d.followUpDate) {
        if (
          !existing.followUpDate ||
          new Date(d.followUpDate).getTime() < new Date(existing.followUpDate).getTime()
        ) {
          existing.followUpDate = d.followUpDate;
        }
      }
      // Take the freshest deal for designation + latest stage if newer
      if (new Date(d.updatedAt).getTime() > new Date(existing.lastUpdatedAt).getTime()) {
        existing.lastUpdatedAt = d.updatedAt;
        existing.latestStage = {
          id: d.stage.id,
          name: d.stage.name,
          color: d.stage.color,
        };
        if (d.designation) existing.designation = d.designation;
      }
    }
  }

  return NextResponse.json({
    contacts: Array.from(map.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName)
    ),
    deals,
  });
}
