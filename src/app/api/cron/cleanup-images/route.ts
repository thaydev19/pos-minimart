import { NextRequest, NextResponse } from "next/server";
import { ImageCleanupService } from "@/features/products/services/image-cleanup.service";

export const dynamic = "force-dynamic";

/**
 * Automated Cron Job Endpoint: Clean Orphaned Product Images
 * Can be scheduled via Vercel Cron, external webhook, or called manually.
 * 
 * Default grace period: 7 days.
 * Safety: Only unreferenced files older than 7 days are deleted.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional Bearer token authorization if CRON_SECRET is set in environment
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const gracePeriodDays = daysParam ? Math.max(1, parseInt(daysParam, 10)) : 7;

    const report = await ImageCleanupService.cleanOrphanedProductImages(gracePeriodDays);

    return NextResponse.json({
      status: report.success ? "success" : "partial_error",
      message: `Cleaned ${report.orphanedFound} orphaned product images (grace period: ${gracePeriodDays} days)`,
      report,
    });
  } catch (err: any) {
    console.error("[CronCleanupImages] Execution failed:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Failed to clean orphaned images",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
