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
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  DragIndicator,
  DeleteOutlined,
  Star,
  StarBorder,
} from "@mui/icons-material";
import AuthenticatedImage from "./AuthenticatedImage";
import Button from "../ui/Button";

function SortableThumb({ photo, selected, onSelect, onSetPrincipal, onDelete, canManage }) {
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
      {photo.principal && <Star sx={{ position: "absolute", top: 4, right: 4, color: "warning.main", fontSize: 18 }} />}
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
          {!photo.principal && onSetPrincipal && (
            <IconButton size="small" onClick={() => onSetPrincipal(photo)} sx={{ bgcolor: "rgba(15,23,42,.72)", color: "white", width: 24, height: 24 }}>
              <StarBorder sx={{ fontSize: 14 }} />
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

export default function ImovelGallery({
  photos = [],
  title,
  uploading = false,
  reordering = false,
  onUpload,
  onDelete,
  onSetPrincipal,
  onReorder,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedIndex = photos.findIndex((photo) => photo.id === selectedId);
  const selected = selectedIndex >= 0 ? photos[selectedIndex] : photos[0];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const canManage = Boolean(onReorder || onDelete || onSetPrincipal);

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

  return (
    <Stack spacing={1.5}>
      <Box sx={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
        <AuthenticatedImage src={selected?.url} alt={title} sx={{ width: "100%", height: { xs: 280, md: 480 } }} />
        {selected && (
          <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, right: 16 }}>
            {selected.principal && <Chip icon={<Star />} label="Foto principal" color="primary" />}
            {!selected.principal && onSetPrincipal && (
              <Tooltip title="Definir como principal">
                <IconButton onClick={() => onSetPrincipal(selected)} sx={{ bgcolor: "background.paper" }}>
                  <StarBorder />
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
                onSetPrincipal={onSetPrincipal}
                onDelete={onDelete}
                canManage={canManage}
              />
            ))}
            {onUpload && photos.length < 20 && (
              <Button component="label" variant="outlined" loading={uploading} startIcon={<AddPhotoAlternateOutlined />} sx={{ minWidth: 160, minHeight: 76 }}>
                Adicionar fotos
                <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onUpload(Array.from(event.target.files || []), event)} />
              </Button>
            )}
          </Stack>
        </SortableContext>
      </DndContext>
      <Typography variant="caption" color="text.secondary">
        {photos.length}/20 fotos{onReorder ? " • arraste para reordenar • estrela = principal" : ""}
      </Typography>
    </Stack>
  );
}
