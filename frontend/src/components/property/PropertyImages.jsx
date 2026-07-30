import { useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import api from "../../api/axios";

export default function PropertyImages({ propertyId }) {
  const inputRef = useRef(null);

  async function upload(event) {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (const file of files) {
      formData.append("images", file);
    }

    try {
      await api.post(
        `/properties/${propertyId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Fotos enviadas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar as fotos.");
    }
  }

  if (!propertyId) {
    return (
      <Box mt={4}>
        <Typography color="text.secondary">
          Salve o imóvel primeiro para enviar fotos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Typography variant="h6" mb={2}>
        Fotos do imóvel
      </Typography>

      <Button
        variant="contained"
        onClick={() => inputRef.current.click()}
      >
        Adicionar Fotos
      </Button>

      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept="image/*"
        onChange={upload}
      />
    </Box>
  );
}