/**
 * Product Image Cleanup Service
 * Automated Orphaned Image Garbage Collector with a 7-Day Grace Period.
 * 
 * Safety Rules:
 * 1. Files created within the last 7 days are NEVER deleted (Grace Period).
 * 2. Files referenced by ANY product in the database are NEVER deleted.
 * 3. Only files older than 7 days that are completely unreferenced (orphaned) are removed.
 */

import { supabase } from "@/apis/supabase-client";

export interface CleanupReport {
  success: boolean;
  scannedCount: number;
  activeReferencesCount: number;
  gracePeriodDays: number;
  orphanedFound: number;
  deletedFiles: string[];
  skippedRecentCount: number;
  error?: string;
  timestamp: string;
}

export const ImageCleanupService = {
  /**
   * Scans Supabase Storage 'product-images' and removes orphaned images
   * that are older than the specified grace period (default: 7 days).
   */
  async cleanOrphanedProductImages(gracePeriodDays = 7): Promise<CleanupReport> {
    const timestamp = new Date().toISOString();
    const cutoffDate = new Date(Date.now() - gracePeriodDays * 24 * 60 * 60 * 1000);

    try {
      // 1. Fetch all active image URLs from database
      const { data: products, error: dbError } = await supabase
        .from("products")
        .select("image_url")
        .not("image_url", "is", null);

      if (dbError) {
        console.warn("[ImageCleanupService] Failed to query active products:", dbError.message);
      }

      // Collect active filenames from database (e.g. "1732000000_abc.webp")
      const activeFileNames = new Set<string>();
      if (products && products.length > 0) {
        for (const p of products) {
          if (!p.image_url) continue;
          // Extract filename from URL (handles https://.../products/filename.webp or filename.webp)
          const parts = p.image_url.split("/");
          const fileName = parts[parts.length - 1];
          if (fileName && !fileName.startsWith("data:")) {
            // Remove query params if any
            const cleanName = fileName.split("?")[0].trim();
            if (cleanName) {
              activeFileNames.add(cleanName);
            }
          }
        }
      }

      // 2. List all files in Supabase Storage bucket 'product-images' folder 'products'
      const { data: storageFiles, error: storageListError } = await supabase.storage
        .from("product-images")
        .list("products", {
          limit: 1000,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (storageListError) {
        console.warn("[ImageCleanupService] Storage list error:", storageListError.message);
        return {
          success: false,
          scannedCount: 0,
          activeReferencesCount: activeFileNames.size,
          gracePeriodDays,
          orphanedFound: 0,
          deletedFiles: [],
          skippedRecentCount: 0,
          error: storageListError.message,
          timestamp,
        };
      }

      if (!storageFiles || storageFiles.length === 0) {
        return {
          success: true,
          scannedCount: 0,
          activeReferencesCount: activeFileNames.size,
          gracePeriodDays,
          orphanedFound: 0,
          deletedFiles: [],
          skippedRecentCount: 0,
          timestamp,
        };
      }

      // 3. Filter orphaned files respecting the 7-day grace period
      const orphanedPathsToDelete: string[] = [];
      let skippedRecentCount = 0;

      for (const file of storageFiles) {
        // Skip placeholder files or folders
        if (!file.name || file.name === ".emptyFolderPlaceholder") continue;

        // Check file age (created_at)
        const fileCreatedAt = file.created_at ? new Date(file.created_at) : null;
        if (fileCreatedAt && fileCreatedAt > cutoffDate) {
          // File is younger than 7 days: Protect it under Grace Period!
          skippedRecentCount++;
          continue;
        }

        // Check if file is currently used by any product
        if (activeFileNames.has(file.name)) {
          // In active use: Keep it!
          continue;
        }

        // File is unreferenced and older than 7 days -> Safe to clean!
        orphanedPathsToDelete.push(`products/${file.name}`);
      }

      // 4. Batch delete orphaned files if any found
      if (orphanedPathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("product-images")
          .remove(orphanedPathsToDelete);

        if (deleteError) {
          console.error("[ImageCleanupService] Batch delete error:", deleteError.message);
          return {
            success: false,
            scannedCount: storageFiles.length,
            activeReferencesCount: activeFileNames.size,
            gracePeriodDays,
            orphanedFound: orphanedPathsToDelete.length,
            deletedFiles: [],
            skippedRecentCount,
            error: deleteError.message,
            timestamp,
          };
        }
      }

      return {
        success: true,
        scannedCount: storageFiles.length,
        activeReferencesCount: activeFileNames.size,
        gracePeriodDays,
        orphanedFound: orphanedPathsToDelete.length,
        deletedFiles: orphanedPathsToDelete,
        skippedRecentCount,
        timestamp,
      };
    } catch (err: any) {
      console.error("[ImageCleanupService] Unexpected error during cleanup:", err);
      return {
        success: false,
        scannedCount: 0,
        activeReferencesCount: 0,
        gracePeriodDays,
        orphanedFound: 0,
        deletedFiles: [],
        skippedRecentCount: 0,
        error: err.message || "Unknown error",
        timestamp,
      };
    }
  },

  /**
   * Passive background checker for Admin sessions.
   * Runs at most once every 7 days in the background without affecting UI performance.
   */
  schedulePassiveCleanup(gracePeriodDays = 7) {
    if (typeof window === "undefined") return;

    try {
      const STORAGE_KEY = "quickone_last_storage_cleanup_ts";
      const lastRun = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

      if (!lastRun || now - parseInt(lastRun, 10) > ONE_WEEK_MS) {
        // Run after browser becomes idle or after 5 seconds
        const runTask = () => {
          this.cleanOrphanedProductImages(gracePeriodDays)
            .then((report) => {
              if (report.success && report.orphanedFound > 0) {
                console.log(
                  `[ImageCleanup] Cleaned ${report.orphanedFound} orphaned product images older than ${gracePeriodDays} days.`
                );
              }
              localStorage.setItem(STORAGE_KEY, now.toString());
            })
            .catch((err) => {
              console.warn("[ImageCleanup] Passive run error:", err);
            });
        };

        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(runTask, { timeout: 10000 });
        } else {
          setTimeout(runTask, 5000);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  },
};
