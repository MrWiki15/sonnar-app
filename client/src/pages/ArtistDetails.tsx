import Layout from "@/components/Layout";
import {
  Instagram,
  XIcon,
  PhoneCall,
  Facebook,
  Calendar,
  Link,
  MapPin,
  Mic,
  Share2,
  Star,
  Users,
  TwitterIcon,
  Youtube,
  Music,
} from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Artist } from "@/types/supabase";

// Define proper types for social media links
interface SocialLinks {
  x: string;
  instagram: string;
  whatsapp: string;
  youtube: string;
}

const ArtistDetails = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching artist data
    const fetchArtist = async () => {
      try {
        setLoading(true);
        const data = await supabase
          .from("artists")
          .select("*")
          .eq("id", id)
          .single();
        setArtist(data.data);
        console.log(artist);
      } catch (error) {
        setError(true);
        console.error("Error fetching artist:", error);
        toast.error("Error al cargar el artista");
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Error al cargar</h2>
          <p className="text-fiesta-muted mt-2">
            Ha ocurrido un error al cargar la información del artista.
          </p>
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Artista no encontrado</h2>
          <p className="text-fiesta-muted mt-2">
            El artista que buscas no existe o ha sido eliminado.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative h-56 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
          <img
            src={artist.cover}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 z-20 flex items-end">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white mr-3">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">{artist.name}</h1>
              <p className="text-white/80 text-sm">{artist.genre}</p>
            </div>
          </div>
        </div>
        {/* Social Links */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 flex flex-wrap gap-5 justify-between">
          <h2 className="text-lg font-semibold w-full">Redes Sociales</h2>

          {/* Instagram */}
          {artist.socials?.instagram && (
            <a
              href={artist.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-fiesta-muted hover:text-fiesta-primary transition-colors"
            >
              <Instagram size={18} className="mr-2" />
              Instagram
            </a>
          )}

          {/* Twitter (X) */}
          {artist.socials?.x && (
            <a
              href={artist.socials.x}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-fiesta-muted hover:text-fiesta-primary transition-colors"
            >
              <TwitterIcon size={18} className="mr-2" />{" "}
              {/* Asegúrate de importar Twitter desde lucide-react */}
              Twitter
            </a>
          )}

          {/* Facebook */}
          {artist.socials?.facebook && (
            <a
              href={artist.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-fiesta-muted hover:text-fiesta-primary transition-colors"
            >
              <Facebook size={18} className="mr-2" />{" "}
              {/* Asegúrate de importar Facebook desde lucide-react */}
              Facebook
            </a>
          )}

          {/* Spotify */}
          {artist.socials?.spotify && (
            <a
              href={artist.socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-fiesta-muted hover:text-fiesta-primary transition-colors"
            >
              <Music size={18} className="mr-2" />
              Spotify
            </a>
          )}
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Sobre {artist.name}</h2>
          <p
            className="text-fiesta-muted text-sm"
            dangerouslySetInnerHTML={{ __html: artist.bio }}
          ></p>
        </div>
      </div>
    </Layout>
  );
};

export default ArtistDetails;
