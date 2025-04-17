import { useState, useEffect } from "react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";
import ImageUploader from "./ImageUploader";

interface ArtistProfileFormProps {
  initialData?: Partial<Profile>;
  onSave: (data: ArtistData) => void;
  onCancel: () => void;
}

interface ArtistData {
  name: string;
  genre: string;
  bio: string;
  instagram: string;
  spotify: string;
  image: string;
}

const ArtistProfileForm = ({
  initialData,
  onSave,
  onCancel,
}: ArtistProfileFormProps) => {
  const [formData, setFormData] = useState<ArtistData>({
    name: initialData?.name || "",
    genre: initialData?.genre || "",
    bio: initialData?.bio || "",
    instagram: initialData?.socials?.instagram || "",
    spotify: initialData?.socials?.spotify || "",
    x: initialData?.socials?.x || "",
    youtube: initialData?.socials?.youtube || "",
    image: initialData?.image || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.genre || !formData.bio) {
      toast.error("Género y biografía son requeridos");
      return;
    }
    onSave(formData);
  };

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("artist-images")
      .upload(`${Date.now()}-${file.name}`, file);

    if (error) {
      toast.error("Error subiendo imagen");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: data?.path
        ? `${supabase.storage.url}/object/public/artist-images/${data.path}`
        : "",
    }));

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <h3 className="font-medium mb-4">Perfil de Artista</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            className="input-primary"
            placeholder="Nombre artistico"
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Género musical principal</Label>
          <Input
            value={formData.genre}
            onChange={(e) =>
              setFormData({ ...formData, genre: e.target.value })
            }
            placeholder="Ej: Salsa, Podcaster, Youtuber, XSpaces..."
            required
          />
        </div>

        <div>
          <Label>Biografía</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            required
          />
        </div>

        <div>
          <Label>Instagram</Label>
          <Input
            value={formData.instagram}
            onChange={(e) =>
              setFormData({ ...formData, instagram: e.target.value })
            }
            placeholder="@tuusuario"
          />
        </div>

        <div>
          <Label>Spotify</Label>
          <Input
            value={formData.spotify}
            onChange={(e) =>
              setFormData({ ...formData, spotify: e.target.value })
            }
            placeholder="Enlace a tu perfil"
          />
        </div>

        <div>
          <Label>X</Label>
          <Input
            value={formData.x}
            onChange={(e) => setFormData({ ...formData, x: e.target.value })}
            placeholder="Enlace a tu perfil"
          />
        </div>

        <div>
          <Label>Youtube</Label>
          <Input
            value={formData.youtube}
            onChange={(e) =>
              setFormData({ ...formData, youtube: e.target.value })
            }
            placeholder="Enlace a tu perfil"
          />
        </div>

        <div>
          <Label>Foto de perfil</Label>
          <ImageUploader onFileUpload={handleImageUpload} isLoading={loading} />
        </div>

        <div>
          <Label>Cover</Label>
          <ImageUploader onFileUpload={handleImageUpload} isLoading={loading} />
        </div>

        <div className="flex gap-2">
          <ButtonAnimated type="submit" className="flex-1">
            Guardar Perfil
          </ButtonAnimated>
          <ButtonAnimated
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </ButtonAnimated>
        </div>
      </form>
    </div>
  );
};

export default ArtistProfileForm;
