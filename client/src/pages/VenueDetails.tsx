import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Star,
  Calendar,
  Mic,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Datos de ejemplo para el local
const venueData = {
  id: "venue1",
  user_id: "user1",
  name: "Club Tropical",
  address: "Calle 23, La Habana, Cuba",
  description:
    "Club Tropical es uno de los lugares más emblemáticos de La Habana para disfrutar de la mejor música en vivo. Contamos con una amplia pista de baile, excelente sistema de sonido y un ambiente único.",
  dni: "12345678",
  venue_photo_url:
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1470&auto=format&fit=crop",
  owner_photo_url:
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1470&auto=format&fit=crop",
  proof_photo_url:
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1470&auto=format&fit=crop",
  status: "pending",
  created_at: "2023-07-01T00:00:00.000Z",
  updated_at: "2023-07-01T00:00:00.000Z",
};

export interface VenueProps {
  id: string;
  user_id: string;
  name: string;
  address: string;
  description: string;
  dni: string;
  venue_photo_url: string;
  owner_photo_url: string;
  proof_photo_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Simulate fetching venue data
    const fetchVenue = async () => {
      try {
        setLoading(true);
        const data = await supabase
          .from("venues")
          .select("*")
          .eq("id", id)
          .single();
        setVenue(data.data);
        console.log(venue);
      } catch (error) {
        toast.error("Error al cargar el local");
        setError(true);
        console.error("Error fetching venue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-fiesta-muted">Local no encontrado</p>
          <Link to="/" className="text-fiesta-primary mt-4 font-medium">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }

  if (!venue) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-fiesta-muted">Local no encontrado</p>
          <Link to="/" className="text-fiesta-primary mt-4 font-medium">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mt-1 mb-4">
        <Link
          to="/"
          className="inline-flex items-center text-fiesta-muted hover:text-fiesta-dark transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span className="text-sm">Volver</span>
        </Link>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={venue.venue_photo_url}
            alt={venue.name}
            className="w-full h-48 object-cover object-center"
          />
        </motion.div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3">{venue.name}</h1>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center mb-3">
            <MapPin size={18} className="mr-2 text-fiesta-primary" />
            <div className="flex-1">
              <h3 className="text-sm font-medium">Dirección</h3>
              <p className="text-sm text-fiesta-muted">{venue.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-medium mb-2">Descripción</h2>
          <p
            className="text-sm text-fiesta-muted"
            dangerouslySetInnerHTML={{ __html: venue.description }}
          ></p>
        </div>
      </div>
    </Layout>
  );
};

export default VenueDetails;
