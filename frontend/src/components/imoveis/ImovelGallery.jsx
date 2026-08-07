import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  CancelOutlined,
  CloudUploadOutlined,
  DragIndicator,
  DeleteOutlined,
  ErrorOutlined,
  Star,
  StarBorder,
  UploadOutlined,
} from "@mui/icons-material";
import AuthenticatedImage from "./AuthenticatedImage";
import Button from "../ui/Button";

function SortableThumb({
  photo,
  selected,
  onSelect,
  onSetCover,
  onDelete,
  canManage,
  coverUpdating,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(photo.id)}
      sx={{
        position: "relative",
        flex: "0 0 auto",
        border: 2,
        borderColor: selected ? "primary.main" : "transparent",
        borderRadius: 2.5,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "background.paper",
      }}
    >
      <AuthenticatedImage src={photo.url} alt="" sx={{ width: 100, height: 76 }} />
      {photo.isCover && <Star sx={{ position: "absolute", top: 4, right: 4, color: "warning.main", fontSize: 18 }} />}
      {canManage && (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ position: "absolute", bottom: 2, left: 2, right: 2, justifyContent: "space-between" }}
          onClick={(event) => event.stopPropagation()}
        >
          <IconButton size="small" {...attributes} {...listeners} sx={{ bgcolor: "rgba(15,23,42,.72)", color: "white", width: 24, height: 24 }}>
            <DragIndicator sx={{ fontSize: 14 }} />
          </IconButton>
          {!photo.isCover && onSetCover && (
            <IconButton
              size="small"
              disabled={coverUpdating}
              onClick={() => onSetCover(photo)}
              sx={{ bgcolor: "rgba(15,23,42,.72)", color: "white", width: 24, height: 24 }}
            >
              {coverUpdating ? <CircularProgress size={14} color="inherit" /> : <StarBorder sx={{ fontSize: 14 }} />}
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" color="error" onClick={() => onDelete(photo)} sx={{ bgcolor: "rgba(15,23,42,.72)", color: "white", width: 24, height: 24 }}>
              <DeleteOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}

const STATUS_DETAILS = {
  pending: { label: "Pronto para enviar", color: "default", icon: null },
  uploading: { label: "Uploadando...", color: "info", icon: <CircularProgress size={13} color="inherit" /> },
  completed: { label: "Concluído", color: "success", icon: <Box component="span">✓</Box> },
  error: { label: "Erro", color: "error", icon: <ErrorOutlined /> },
  canceled: { label: "Cancelado", color: "default", icon: <CancelOutlined /> },
};

function PendingThumb({ item, uploading, onRemove, onCancel }) {
  const sortable = useSortable({
    id: item.id,
    disabled: uploading || item.status !== "pending",
  });
  const details = STATUS_DETAILS[item.status] || STATUS_DETAILS.pending;
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.65 : 1,
    zIndex: sortable.isDragging ? 3 : 1,
  };

  return (
    <Box
      ref={sortable.setNodeRef}
      style={style}
      sx={{
        position: "relative",
        width: 150,
        flex: "0 0 auto",
        border: 1,
        borderColor: item.status === "error" ? "error.main" : "divider",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: sortable.isDragging ? 6 : 0,
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
        "&:hover": { transform: sortable.isDragging ? undefined : "translateY(-2px)", boxShadow: 3 },
      }}
    >
      <AuthenticatedImage src={item.previewUrl} alt={item.file.name} sx={{ width: 150, height: 100 }} />
      <Stack spacing={0.75} sx={{ p: 1 }}>
        <Typography variant="caption" noWrap title={item.file.name}>
          {item.file.name}
        </Typography>
        <Chip
          size="small"
          color={details.color}
          icon={details.icon}
          label={details.label}
          sx={{ alignSelf: "flex-start", maxWidth: "100%" }}
        />
        {(item.status === "uploading" || item.status === "completed") && (
          <LinearProgress
            variant="determinate"
            value={item.progress}
            color={item.status === "completed" ? "success" : "primary"}
            sx={{ height: 5, borderRadius: 10 }}
          />
        )}
        {item.error && (
          <Typography variant="caption" color="error.main" title={item.error}>
            {item.error}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={0.25} sx={{ position: "absolute", top: 4, right: 4 }}>
        {item.status === "pending" && (
          <Tooltip title="Arrastar para reordenar">
            <IconButton
              size="small"
              {...sortable.attributes}
              {...sortable.listeners}
              sx={{ bgcolor: "rgba(15,23,42,.76)", color: "white" }}
            >
              <DragIndicator fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {item.status === "uploading" || (uploading && item.status === "pending") ? (
          <Tooltip title={item.status === "uploading" ? "Cancelar upload" : "Cancelar envio"}>
            <IconButton
              size="small"
              onClick={() => onCancel(item.id)}
              sx={{ bgcolor: "rgba(15,23,42,.76)", color: "white" }}
            >
              <CancelOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Remover da fila">
            <IconButton
              size="small"
              onClick={() => onRemove(item.id)}
              sx={{ bgcolor: "rgba(15,23,42,.76)", color: "white" }}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

export default function ImovelGallery({
  photos = [],
  title,
  uploading = false,
  reordering = false,
  coverUpdatingId = null,
  maxImages = 30,
  pendingImages = [],
  overallProgress = 0,
  onUpload,
  onFilesSelected,
  onStartUpload,
  onRemovePending,
  onCancelUpload,
  onPendingReorder,
  onDelete,
  onSetCover,
  onSetPrincipal,
  onReorder,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const selectedIndex = photos.findIndex((photo) => photo.id === selectedId);
  const selected = selectedIndex >= 0 ? photos[selectedIndex] : photos[0];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const setCoverHandler = onSetCover || onSetPrincipal;
  const canManage = Boolean(onReorder || onDelete || setCoverHandler);
  const canAddFiles = Boolean(onFilesSelected || onUpload);
  const pendingCount = pendingImages.filter((item) => item.status === "pending").length;
  const reservedCount = pendingImages.filter(
    (item) => !["completed", "canceled"].includes(item.status)
  ).length;

  useEffect(() => {
    if (photos.length && !photos.some((photo) => photo.id === selectedId)) {
      setSelectedId(photos[0].id);
    }
  }, [photos, selectedId]);

  const onDragEnd = (event) => {
    if (!onReorder || reordering) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((photo) => photo.id === active.id);
    const newIndex = photos.findIndex((photo) => photo.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(photos, oldIndex, newIndex);
    onReorder(next.map((photo) => photo.id));
  };

  const onPendingDragEnd = (event) => {
    if (!onPendingReorder || uploading) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pendingImages.findIndex((item) => item.id === active.id);
    const newIndex = pendingImages.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onPendingReorder(arrayMove(pendingImages, oldIndex, newIndex).map((item) => item.id));
  };

  const selectFiles = (files, event) => {
    if (onFilesSelected) onFilesSelected(files);
    else if (onUpload) onUpload(files, event || { target: { value: "" } });
    if (event?.target) event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    if (!canAddFiles || uploading) return;
    selectFiles(Array.from(event.dataTransfer.files || []));
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
        <AuthenticatedImage src={selected?.url} alt={title} sx={{ width: "100%", height: { xs: 280, md: 480 } }} />
        {reordering && (
          <Chip
            icon={<CircularProgress size={15} color="inherit" />}
            label="Salvando nova ordem..."
            color="primary"
            sx={{ position: "absolute", top: 16, left: 16 }}
          />
        )}
        {selected && (
          <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, right: 16 }}>
            {selected.isCover && <Chip icon={<Star />} label="Foto principal" color="primary" />}
            {!selected.isCover && setCoverHandler && (
              <Tooltip title="Definir como principal">
                <IconButton
                  disabled={coverUpdatingId === selected.id}
                  onClick={() => setCoverHandler(selected)}
                  sx={{ bgcolor: "background.paper" }}
                >
                  {coverUpdatingId === selected.id ? <CircularProgress size={22} /> : <StarBorder />}
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Remover foto">
                <IconButton color="error" onClick={() => onDelete(selected)} sx={{ bgcolor: "background.paper" }}>
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      </Box>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map((photo) => photo.id)} strategy={horizontalListSortingStrategy}>
          <Stack direction="row" spacing={1.25} sx={{ overflowX: "auto", pb: 1 }}>
            {photos.map((photo) => (
              <SortableThumb
                key={photo.id}
                photo={photo}
                selected={selected?.id === photo.id}
                onSelect={setSelectedId}
                onSetCover={setCoverHandler}
                onDelete={onDelete}
                canManage={canManage}
                coverUpdating={coverUpdatingId === photo.id}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      {canAddFiles && photos.length + reservedCount < maxImages && (
        <Box
          onDragEnter={(event) => {
            event.preventDefault();
            if (!uploading) setIsDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsDragActive(false);
          }}
          onDrop={handleDrop}
          sx={{
            border: 2,
            borderStyle: "dashed",
            borderColor: isDragActive ? "primary.main" : "divider",
            bgcolor: isDragActive ? "action.selected" : "background.paper",
            borderRadius: 3,
            p: 2.5,
            textAlign: "center",
            transition: "border-color .2s ease, background-color .2s ease, transform .2s ease",
            transform: isDragActive ? "scale(1.01)" : "none",
          }}
        >
          <CloudUploadOutlined
            color={isDragActive ? "primary" : "disabled"}
            sx={{ fontSize: 38, mb: 0.5, transition: "color .2s ease" }}
          />
          <Typography fontWeight={750}>
            {isDragActive ? "Solte as imagens aqui" : "Arraste imagens para esta área"}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            JPG, PNG ou WEBP • até 10 MB por imagem • máximo de {maxImages}
          </Typography>
          <Button
            component="label"
            variant="outlined"
            disabled={uploading}
            startIcon={<AddPhotoAlternateOutlined />}
          >
            Selecionar imagens
            <input
              hidden
              multiple
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => selectFiles(Array.from(event.target.files || []), event)}
            />
          </Button>
        </Box>
      )}

      {pendingImages.length > 0 && (
        <Stack spacing={1.25} sx={{ animation: "sussaiFadeUp .25s ease" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography fontWeight={800}>Imagens selecionadas</Typography>
              <Typography variant="caption" color="text.secondary">
                Confira os previews e arraste para definir a ordem antes do envio.
              </Typography>
            </Box>
            {onStartUpload && pendingCount > 0 && (
              <Button
                variant="contained"
                loading={uploading}
                startIcon={<UploadOutlined />}
                onClick={onStartUpload}
              >
                Enviar {pendingCount} {pendingCount === 1 ? "imagem" : "imagens"}
              </Button>
            )}
          </Stack>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPendingDragEnd}>
            <SortableContext
              items={pendingImages.map((item) => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Stack direction="row" spacing={1.25} sx={{ overflowX: "auto", pb: 1 }}>
                {pendingImages.map((item) => (
                  <PendingThumb
                    key={item.id}
                    item={item}
                    uploading={uploading}
                    onRemove={onRemovePending}
                    onCancel={onCancelUpload}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          {uploading && (
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Progresso geral</Typography>
                <Typography variant="caption" fontWeight={700}>{overallProgress}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{ height: 7, borderRadius: 10 }}
              />
            </Box>
          )}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary">
        {photos.length}/{maxImages} fotos{onReorder ? " • arraste para reordenar • estrela = principal" : ""}
      </Typography>
    </Stack>
  );
}
