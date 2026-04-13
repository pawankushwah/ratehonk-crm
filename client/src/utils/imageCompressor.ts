/**
 * Compresses an image file using a canvas.
 * @param file The original image file
 * @param maxWidth Max width of the compressed image
 * @param maxHeight Max height of the compressed image
 * @param quality Compression quality (0 to 1)
 * @returns A promise that resolves to the compressed Blob
 */
export const compressImage = (
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.7
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          mimeType,
          mimeType === 'image/jpeg' ? quality : undefined
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
