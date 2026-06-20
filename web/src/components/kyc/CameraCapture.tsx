"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Unable to access camera. Please allow camera permissions or upload a file instead.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `passport-capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopStream();
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden">
      <div className="relative aspect-[4/3] bg-black">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn("h-full w-full object-cover", !ready && "opacity-0")}
          />
        )}
        {ready && (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-white/30 m-6 rounded-xl" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4 bg-slate-900">
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready || !!error}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          Capture photo
        </button>
      </div>
    </div>
  );
}
