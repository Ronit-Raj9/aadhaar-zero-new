'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, ArrowLeft, Upload, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { enrollmentAPI } from '@/lib/api-client';

export default function EnrollmentStep2() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, updateDocument, updateStep } = useEnrollment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i < 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await enrollmentAPI.uploadDocument(file);
      updateDocument({ file });
      setUploadProgress(100);
      toast.success('Document uploaded successfully');
      
      // Auto-extract data
      setTimeout(async () => {
        try {
          setUploadProgress(0);
          const extractResponse = await enrollmentAPI.extractDocumentData(file.name || 'uploaded-doc');
          if (extractResponse.success && extractResponse.data) {
            updateDocument({ extractedData: extractResponse.data });
            toast.success('Document data extracted successfully');
          }
        } catch (error) {
          console.error('Extraction failed:', error);
          toast.error('Failed to extract document data');
        } finally {
          setIsUploading(false);
        }
      }, 500);
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.document.file) {
      toast.error('Please upload a document');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep(2);
      router.push('/enroll/step3');
    } catch (error) {
      toast.error('Failed to proceed');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h1 className="text-3xl font-bold">Upload Document</h1>
            </div>
            <p className="text-muted-foreground">
              Upload your government-issued ID document for verification
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step 2 of 4</span>
              <span>50%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/2 bg-blue-600 transition-all duration-300" />
            </div>
          </div>

          {/* Form */}
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Document Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['aadhaar', 'pan', 'license', 'passport'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateDocument({ type: type as any })}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium capitalize ${
                        data.document.type === type
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          : 'border-border hover:border-blue-600/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload {data.document.type?.toUpperCase()}</Label>

                {data.document.file ? (
                  <div className="border-2 border-dashed border-green-500 rounded-lg p-6 bg-green-50 dark:bg-green-950/30 text-center space-y-2">
                    <FileText className="w-8 h-8 text-green-600 mx-auto" />
                    <p className="font-medium text-green-600 dark:text-green-400">{data.document.file.name}</p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70">
                      {(data.document.file.size / 1024).toFixed(2)} KB
                    </p>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border rounded-lg p-12 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer block text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Drop your document here</p>
                    <p className="text-sm text-muted-foreground">or click to select from your device</p>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or PDF (max 10MB)</p>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      disabled={isUploading || isSubmitting}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Extracted Data Preview */}
              {data.document.extractedData && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Extracted Data:</p>
                  <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                    {Object.entries(data.document.extractedData).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => router.push('/enroll/step1')}
                  disabled={isSubmitting || isUploading}
                  variant="outline"
                  className="flex-1 h-10 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading || !data.document.file}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </>
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
