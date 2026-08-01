import { useCallback, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import api from "../../api/axios";
import ImovelGallery from "../imoveis/ImovelGallery";
import ConfirmDialog from "../ui/ConfirmDialog";
import Loading from "../ui/Loading";
import { useToast } from "../ui/Toast";

const MAX_IMAGES = 40;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function errorMessage(error, fallback) {
  const message = error.response?.data?.message || error.response?.data?.erro;
  return Array.isArray(message) ? message.join(", ") : message || fallback;
}

export default function PropertyImages({ propertyId, title = "Imóvel", readOnly = false }) {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadImages = useCallback(async () => {
    if (!propertyId) return;
    try {
      const { data } = await api.get(`/properties/${propertyId}/images`);
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao carregar as fotos."));
    } finally {
      setLoading(false);
    }
  }, [propertyId, toast]);

  useEffect(() => {
    setLoading(Boolean(propertyId));
    loadImages();
  }, [loadImages, propertyId]);

  const upload = async (files, event) => {
    if (!files.length) return;
    const invalid = files.find(
      (file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE
    );

    if (invalid || files.length + images.length > MAX_IMAGES) {
      toast.error(
        invalid
          ? "Use imagens JPEG, PNG ou WebP com até 10 MB."
          : `O limite é de ${MAX_IMAGES} fotos por imóvel.`
      );
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      await api.post(`/properties/${propertyId}/images`, formData);
      toast.success("Fotos adicionadas com sucesso.");
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao enviar as fotos."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const setCover = async (image) => {
    try {
      await api.patch(`/properties/${propertyId}/images/${image.id}/cover`);
      toast.success("Foto principal atualizada.");
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao atualizar a foto principal."));
    }
  };

  const reorder = async (imageIds) => {
    setReordering(true);
    try {
      await api.patch(`/properties/${propertyId}/images/order`, { imageIds });
      await loadImages();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao reordenar as fotos."));
      await loadImages();
    } finally {
      setReordering(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/properties/${propertyId}/images/${deleteTarget.id}`);
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
        maxImages={MAX_IMAGES}
        onUpload={readOnly ? undefined : upload}
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