const COMPRESSION_THRESHOLD = 2 * 1024 * 1024;
const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.9;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível processar a imagem."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível comprimir a imagem."));
      },
      type,
      type === "image/png" ? undefined : JPEG_QUALITY
    );
  });
}

export async function compressPropertyImage(file) {
  // Preserva WebP animado, que perderia os quadros ao passar pelo canvas.
  if (file.type === "image/webp") return file;

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const shouldResize = scale < 1;

  if (!shouldResize && file.size < COMPRESSION_THRESHOLD) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const blob = await canvasToBlob(canvas, outputType);
  if (blob.size >= file.size) return file;

  return new File([blob], file.name, {
    type: outputType,
    lastModified: file.lastModified,
  });
}
