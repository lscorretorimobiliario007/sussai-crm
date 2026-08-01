import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import api from "../../api/axios";
import { compressPropertyImage } from "../../utils/imageCompression";
import ImovelGallery from "../imoveis/ImovelGallery";
import ConfirmDialog from "../ui/ConfirmDialog";
import Loading from "../ui/Loading";
import { useToast } from "../ui/Toast";

const MAX_IMAGES = 30;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function errorMessage(error, fallback) {
  const message = error.response?.data?.message || error.response?.data?.erro;
  return Array.isArray(message) ? message.join(", ") : message || fallback;
}

export default function PropertyImages({ propertyId, title = "Imóvel", readOnly = false }) {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [coverUpdatingId, setCoverUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const controllersRef = useRef(new Map());
  const canceledRef = useRef(new Set());
  const previewUrlsRef = useRef(new Set());
  const cleanupTimerRef = useRef(null);
  const loadRequestRef = useRef(0);
  const propertyIdRef = useRef(propertyId);

  useEffect(() => () => {
    controllersRef.current.forEach((controller) => controller.abort());
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
  }, []);

  const loadImages = useCallback(async () => {
    if (!propertyId) return;
    const requestId = ++loadRequestRef.current;
    try {
      const { data } = await api.get(`/properties/${propertyId}/images`);
      if (requestId !== loadRequestRef.current) return;
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      toast.error(errorMessage(error, "Erro ao carregar as fotos."));
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [propertyId, toast]);

  useEffect(() => {
    propertyIdRef.current = propertyId;
    loadRequestRef.current += 1;
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    canceledRef.current.clear();
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    setPendingImages([]);
    setImages([]);
    setUploading(false);
    setReordering(false);
    setCoverUpdatingId(null);
    setDeleteTarget(null);
    setDeleting(false);
  }, [propertyId]);

  useEffect(() => {
    setLoading(Boolean(propertyId));
    loadImages();
  }, [loadImages, propertyId]);

  const updatePendingImage = (id, values) => {
    setPendingImages((current) =>
      current.map((item) => (item.id === id ? { ...item, ...values } : item))
    );
  };

  const addFiles = (files) => {
    if (!files.length) return;

    const validFiles = [];
    let invalidTypeCount = 0;
    let oversizedCount = 0;

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) invalidTypeCount += 1;
      else if (file.size > MAX_IMAGE_SIZE) oversizedCount += 1;
      else validFiles.push(file);
    });

    const reservedCount = pendingImages.filter(
      (item) => !["completed", "canceled"].includes(item.status)
    ).length;
    const availableSlots = Math.max(0, MAX_IMAGES - images.length - reservedCount);
    const acceptedFiles = validFiles.slice(0, availableSlots);

    if (invalidTypeCount) {
      toast.error(
        `${invalidTypeCount} arquivo(s) ignorado(s). Use apenas imagens JPG, PNG ou WEBP.`
      );
    }
    if (oversizedCount) {
      toast.error(
        `${oversizedCount} imagem(ns) excede(m) o limite de 10 MB por arquivo.`
      );
    }
    if (validFiles.length > availableSlots) {
      toast.error(`O limite é de ${MAX_IMAGES} imagens por imóvel.`);
    }

    if (!acceptedFiles.length) return;

    const now = Date.now();
    const nextItems = acceptedFiles.map((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return {
        id: `pending-${now}-${index}-${file.name}`,
        file,
        previewUrl,
        progress: 0,
        status: "pending",
        error: "",
      };
    });

    setPendingImages((current) => [
      ...current,
      ...nextItems,
    ]);
  };

  const removePendingImage = (id) => {
    const item = pendingImages.find((image) => image.id === id);
    if (!item || item.status === "uploading") return;
    URL.revokeObjectURL(item.previewUrl);
    previewUrlsRef.current.delete(item.previewUrl);
    canceledRef.current.delete(id);
    setPendingImages((current) => current.filter((image) => image.id !== id));
  };

  const cancelUpload = (id) => {
    canceledRef.current.add(id);
    controllersRef.current.get(id)?.abort();
    updatePendingImage(id, { status: "canceled", error: "", progress: 0 });
  };

  const reorderPending = (ids) => {
    setPendingImages((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      const reordered = ids.map((id) => byId.get(id)).filter(Boolean);
      const omitted = current.filter((item) => !ids.includes(item.id));
      return [...reordered, ...omitted];
    });
  };

  const uploadPending = async () => {
    const items = pendingImages.filter((item) => item.status === "pending");
    if (!items.length || uploading) return;

    const uploadPropertyId = propertyId;
    setUploading(true);
    let completedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      if (uploadPropertyId !== propertyIdRef.current) break;
      if (canceledRef.current.has(item.id)) continue;

      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);
      updatePendingImage(item.id, { status: "uploading", progress: 0, error: "" });

      try {
        const compressedFile = await compressPropertyImage(item.file);
        if (uploadPropertyId !== propertyIdRef.current) break;
        if (canceledRef.current.has(item.id)) continue;

        const formData = new FormData();
        formData.append("images", compressedFile);
        const { data } = await api.post(`/properties/${uploadPropertyId}/images`, formData, {
          signal: controller.signal,
          onUploadProgress: (event) => {
            const total = event.total || compressedFile.size;
            const progress = total ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
            updatePendingImage(item.id, { progress });
          },
        });
        if (uploadPropertyId !== propertyIdRef.current) break;

        const uploadedImages = Array.isArray(data) ? data : [data].filter(Boolean);
        setImages((current) => {
          const uploadedIds = new Set(uploadedImages.map((image) => image.id));
          return [
            ...current.filter((image) => !uploadedIds.has(image.id)),
            ...uploadedImages,
          ];
        });
        completedCount += 1;
        updatePendingImage(item.id, { status: "completed", progress: 100 });
      } catch (error) {
        if (error.code === "ERR_CANCELED" || canceledRef.current.has(item.id)) {
          updatePendingImage(item.id, { status: "canceled", progress: 0, error: "" });
        } else {
          errorCount += 1;
          updatePendingImage(item.id, {
            status: "error",
            error: errorMessage(error, "Erro ao enviar esta imagem."),
          });
        }
      } finally {
        controllersRef.current.delete(item.id);
      }
    }

    if (uploadPropertyId !== propertyIdRef.current) return;
    setUploading(false);
    await loadImages();

    if (completedCount) {
      toast.success(
        `${completedCount} ${completedCount === 1 ? "imagem enviada" : "imagens enviadas"} com sucesso.`
      );
    }
    if (errorCount) {
      toast.error(`${errorCount} ${errorCount === 1 ? "imagem falhou" : "imagens falharam"} no envio.`);
    }

    cleanupTimerRef.current = setTimeout(() => {
      setPendingImages((current) => {
        current
          .filter((item) => item.status === "completed")
          .forEach((item) => {
            URL.revokeObjectURL(item.previewUrl);
            previewUrlsRef.current.delete(item.previewUrl);
          });
        return current.filter((item) => item.status !== "completed");
      });
    }, 1500);
  };

  const overallProgress = useMemo(() => {
    if (!pendingImages.length) return 0;
    const total = pendingImages.reduce((sum, item) => {
      if (item.status === "completed") return sum + 100;
      return sum + item.progress;
    }, 0);
    return Math.round(total / pendingImages.length);
  }, [pendingImages]);

  const setCover = async (image) => {
    const targetPropertyId = propertyId;
    setCoverUpdatingId(image.id);
    try {
      await api.patch(`/properties/${targetPropertyId}/images/${image.id}/cover`);
      if (targetPropertyId !== propertyIdRef.current) return;
      toast.success("Foto principal atualizada.");
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao atualizar a foto principal."));
    } finally {
      setCoverUpdatingId(null);
    }
  };

  const reorder = async (imageIds) => {
    const targetPropertyId = propertyId;
    const nextImages = imageIds
      .map((imageId) => images.find((image) => image.id === imageId))
      .filter(Boolean);
    const nextCover = nextImages[0];
    setImages(
      nextImages.map((image, index) => ({
        ...image,
        isCover: index === 0,
      }))
    );
    setReordering(true);
    try {
      await api.patch(`/properties/${targetPropertyId}/images/order`, { imageIds });
      if (targetPropertyId !== propertyIdRef.current) return;
      if (nextCover && !nextCover.isCover) {
        await api.patch(`/properties/${targetPropertyId}/images/${nextCover.id}/cover`);
      }
      if (targetPropertyId !== propertyIdRef.current) return;
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao reordenar as fotos."));
      await loadImages();
    } finally {
      setReordering(false);
    }
  };

  const remove = async () => {
    const targetPropertyId = propertyId;
    const targetImageId = deleteTarget.id;
    setDeleting(true);
    try {
      await api.delete(`/properties/${targetPropertyId}/images/${targetImageId}`);
      if (targetPropertyId !== propertyIdRef.current) return;
      toast.success("Foto removida.");
      setDeleteTarget(null);
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao remover a foto."));
    } finally {
      setDeleting(false);
    }
  };

  if (!propertyId) {
    return (
      <Box mt={4}>
        <Typography color="text.secondary">
          Salve o imóvel primeiro para enviar fotos.
        </Typography>
      </Box>
    );
  }

  if (loading) return <Loading variant="skeleton" rows={2} />;

  return (
    <Box mt={4}>
      <Typography variant="h6" mb={2}>
        Fotos do imóvel
      </Typography>
      <ImovelGallery
        photos={images}
        title={title}
        uploading={uploading}
        reordering={reordering}
        coverUpdatingId={coverUpdatingId}
        maxImages={MAX_IMAGES}
        pendingImages={pendingImages}
        overallProgress={overallProgress}
        onFilesSelected={readOnly ? undefined : addFiles}
        onStartUpload={readOnly ? undefined : uploadPending}
        onRemovePending={readOnly ? undefined : removePendingImage}
        onCancelUpload={readOnly ? undefined : cancelUpload}
        onPendingReorder={readOnly ? undefined : reorderPending}
        onDelete={readOnly ? undefined : setDeleteTarget}
        onSetCover={readOnly ? undefined : setCover}
        onReorder={readOnly ? undefined : reorder}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title="Remover foto"
        description="A foto será removida permanentemente."
        confirmLabel="Remover"
      />
    </Box>
  );
}