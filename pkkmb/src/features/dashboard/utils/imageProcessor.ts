export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Client-Side Image Processing Pipeline:
 * 1. Decode & strip EXIF metadata
 * 2. Crop to specified area
 * 3. Resize maximum edge to 1200px
 * 4. Encode to modern WebP format
 * 5. Quality optimization to fit target 300-500 KB
 */
export async function processAndCompressImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  maxDimension = 1200,
  targetMaxSizeBytes = 500 * 1024
): Promise<{ file: File; blobUrl: string; sizeKb: number }> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Handle rotation & crop setup
  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // Set canvas size for full rotated image decode
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extract crop data from full canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('Cropped canvas context unavailable');

  // Calculate target dimension preserving ratio (max 1200px)
  let scale = 1;
  const maxCropDim = Math.max(pixelCrop.width, pixelCrop.height);
  if (maxCropDim > maxDimension) {
    scale = maxDimension / maxCropDim;
  }

  const finalWidth = Math.round(pixelCrop.width * scale);
  const finalHeight = Math.round(pixelCrop.height * scale);

  croppedCanvas.width = finalWidth;
  croppedCanvas.height = finalHeight;

  // Draw cropped and scaled image onto final canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    finalWidth,
    finalHeight
  );

  // Compress & encode to WebP with iterative quality tuning for target 300-500KB
  let quality = 0.85;
  let blob = await canvasToBlob(croppedCanvas, 'image/webp', quality);

  // If size > targetMaxSizeBytes, reduce quality down to 0.5
  while (blob.size > targetMaxSizeBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await canvasToBlob(croppedCanvas, 'image/webp', quality);
  }

  const fileName = `pasfoto_${Date.now()}.webp`;
  const file = new File([blob], fileName, { type: 'image/webp' });
  const blobUrl = URL.createObjectURL(blob);
  const sizeKb = Math.round(blob.size / 1024);

  return { file, blobUrl, sizeKb };
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      type,
      quality
    );
  });
}
