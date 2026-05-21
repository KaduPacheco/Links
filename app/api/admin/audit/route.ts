import { NextResponse } from "next/server";
import { listAdminAuditEvents } from "@/lib/admin-audit";
import { isAdminSessionRequiredError, requireAdminSession } from "@/lib/admin-session";
import {
  adminAuditActionOptions,
  adminAuditTimeRangeOptions,
  type AdminAuditAction,
  type AdminAuditTimeRange
} from "@/types/admin-audit";

const allowedActions = new Set<AdminAuditAction | "all">(adminAuditActionOptions.map((option) => option.value));
const allowedTimeRanges = new Set<AdminAuditTimeRange>(adminAuditTimeRangeOptions.map((option) => option.value));

function parseAuditAction(value: string): AdminAuditAction | "all" {
  return allowedActions.has(value as AdminAuditAction | "all") ? (value as AdminAuditAction | "all") : "all";
}

function parseAuditTimeRange(value: string): AdminAuditTimeRange {
  return allowedTimeRanges.has(value as AdminAuditTimeRange) ? (value as AdminAuditTimeRange) : "24h";
}

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession();

    if (session.role === "editor") {
      return NextResponse.json({ error: "Editores nao podem visualizar a auditoria." }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 25);
    const before = url.searchParams.get("before");
    const action = url.searchParams.get("action") ?? "all";
    const actor = url.searchParams.get("actor") ?? "";
    const timeRange = url.searchParams.get("timeRange") ?? "24h";
    const page = await listAdminAuditEvents(session.account_id, limit, before, {
      action: parseAuditAction(action),
      actor,
      timeRange: parseAuditTimeRange(timeRange)
    });

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { error: isAdminSessionRequiredError(error) ? error.message : "Erro ao carregar auditoria." },
      { status: isAdminSessionRequiredError(error) ? 401 : 400 }
    );
  }
}
