"use client";

import { useState, useCallback } from 'react';

export interface ProcessedPhotoResult {
  file: File;
  blobUrl: string;
  sizeKb: number;
}

export type PhotoUploadStatus =
  | 'idle'
  | 'selecting'
  | 'cropping'
  | 'processing'
  | 'uploading'
  | 'success'
  | 'error';

export function usePhotoUpload(initialPhotoUrl?: string) {
  const [status, setStatus] = useState<PhotoUploadStatus>('idle');
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [photoResult, setPhotoResult] = useState<ProcessedPhotoResult | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>(
    initialPhotoUrl || '/pasfoto_default.png'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Sync state if initialPhotoUrl updates externally
  const [prevInitialUrl, setPrevInitialUrl] = useState(initialPhotoUrl);
  if (initialPhotoUrl !== prevInitialUrl) {
    setPrevInitialUrl(initialPhotoUrl);
    if (initialPhotoUrl && !photoResult) {
      setCurrentPhotoUrl(initialPhotoUrl);
    }
  }

  // 1. User selects a local file
  const handleSelectFile = useCallback((file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropOpen(true);
      setStatus('cropping');
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  }, []);

  // 2. User completes crop step
  const handleCropComplete = useCallback((result: ProcessedPhotoResult) => {
    setPhotoResult(result);
    setCurrentPhotoUrl(result.blobUrl);
    setIsCropOpen(false);
    setStatus('idle');
  }, []);

  // 3. Close crop dialog
  const handleCancelCrop = useCallback(() => {
    setIsCropOpen(false);
    setStatus('idle');
  }, []);

  // 4. Re-crop existing raw image if available
  const handleReCrop = useCallback(() => {
    if (rawImageSrc) {
      setIsCropOpen(true);
      setStatus('cropping');
    }
  }, [rawImageSrc]);

  // 5. Delete / Reset photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoResult(null);
    setRawImageSrc(null);
    setCurrentPhotoUrl('/pasfoto_default.png');
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  // 6. Upload with auto-retry logic (max 3 attempts)
  const uploadWithRetry = useCallback(
    async (uploadFn: (file: File) => Promise<string>, maxAttempts = 3): Promise<string> => {
      if (!photoResult?.file) {
        return currentPhotoUrl;
      }

      setStatus('uploading');
      setUploadProgress(10);
      setErrorMessage(null);

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setUploadProgress(30 * attempt);
          const uploadedUrl = await uploadFn(photoResult.file);
          setUploadProgress(100);
          setStatus('success');
          setCurrentPhotoUrl(uploadedUrl);
          return uploadedUrl;
        } catch (err) {
          lastError = err as Error;
          console.warn(`Upload attempt ${attempt} failed:`, err);
          if (attempt < maxAttempts) {
            // Delay exponential backoff before retry (1s, 2s)
            await new Promise((res) => setTimeout(res, attempt * 1000));
          }
        }
      }

      setStatus('error');
      setErrorMessage(
        lastError?.message || 'Gagal mengunggah pas foto setelah beberapa kali percobaan. Silakan coba lagi.'
      );
      throw lastError || new Error('Upload failed');
    },
    [photoResult, currentPhotoUrl]
  );

  return {
    status,
    rawImageSrc,
    isCropOpen,
    photoResult,
    currentPhotoUrl,
    errorMessage,
    uploadProgress,
    handleSelectFile,
    handleCropComplete,
    handleCancelCrop,
    handleReCrop,
    handleRemovePhoto,
    uploadWithRetry,
    setCurrentPhotoUrl,
  };
}
