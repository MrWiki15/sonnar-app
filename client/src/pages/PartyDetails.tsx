import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Music,
  Share2,
  Users,
  Wine,
  User,
} from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Venue } from "../types/supabase";
import { useAuth } from "@/context/AuthContext";
import { Party as PartyProps } from "../types/supabase";
import DonationModal from "@/components/DonationModal";
import { formatHbar } from "@/lib/utils";
import ShareButton from "@/components/ShareButton";

export interface PartyArtistProps {
  id: string;
  name: string;
  genre: string;
  created_at: string;
  image: string;
}

export interface VenueProps {
  id: string;
  user_id: string; //id del creador del loacl
  name: string;
  address: string;
  description: string;
  dni: string;
  venue_photo_url: string;
  owner_photo_url: string;
  proof_photo_url: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const PartyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<PartyProps | null>(null);
  const [venue, setVenue] = useState<VenueProps | null>(null);
  const [partyArtistsData, setPartyArtistsData] = useState<PartyArtistProps[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [auth, setAuth] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const Yauth = useAuth();
  const navigate = useNavigate();

  const getParty = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      setError(true);
      console.error("Error fetching party:", error);
      return null;
    }
  };

  const getArtist = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching artist:", error);
      return null;
    }
  };

  const getVenue = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching artist:", error);
      return null;
    }
  };

  const handleInterested = async () => {
    if (!party) return;
    if (!id) return;
    if (auth?.user?.id === party?.user_id) {
      toast.info(
        "No puedes marcar tu interés en una fiesta que tu mismo hayas creado"
      );
      return;
    }

    let xPartyId = sessionStorage.getItem(`partyId-${party?.id}`);
    if (xPartyId === "1") {
      toast.info("Ya has marcado tu interés en esta fiesta");
      return;
    }

    if (!party?.id) {
      toast.error("No se pudo identificar la fiesta");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("parties")
        .update({ interested_users: party.interested_users + 1 })
        .eq("id", party.id); // Filtra la fila por el ID de la fiesta

      if (error) {
        throw error;
      }

      toast.success("¡Gracias por tu interés!");
      setParty((prev) => ({
        ...prev!,
        interested_users: prev!.interested_users + 1,
      }));
      await sessionStorage.setItem(`partyId-${party.id}`, "1");
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al registrar tu interés");
    }
  };

  const handleFinanciation = async (id) => {
    navigate("/add-financiation/" + id);
  };

  const handleViewDashboard = async (id) => {
    navigate("/dashboard/" + id);
  };

  const handleAddFinanciation = async (id) => {
    navigate("/add-financiation/" + id);
  };

  useEffect(() => {
    setAuth(Yauth);
    let isMounted = true;

    const fetchData = async () => {
      try {
        const partyData = await getParty(id!);
        if (!isMounted || !partyData) return;

        setParty(partyData);

        // Obtener artistas
        const artists = await Promise.all(
          partyData.artists.map(async (artistId) => {
            return await getArtist(artistId);
          })
        );

        if (isMounted) {
          setPartyArtistsData(
            artists.filter((a) => a !== null) as PartyArtistProps[]
          );
        }

        // Obtener local
        const venueX = await getVenue(partyData.venue);
        if (isMounted) {
          setVenue(venueX);
        }
      } catch (error) {
        setError(true);
        toast.error("Error al cargar la fiesta");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-fiesta-muted">Se encontro un error</p>
          <Link to="/" className="text-fiesta-primary mt-4 font-medium">
            Volver al inicio
          </Link>
          {toast.error("Error al cargar la fiesta")}
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!party && !loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-fiesta-muted">Fiesta no encontrada</p>
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

      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gray-100">
        {party?.images?.length > 0 && (
          <img
            src={party.images[0]}
            alt={`${party.name} - imagen`}
            className="w-full h-64 object-cover object-center"
          />
        )}

        {/* Indicadores de imagen */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {party?.images?.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === 0 ? "bg-white w-6" : "bg-white/60"
              }`}
            ></button>
          ))}
        </div>

        {/* Botón de compartir */}
        <ShareButton eventUrl={window.location.href} eventName={party.name} />

        {/* Etiqueta */}
        <div className="absolute top-3 left-3 flex gap-2">
          {/* Pum Pum */}
          {party && party.is_pum_pum && (
            <div className="bg-fiesta-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
              Free
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3">{party.name}</h1>

        <div
          className="space-y-6"
          style={{
            margin: "1rem 0rem",
          }}
        >
          {/* Progress Bar */}
          <div className="bg-gray-100 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              Progreso de Financiación
            </h3>

            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-fiesta-primary h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (party.collected_amount / (party?.goal_amount || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Recaudado</p>
                  <p className="text-2xl font-bold text-fiesta-primary">
                    {formatHbar(party.collected_amount)}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-600">Objetivo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatHbar(party?.goal_amount || 0)}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <span className="inline-block bg-fiesta-primary/10 px-4 py-2 rounded-full text-fiesta-primary font-medium">
                  {Math.round(
                    (party.collected_amount / (party?.goal_amount || 1)) * 100
                  )}
                  % completado
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-medium mb-2">Descripción</h2>
          <p className="text-sm text-fiesta-muted">{party.description}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center mb-3">
            <Calendar size={18} className="mr-2 text-fiesta-primary" />
            <div>
              <h3 className="text-sm font-medium">Fecha y hora</h3>
              <p className="text-sm text-fiesta-muted">
                {party.date}, Comienza: {party.start_time} - Termina:{" "}
                {party.end_time}
              </p>
            </div>
          </div>

          <div className="flex items-center mb-3">
            <MapPin size={18} className="mr-2 text-fiesta-primary" />
            <div>
              <h3 className="text-sm font-medium">Ubicación</h3>
              <p className="text-sm text-fiesta-muted">{party.address}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Music size={18} className="mr-2 text-fiesta-primary" />
            <div>
              <h3 className="text-sm font-medium">Género</h3>
              <p className="text-sm text-fiesta-muted">
                {party.genre.map((genre) => `${genre} `)}
              </p>
            </div>
          </div>
        </div>

        {partyArtistsData.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
            <h2 className="font-medium mb-3">Artistas</h2>
            <div className="space-y-3">
              {partyArtistsData.map((artist) => (
                <Link to={`/artista/${artist?.id}`} key={artist?.id}>
                  <div className="flex items-center">
                    <img
                      src={artist?.image}
                      alt={artist?.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium">{artist?.name}</p>
                      <p className="text-xs text-fiesta-muted">
                        {artist?.genre}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs text-fiesta-primary">Ver →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-medium mb-3">Amenidades</h2>
          <div className="grid grid-cols-2 gap-3">
            {party &&
              party?.amenities?.map((amenity, index) => (
                <div key={index} className="flex items-center">
                  {index % 2 === 0 ? (
                    <Wine size={16} className="mr-2 text-fiesta-primary" />
                  ) : (
                    <Users size={16} className="mr-2 text-fiesta-primary" />
                  )}
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
          </div>
        </div>

        {venue ? (
          <Link to={`/local/${party?.venue}`} className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <h2 className="font-medium">Organizador</h2>
                <p className="text-sm text-fiesta-muted">{venue.name}</p>
              </div>
              <span className="text-xs text-fiesta-primary">Ver perfil →</span>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center justify-between">
            <div>
              <h2 className="font-medium">Organizador</h2>
              <p className="text-sm text-fiesta-muted">{party.venue}</p>
            </div>
          </div>
        )}
      </div>
      <ButtonAnimated
        fullWidth
        size="lg"
        variant="ghost"
        onClick={() => handleInterested()}
      >
        Estoy interesado
      </ButtonAnimated>

      <div className=" flex flex-wrap justify-center items-center mt-2 rounded-xl">
        <ButtonAnimated
          fullWidth
          size="lg"
          variant="primary"
          onClick={() => {
            if (auth.user.id === party.user_id) {
              toast.info("No puedes apoyar una fiesta que tu mismo creaste");
            } else {
              setShowDonationModal(true);
            }
          }}
        >
          Apoyar al evento
        </ButtonAnimated>
        {showDonationModal && (
          <DonationModal
            partyId={party.id}
            tokenId={party.token_id}
            organizerWallet={party.organizer_wallet}
            eventName={party.name}
            eventUrl={window.location.href}
            eventWallet={party.parti_wallet}
            onClose={() => setShowDonationModal(false)}
          />
        )}
      </div>

      {party.user_id === auth.user?.id && !party.token_metadata_private_key && (
        <ButtonAnimated
          className="mt-6"
          fullWidth
          size="md"
          variant="secondary"
          onClick={() => handleAddFinanciation(party.id)}
        >
          Setup Financiation
        </ButtonAnimated>
      )}

      {party.user_id === auth.user?.id && party.token_metadata_private_key && (
        <ButtonAnimated
          className="mt-6"
          fullWidth
          size="md"
          variant="secondary"
          onClick={() => handleViewDashboard(party.id)}
        >
          Dashboard
        </ButtonAnimated>
      )}
    </Layout>
  );
};

export default PartyDetails;
