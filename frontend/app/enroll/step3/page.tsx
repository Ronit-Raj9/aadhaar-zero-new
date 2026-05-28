'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, ArrowLeft, Camera, CheckCircle2, Video, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { enrollmentAPI } from '@/lib/api-client';

export default function EnrollmentStep3() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, updateLiveness, updateStep } = useEnrollment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [livenessScore, setLivenessScore] = useState<number | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraEnabled(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Could not access camera. Please check your device.'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1];
  }, []);

  const startLivenessCheck = async () => {
    if (!cameraEnabled) {
      await startCamera();
      return;
    }

    setIsRecording(true);
    updateLiveness({ status: 'in-progress' });

    try {
      // Capture multiple frames for liveness analysis
      const frames: string[] = [];
      for (let i = 0; i < 3; i++) {
        const frame = captureFrame();
        if (frame) frames.push(frame);
        if (i < 2) await new Promise((r) => setTimeout(r, 500));
      }

      if (frames.length === 0) {
        toast.error('Failed to capture camera frames');
        updateLiveness({ status: 'failed' });
        setIsRecording(false);
        return;
      }

      const response = await enrollmentAPI.verifyLiveness(frames);

      if (response.success && response.data) {
        const score = response.data.livenessScore * 100;
        setLivenessScore(score);
        updateLiveness({ status: 'completed' });
        toast.success('Liveness verification successful!');
      } else {
        updateLiveness({ status: 'failed' });
        toast.error('Liveness verification failed');
      }
    } catch (error) {
      updateLiveness({ status: 'failed' });
      toast.error('Error during liveness check');
      console.error(error);
    } finally {
      setIsRecording(false);
      stopCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.liveness.status !== 'completed' || livenessScore === null) {
      toast.error('Please complete liveness verification first');
      return;
    }
    if (livenessScore < 75) {
      toast.error('Liveness score too low. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      updateStep(3);
      router.push('/enroll/step4');
    } catch (error) {
      toast.error('Failed to proceed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
              <h1 className="text-3xl font-bold">Liveness Verification</h1>
            </div>
            <p className="text-muted-foreground">Prove you&apos;re a real person with our AI-powered liveness detection</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step 3 of 4</span><span>75%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-3/4 bg-blue-600 transition-all duration-300" />
            </div>
          </div>

          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {cameraEnabled ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    {isRecording && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-sm font-medium">Analyzing...</span>
                      </div>
                    )}
                    <Button type="button" size="sm" variant="outline" className="absolute top-4 left-4 bg-black/50 text-white border-white/30 hover:bg-black/70" onClick={stopCamera}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Position your face in the center. The AI will analyze facial features using DeepFace anti-spoofing.
                  </p>
                </div>
              ) : cameraError ? (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300">{cameraError}</p>
                  <Button type="button" variant="outline" size="sm" onClick={startCamera}>Retry Camera</Button>
                </div>
              ) : null}

              <canvas ref={canvasRef} className="hidden" />

              {livenessScore !== null && (
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Liveness Verified</p>
                      <p className="text-sm text-green-800 dark:text-green-200">Confidence Score: {livenessScore.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 transition-all" style={{ width: `${livenessScore}%` }} />
                  </div>
                </div>
              )}

              {data.liveness.status !== 'completed' && (
                <Button type="button" onClick={startLivenessCheck} disabled={isRecording || isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2">
                  {isRecording ? (
                    <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                  ) : cameraEnabled ? (
                    <><Video className="w-4 h-4" />Capture &amp; Check Liveness</>
                  ) : (
                    <><Camera className="w-4 h-4" />Enable Camera</>
                  )}
                </Button>
              )}

              <div className="flex gap-4 pt-4 border-t border-border">
                <Button type="button" onClick={() => router.push('/enroll/step2')} disabled={isSubmitting || isRecording} variant="outline" className="flex-1 h-10 gap-2">
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button type="submit" disabled={isSubmitting || isRecording || data.liveness.status !== 'completed'} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2">
                  {isSubmitting ? (
                    <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                  ) : (
                    <>Next Step<ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
