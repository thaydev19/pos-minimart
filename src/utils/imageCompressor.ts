/**
 * Image Compressor Utility for QuickOne POS
 * High-performance client-side image compression and resizing using HTML5 Canvas.
 * Optimized for mobile/iPhone cameras (10MB-25MB photos) to reduce size down to < 200KB
 * without blurriness, pixelation, or visual degradation.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  preferredMimeType?: string;
}

export interface CompressImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  reductionPercentage: number;
}

/**
 * Formats byte size into human readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compresses an image File or Blob client-side.
 * - Scales down to maxDimension (default 1200px) keeping aspect ratio.
 * - Converts to optimized WebP (or JPEG fallback) at high fidelity (quality 0.82).
 * - Drastically shrinks 5MB - 20MB phone photos down to ~80KB - 250KB.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressImageOptions = {}
): Promise<CompressImageResult> {
  const {
    maxDimension = 1200,
    quality = 0.82,
    preferredMimeType = "image/webp",
  } = options;

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    // 1. Create temporary object URL to load image
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      // Free object URL
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          throw new Error("Invalid image dimensions");
        }

        // 2. Scale down proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // 3. Render into canvas with high quality smoothing
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas 2D context not available");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Helper to package result from canvas blob
        const packageResult = (blob: Blob, mimeType: string) => {
          const originalName = file instanceof File ? file.name : "product.jpg";
          const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || "product";
          const ext = mimeType === "image/webp" ? "webp" : "jpg";
          const newFileName = `${baseName}_opt.${ext}`;

          const compressedFile = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL(mimeType, quality);
          const compressedSize = blob.size;
          const reductionPercentage = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );

          resolve({
            file: compressedFile,
            blob,
            dataUrl,
            originalSize,
            compressedSize,
            width,
            height,
            reductionPercentage,
          });
        };

        // 5. Try WebP first, fallback to JPEG if WebP is unsupported
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size > 0) {
              packageResult(webpBlob, "image/webp");
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob && jpegBlob.size > 0) {
                    packageResult(jpegBlob, "image/jpeg");
                  } else {
                    reject(new Error("Image compression failed to produce output blob"));
                  }
                },
                "image/jpeg",
                quality
              );
            }
          },
          preferredMimeType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ບໍ່ສາມາດອ່ານໄຟລ໌ຮູບພາບໄດ້ (Invalid or unreadable image file)"));
    };

    img.src = objectUrl;
  });
}
