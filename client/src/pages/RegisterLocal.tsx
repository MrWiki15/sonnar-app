import { useState } from "react";
import Layout from "@/components/Layout";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, MapPin, User, FileText, Building, Globe } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";

const RegisterVenue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(false); // Estado para el switch de local online

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    dni: "",
    venue_photo_url: "",
    owner_photo_url: "",
    proof_photo_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para registrar un local");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("venues")
        .insert([
          {
            ...formData,
            user_id: user.id,
            status: "pending",
            is_online: isOnline, // Agregar el campo is_online
            proof_photo_url: isOnline ? null : formData.proof_photo_url, // Enviar null si es online
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Local registrado con éxito. En revisión.");
      navigate(`/local/${data.id}`);
    } catch (error: any) {
      console.error("Error registering venue:", error);
      toast.error(error.message || "Error al registrar el local");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "name",
      "address",
      "dni",
      "venue_photo_url",
      "owner_photo_url",
    ];

    // Si no es online, requerir el comprobante de propiedad
    if (!isOnline) {
      requiredFields.push("proof_photo_url");
    }

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast.error("Por favor complete todos los campos requeridos");
      return false;
    }

    if (!isOnline && formData.dni.length !== 11) {
      toast.error("El DNI debe tener 11 dígitos");
      return false;
    }

    return true;
  };

  const handleImageUpload = async (file: File, field: string) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("key", "f1a01c8fc535982da566e0030279cf26");

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.data?.url) {
        setFormData((prev) => ({ ...prev, [field]: data.data.url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Building size={24} />
          Registrar Nuevo Local
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <Building size={16} />
                Nombre del Local*
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-fiesta-primary/50"
                placeholder="Ej. Casa de la Música"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Switch para local online */}
            <div className="flex items-center space-x-2">
              <Switch
                id="online"
                checked={isOnline}
                onCheckedChange={(checked) => setIsOnline(checked)}
              />
              <label htmlFor="online" className="text-sm">
                Local Online
              </label>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  {isOnline ? <Globe size={16} /> : <MapPin size={16} />}
                  {isOnline ? "Enlace a Red Social*" : "Dirección*"}
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                  placeholder={
                    isOnline
                      ? "Ej. https://facebook.com/milocal"
                      : "Calle y número"
                  }
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <FileText size={16} />
                Descripción
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm min-h-[100px]"
                placeholder="Describa las características del local..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <User size={16} />
                {isOnline ? "Usuario Dueño del Local*" : "DNI del Propietario*"}
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                placeholder={
                  isOnline
                    ? "Ej. @usuario"
                    : "Número de identificación (11 dígitos)"
                }
                value={formData.dni}
                onChange={(e) =>
                  setFormData({ ...formData, dni: e.target.value })
                }
                pattern={isOnline ? undefined : "\\d{11}"}
                required
              />
            </div>
          </div>

          {/* Subida de Imágenes */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Foto del Local*
              </label>
              <ImageUploader
                imageUrl={formData.venue_photo_url}
                onFileUpload={(file) =>
                  handleImageUpload(file, "venue_photo_url")
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Foto del Propietario*
              </label>
              <ImageUploader
                imageUrl={formData.owner_photo_url}
                onFileUpload={(file) =>
                  handleImageUpload(file, "owner_photo_url")
                }
              />
            </div>

            {/* Comprobante de Propiedad (solo si no es online) */}
            {!isOnline && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comprobante de Propiedad*
                </label>
                <ImageUploader
                  imageUrl={formData.proof_photo_url}
                  onFileUpload={(file) =>
                    handleImageUpload(file, "proof_photo_url")
                  }
                />
              </div>
            )}
          </div>

          <ButtonAnimated
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            className="mt-6"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">Registrando...</div>
            ) : (
              "Registrar Local"
            )}
          </ButtonAnimated>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterVenue;
