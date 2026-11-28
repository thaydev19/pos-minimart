"use client";

// ============================================================================
// Manual System Update Card (for Settings Page)
// Only runs when explicitly triggered by the user on Tauri Desktop (.exe).
// ============================================================================

import React, { useEffect, useState } from "react";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type UpdateHandle = Awaited<
  ReturnType<typeof import("@tauri-apps/plugin-updater").check>
>;

function isTauriDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  const isCapacitor = Boolean(
    (w.Capacitor as { isNativePlatform?: () => boolean } | undefined)?.isNativePlatform?.()
  );
  if (isCapacitor) return false;
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_METADATA__);
}

export function SystemUpdateCard() {
  const [appVersion, setAppVersion] = useState<string>("0.1.0");
  const [isChecking, setIsChecking] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<NonNullable<UpdateHandle> | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpToDate, setIsUpToDate] = useState(false);

  useEffect(() => {
    if (!isTauriDesktop()) return;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then((ver) => {
        if (ver) setAppVersion(ver);
      })
      .catch(() => {});
  }, []);

  const handleCheckUpdate = async () => {
    if (!isTauriDesktop()) {
      toast.info("ຟັງຊັນອັບເດດໃຊ້ໄດ້ສະເພາະໃນແອັບ Windows (.exe)");
      return;
    }

    setIsChecking(true);
    setStatusMessage(null);
    setIsUpToDate(false);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setAvailableUpdate(update);
        setStatusMessage(`ພົບເວີຊັນໃໝ່ v${update.version}`);
      } else {
        setAvailableUpdate(null);
        setIsUpToDate(true);
        setStatusMessage("ລະບົບເປັນເວີຊັນຫຼ້າສຸດແລ້ວ");
        toast.success("ລະບົບເປັນເວີຊັນຫຼ້າສຸດແລ້ວ");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "ບໍ່ສາມາດເຊື່ອມຕໍ່ເຊີບເວີອັບເດດໄດ້ (ກະລຸນາກວດສອບອິນເຕີເນັດ)";
      setStatusMessage(msg);
      toast.error("ກວດສອບອັບເດດບໍ່ສຳເລັດ");
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!availableUpdate || isDownloading) return;
    setIsDownloading(true);
    setProgressPercent(0);
    setStatusMessage("ກຳລັງດາວໂຫຼດ ແລະ ຕິດຕັ້ງອັບເດດ...");

    try {
      let downloaded = 0;
      let contentLength = 0;

      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength ?? 0;
          downloaded = 0;
          setProgressPercent(0);
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setProgressPercent(
              Math.min(100, Math.round((downloaded / contentLength) * 100))
            );
          }
        } else if (event.event === "Finished") {
          setProgressPercent(100);
        }
      });

      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "ບໍ່ສາມາດຕິດຕັ້ງອັບເດດໄດ້";
      setStatusMessage(msg);
      setIsDownloading(false);
      toast.error("ຕິດຕັ້ງອັບເດດບໍ່ສຳເລັດ");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              ອັບເດດລະບົບ (System Update)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ກົດກວດສອບ ແລະ ອັບເດດເວີຊັນໃໝ່ດ້ວຍຕົນເອງ
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
          v{appVersion}
        </span>
      </div>

      {isDownloading && (
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
            <span>ກຳລັງດາວໂຫຼດ ແລະ ຕິດຕັ້ງ...</span>
            {progressPercent !== null && (
              <span className="font-mono font-bold text-emerald-700">
                {progressPercent}%
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full bg-emerald-600 transition-all duration-200"
              style={{ width: `${progressPercent ?? 30}%` }}
            />
          </div>
        </div>
      )}

      {statusMessage && !isDownloading && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border ${
            isUpToDate || availableUpdate
              ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
              : "bg-slate-50 border-slate-200/80 text-slate-600"
          }`}
        >
          {isUpToDate && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="pt-0.5">
        {availableUpdate ? (
          <button
            type="button"
            onClick={handleInstallUpdate}
            disabled={isDownloading}
            className="w-full h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isDownloading ? "animate-spin" : ""}`}
            />
            <span>
              {isDownloading
                ? "ກຳລັງຕິດຕັ້ງ..."
                : `ອັບເດດເປັນ v${availableUpdate.version}`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-emerald-600 ${
                isChecking ? "animate-spin" : ""
              }`}
            />
            <span>
              {isChecking ? "ກຳລັງກວດສອບ..." : "ກວດສອບອັບເດດ"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
