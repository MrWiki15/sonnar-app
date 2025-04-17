import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import {
  Calendar,
  Camera,
  Edit,
  FileCheck,
  FileX,
  Instagram,
  LogOut,
  MapPin,
  Mic,
  Music,
  Plus,
  Settings,
  Store,
  Trash,
  User,
  UserCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PartyCard from "@/components/PartyCard";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileCompletionForm from "@/components/ProfileCompletionForm";
import VenueVerificationForm from "@/components/VenueVerificationForm";
import AdminLink from "@/components/AdminLink";
import {
  getUserProfile,
  toggleArtistStatus,
  getPartiesForUser,
  getArtistProfile,
} from "@/integrations/supabase/profileUtils";
import { getUserVenues } from "@/integrations/supabase/adminUtils";
import {
  Profile as ProfileType,
  Party as PartyType,
  Venue,
} from "@/types/supabase";
import ArtistProfileForm from "@/components/ArtistProfileForm";

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"fiestas" | "locales" | "artista">(
    "fiestas"
  );
  const { user, signOut } = useAuth();
  const [isArtist, setIsArtist] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [profileData, setProfileData] = useState<ProfileType | null>(null);
  const [partysData, setPartysData] = useState<PartyType[] | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(
    null
  );
  const [showArtistForm, setShowArtistForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPartys();
      fetchVenues();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const data = await getUserProfile(user.id);
      console.log(data);
      const partysByUser = await getPartiesForUser(user.id);
      try {
        const artistDataprofile = await getArtistProfile(user.id);
        setArtistProfile(artistDataprofile);
      } catch (e) {
        console.log(e);
      }

      setProfileData(data);
      setPartysData(partysByUser);
      setIsArtist(Boolean(data?.is_artist));
      setIsProfileCompleted(Boolean(data?.is_profile_completed));

      // If profile isn't completed, show the completion form
      if (!data?.is_profile_completed) {
        setShowProfileForm(true);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartys = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const partysByUser = await getPartiesForUser(user.id);
      setPartysData(partysByUser);
      console.log(partysByUser);
    } catch (error: any) {
      console.error("Error fetching partys:", error);
      toast.error("Error al cargar las fiestas");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      if (!user?.id) return;
      const data = await getUserVenues(user.id);
      setVenues(data);
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      toast.error("Error al cargar los locales");
    }
  };

  const handleArtistSave = async (data: ArtistData) => {
    try {
      await toggleArtistStatus(user.id, true, data);
      setIsArtist(true);
      setShowArtistForm(false);
      toast.success("Perfil de artista actualizado");
      fetchProfile();
    } catch (error) {
      toast.error("Error guardando perfil");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
        </div>
      </Layout>
    );
  }

  if (showProfileForm) {
    return (
      <Layout>
        <ProfileCompletionForm
          initialData={profileData}
          onComplete={() => {
            setShowProfileForm(false);
            setIsProfileCompleted(true);
            fetchProfile();
          }}
        />
      </Layout>
    );
  }

  if (showVenueForm) {
    return (
      <Layout>
        <VenueVerificationForm
          onComplete={() => {
            setShowVenueForm(false);
            fetchVenues();
            toast.success("Solicitud enviada para verificación");
          }}
          onCancel={() => setShowVenueForm(false)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mt-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 relative border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="mr-4 relative">
              {profileData?.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                  <User size={24} className="text-gray-400" />
                </div>
              )}
              {isProfileCompleted && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <UserCheck size={12} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {profileData?.full_name ||
                  user?.user_metadata?.name ||
                  "Usuario"}
              </h1>
              {profileData?.address && (
                <div className="flex items-center text-sm text-fiesta-muted">
                  <MapPin size={14} className="mr-1" />
                  <span>
                    {profileData.province}, {profileData.address}
                  </span>
                </div>
              )}
              <div className="flex items-center text-xs text-fiesta-muted mt-1">
                <Calendar size={12} className="mr-1" />
                <span>
                  Miembro desde{" "}
                  {new Date(user?.created_at || Date.now()).toLocaleDateString(
                    "es-ES",
                    { month: "long", year: "numeric" }
                  )}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-fiesta-muted mb-4">
            {profileData?.description || "Sin descripción"}
          </p>

          <div className="flex justify-between">
            <ButtonAnimated
              variant="outline"
              size="sm"
              className="flex-1 mr-2"
              onClick={() => setShowProfileForm(true)}
            >
              <Edit size={14} className="mr-1" />
              Editar Perfil
            </ButtonAnimated>
            <ButtonAnimated
              variant="ghost"
              size="sm"
              className="text-fiesta-muted"
              onClick={() => signOut()}
            >
              <LogOut size={14} className="mr-1" />
              Salir
            </ButtonAnimated>
          </div>
        </div>

        <AdminLink />

        <div className="mb-6">
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("fiestas")}
              className={`flex items-center justify-center py-3 px-4 font-medium text-sm relative whitespace-nowrap ${
                activeTab === "fiestas"
                  ? "text-fiesta-primary"
                  : "text-fiesta-muted"
              }`}
            >
              <User size={16} className="mr-2" />
              Mis Fiestas
              {activeTab === "fiestas" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-fiesta-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("locales")}
              className={`flex items-center justify-center py-3 px-4 font-medium text-sm relative whitespace-nowrap ${
                activeTab === "locales"
                  ? "text-fiesta-primary"
                  : "text-fiesta-muted"
              }`}
            >
              <Store size={16} className="mr-2" />
              Mis Locales
              {activeTab === "locales" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-fiesta-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("artista")}
              className={`flex items-center justify-center py-3 px-4 font-medium text-sm relative whitespace-nowrap ${
                activeTab === "artista"
                  ? "text-fiesta-primary"
                  : "text-fiesta-muted"
              }`}
            >
              <Mic size={16} className="mr-2" />
              Perfil de Artista
              {activeTab === "artista" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-fiesta-primary"
                />
              )}
            </button>
          </div>

          {activeTab === "fiestas" && (
            <>
              <div className="mb-4">
                <Link to="/crear">
                  <div className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl text-fiesta-muted hover:text-fiesta-primary hover:border-fiesta-primary/30 transition-all">
                    <Plus size={18} className="mr-2" />
                    <span className="font-medium">Crear nueva fiesta</span>
                  </div>
                </Link>
              </div>

              {partysData?.length > 0 ? (
                partysData.map((party) => (
                  <PartyCard key={party.id} {...party} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-fiesta-muted">
                    No has creado ninguna fiesta aún
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "locales" && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => navigate("/nuevo-local")}
                  className="w-full"
                >
                  <div className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl text-fiesta-muted hover:text-fiesta-primary hover:border-fiesta-primary/30 transition-all">
                    <Plus size={18} className="mr-2" />
                    <span className="font-medium">
                      Solicitar verificación de local
                    </span>
                  </div>
                </button>
              </div>

              {venues.length > 0 ? (
                venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100 flex"
                  >
                    <div className="w-24 h-24">
                      {venue.venue_photo_url ? (
                        <img
                          src={venue.venue_photo_url}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Store size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3">
                      <h3 className="font-bold text-base mb-1">{venue.name}</h3>
                      <div className="flex items-center text-xs text-fiesta-muted mb-2">
                        <MapPin size={12} className="mr-1" />
                        <span className="line-clamp-1">{venue.address}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            venue.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : venue.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {venue.status === "approved" ? (
                            <div className="flex items-center">
                              <FileCheck size={12} className="mr-1" />
                              Verificado
                            </div>
                          ) : venue.status === "rejected" ? (
                            <div className="flex items-center">
                              <FileX size={12} className="mr-1" />
                              Rechazado
                            </div>
                          ) : (
                            "En verificación"
                          )}
                        </span>
                        {venue.status === "approved" && (
                          <span
                            className="text-xs text-fiesta-primary"
                            onClick={() => navigate(`/local/${venue.id}`)}
                          >
                            Ver detalles →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-fiesta-muted">
                    No has añadido ningún local aún
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "artista" && (
            <>
              {showArtistForm ? (
                <ArtistProfileForm
                  initialData={profileData}
                  onSave={handleArtistSave}
                  onCancel={() => {
                    setShowArtistForm(false);
                    setIsArtist(false);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {isArtist && artistProfile && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4 flex-wrap">
                        <h3 className="font-medium w-full">
                          Tu Perfil de Artista
                        </h3>

                        <div>
                          {artistProfile?.genre && (
                            <div className="mb-3 flex items-center">
                              <Label>Género principal:</Label>
                              <p
                                className="text-sm p-2 rounded-xs bg-red-300"
                                style={{
                                  color: "#000",
                                  borderRadius: "0.5rem",
                                  margin: ".5rem",
                                }}
                              >
                                {artistProfile.genre}
                              </p>
                            </div>
                          )}

                          {artistProfile?.bio && (
                            <div className="mb-12">
                              <Label>Biografía:</Label>
                              <p
                                className="text-sm whitespace-pre-line"
                                dangerouslySetInnerHTML={{
                                  __html: artistProfile.bio,
                                }}
                              />
                            </div>
                          )}

                          {(artistProfile?.socials?.instagram ||
                            artistProfile?.socials?.spotify) && (
                            <div className="mb-3">
                              <Label>Redes sociales:</Label>
                              <div className="flex gap-2 mt-1">
                                {artistProfile.socials?.instagram && (
                                  <a
                                    href={`https://instagram.com/${artistProfile.socials.instagram}`}
                                    target="_blank"
                                    className="text-sm text-fiesta-primary flex items-center"
                                  >
                                    <Instagram size={16} className="mr-1" />
                                    {artistProfile.socials.instagram}
                                  </a>
                                )}
                                {artistProfile.socials?.spotify && (
                                  <a
                                    href={artistProfile.socials.spotify}
                                    target="_blank"
                                    className="text-sm text-fiesta-primary flex items-center"
                                  >
                                    <Music size={16} className="mr-1" />
                                    Spotify
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-evenly w-full gap-2 mt-4">
                          <ButtonAnimated
                            fullWidth
                            variant="ghost"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "¿Estás seguro de eliminar tu perfil de artista?"
                                )
                              ) {
                                try {
                                  await toggleArtistStatus(user.id, false);
                                  setIsArtist(false);
                                  await fetchProfile();
                                  toast.success(
                                    "Perfil de artista eliminado permanentemente"
                                  );
                                } catch (error) {
                                  toast.error(
                                    "Error eliminando el perfil de artista"
                                  );
                                }
                              }
                            }}
                          >
                            <Trash size={14} className="mr-1" />
                            Eliminar Perfil
                          </ButtonAnimated>

                          <ButtonAnimated
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() =>
                              navigate(`/artista/${artistProfile.id}`)
                            }
                          >
                            Ver pagina de artista
                          </ButtonAnimated>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isArtist ? (
                    <ButtonAnimated
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowArtistForm(true);
                        setIsArtist(true);
                      }}
                    >
                      <Plus size={14} className="mr-1" />
                      Configurar Perfil de Artista
                    </ButtonAnimated>
                  ) : (
                    !showArtistForm && (
                      <div className="text-center mt-4">
                        <p className="text-sm text-fiesta-muted">
                          ¿Necesitas actualizar tu información de artista?
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
