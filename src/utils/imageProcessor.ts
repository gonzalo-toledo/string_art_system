export async function processImageToGrayscale(
  file: File,
  targetSize: number
): Promise<{ imageData: Float32Array; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context not supported'));

      // Calculate scale to cover the target size while maintaining aspect ratio
      const scale = Math.max(targetSize / img.width, targetSize / img.height);
      const x = (targetSize / scale - img.width) / 2;
      const y = (targetSize / scale - img.height) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);

      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(img, x, y);
      ctx.restore();

      const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
      const data = imageData.data;
      
      const radius = targetSize / 2;
      const floatData = new Float32Array(targetSize * targetSize);

      for (let y = 0; y < targetSize; y++) {
        for (let x = 0; x < targetSize; x++) {
          const idx = (y * targetSize + x) * 4;
          const distToCenter = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
          
          if (distToCenter > radius) {
            floatData[y * targetSize + x] = 0;
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
            data[idx + 3] = 255;
          } else {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            floatData[y * targetSize + x] = 255 - luminance;
            
            data[idx] = luminance;
            data[idx + 1] = luminance;
            data[idx + 2] = luminance;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const previewUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      
      resolve({ imageData: floatData, previewUrl });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
