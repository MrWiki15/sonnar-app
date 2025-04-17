import { useState } from "react";
import { ArrowLeft, Camera, Upload, User } from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileCompletionFormProps = {
  initialData?: any;
  onComplete: () => void;
};

const ProfileCompletionForm = ({
  initialData,
  onComplete,
}: ProfileCompletionFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatar_url || null
  );
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || user?.user_metadata?.name || "",
    description: initialData?.description || "",
    province: initialData?.province || "",
    address: initialData?.address || "",
    exact_address: initialData?.exact_address || "",
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.full_name ||
      !formData.description ||
      !formData.province ||
      !formData.address ||
      !formData.exact_address
    ) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (!avatarFile && !avatarPreview) {
      toast.error("La foto de perfil es obligatoria");
      return;
    }

    try {
      setLoading(true);

      let avatar_url = avatarPreview;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

        // Create avatars bucket if it doesn't exist
        const { data: bucketData, error: bucketError } =
          await supabase.storage.getBucket("avatars");

        if (bucketError && bucketError.message.includes("not found")) {
          await supabase.storage.createBucket("avatars", { public: true });
        }

        const { error: uploadError, data } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicURL } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatar_url = publicURL.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          description: formData.description,
          province: formData.province,
          address: formData.address,
          exact_address: formData.exact_address,
          avatar_url,
          is_profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
      onComplete();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <div className="flex items-center mb-6">
        <ArrowLeft
          size={20}
          className="mr-2 text-fiesta-muted"
          onClick={() => window.history.back()}
        />
        <h1 className="text-xl font-bold">Completa tu perfil</h1>
      </div>

      <p className="text-fiesta-muted mb-6">
        Para crear eventos y utilizar todas las funciones de la plataforma, es
        necesario completar tu perfil.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                <User size={32} className="text-gray-400" />
              </div>
            )}

            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-fiesta-primary text-white rounded-full p-2 shadow-md cursor-pointer"
            >
              <Camera size={16} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <span className="text-sm text-fiesta-muted">Foto de perfil</span>
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Tu nombre y apellido"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="input-primary min-h-[100px]"
            placeholder="Cuéntanos sobre ti"
            required
          />
        </div>

        <div>
          <label htmlFor="province" className="block text-sm font-medium mb-1">
            Ciudad
          </label>
          <input
            id="province"
            name="province"
            type="text"
            value={formData.province}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Tu ciudad"
            required
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">
            Dirección aproximada
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Cerca del estadio Guillermon Moncada etc..."
            required
          />
        </div>

        <div>
          <label
            htmlFor="exact_address"
            className="block text-sm font-medium mb-1"
          >
            Dirección exacta
          </label>
          <input
            id="exact_address"
            name="exact_address"
            type="text"
            value={formData.exact_address}
            onChange={handleInputChange}
            className="input-primary"
            placeholder="Detalles adicionales de ubicación"
            required
          />
        </div>

        <ButtonAnimated
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
        >
          {initialData?.is_profile_completed
            ? "Actualizar perfil"
            : "Completar perfil"}
        </ButtonAnimated>
      </form>
    </div>
  );
};

export default ProfileCompletionForm;
