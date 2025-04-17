import { useState, useCallback } from "react";
import { Upload, ImageIcon, Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface ImageUploaderProps {
  imageUrl?: string;
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const ImageUploader = ({
  imageUrl,
  onFileUpload,
  isLoading = false,
}: ImageUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validación de tipo de archivo
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen");
        return;
      }

      // Validación de tamaño (ejemplo: 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("El tamaño máximo permitido es 5MB");
        return;
      }

      setError(null);
      const reader = new FileReader();

      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
      onFileUpload(file);
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
    disabled: isLoading,
  });

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`group relative border-2 border-dashed rounded-xl p-4 transition-all
          ${
            isDragActive
              ? "border-fiesta-primary bg-fiesta-primary/10"
              : "border-gray-200"
          }
          ${error ? "border-red-500 bg-red-50" : ""}
          ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-fiesta-primary"
          }`}
      >
        <input {...getInputProps()} required />

        <div className="flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-fiesta-primary animate-spin" />
              <p className="text-sm text-gray-500">Subiendo imagen...</p>
            </div>
          ) : previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-40 w-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-fiesta-primary/10 rounded-full">
                {isDragActive ? (
                  <Upload className="h-6 w-6 text-fiesta-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-fiesta-primary" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Suelta la imagen aquí"
                    : "Haz clic o arrastra una imagen"}
                </p>
                <p className="text-xs text-gray-500">
                  Formatos: JPEG, PNG, WEBP (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <X size={14} />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
