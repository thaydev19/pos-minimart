"use client";

// ============================================================================
// Camera Barcode Scanner Modal for Touchscreen & Android Tablets
// Uses html5-qrcode for instant optical barcode detection (EAN-13, Code 128, QR)
// Plays synthetic audio feedback & haptic vibration upon match
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onBarcodeDetected,
}: CameraBarcodeScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const elementId = "pos-camera-barcode-region";
    let isMounted = true;

    const startScanner = async () => {
      try {
        setScannerError(null);
        setIsScanning(true);

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const qrCode = new Html5Qrcode(elementId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = qrCode;

        await qrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 300, height: 180 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            const code = decodedText.trim();
            if (code) {
              triggerHapticFeedback(40);
              setLastScanned(code);
              onBarcodeDetected(code);
              toast.success(`ສະແກນພົບ: ${code}`);

              // Pause scanning for 1.5s to prevent continuous spamming
              try {
                qrCode.pause(true);
                setTimeout(() => {
                  if (isMounted) {
                    try {
                      qrCode.resume();
                    } catch {}
                  }
                }, 1500);
              } catch {}
            }
          },
          () => {
            // Frame analysis error (normal while scanning)
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Camera scanner init error:", err);
        setScannerError(
          err?.message || "ບໍ່ສາມາດເປີດກ້ອງຖ່າຍຮູບໄດ້ ກະລຸນາກວດສອບສິດການເຂົ້າເຖິງກ້ອງ (Camera Permission)"
        );
        setIsScanning(false);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                html5QrCodeRef.current?.clear();
              } catch {}
              html5QrCodeRef.current = null;
            });
        } catch {}
      }
    };
  }, [isOpen, onBarcodeDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl flex flex-col items-center overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ສະແກນບາໂຄດດ້ວຍກ້ອງ (Camera Barcode)
              </h3>
              <p className="text-[11px] text-zinc-400">
                ວາງລະຫັດບາໂຄດໃຫ້ກົງກັບກອບສີ່ຫຼ່ຽມ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewfinder Region */}
        <div className="relative w-full my-4 rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[280px]">
          <div id="pos-camera-barcode-region" className="w-full h-full" />

          {scannerError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-zinc-900/95 text-rose-400 space-y-2">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-xs font-semibold leading-relaxed">
                {scannerError}
              </p>
            </div>
          )}
        </div>

        {/* Scan Status Feedback */}
        {lastScanned && (
          <div className="w-full mb-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold font-mono">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>ລະຫັດຫຼ້າສຸດ: {lastScanned}</span>
          </div>
        )}

        {/* Footer controls */}
        <div className="w-full flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
          >
            ປິດ (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
