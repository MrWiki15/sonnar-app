import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Calendar,
  Clock,
  Image,
  Info,
  MapPin,
  Mic,
  MusicIcon,
  Users,
  Wifi,
  ParkingCircle,
  GlassWater,
  Sun,
  Snowflake,
  Shirt,
  X,
  ImageIcon,
  Search,
  Globe,
  Camera,
  Shield,
  ChartBar,
  Headset,
  PaintRoller,
  VideoIcon,
  Subtitles,
  ScreenShare,
  Network,
  PlayCircle,
} from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import ImageUploader from "@/components/ImageUploader";
import { sendNotification } from "@/api/fetch";

interface Artist {
  id: string;
  name: string;
  genre: string;
}

interface Venue {
  id: string;
  name: string;
}

const genresOptions = [
  "Pop",
  "Rock",
  "Electrónica",
  "Reggaeton",
  "Salsa",
  "Hip Hop",
  "Otro",
  "Podcast",
];

const amenitiesOptions = [
  [
    { id: "WiFi", label: "WiFi", icon: Wifi },
    { id: "Estacionamiento", label: "Estacionamiento", icon: ParkingCircle },
    { id: "Bar", label: "Bar", icon: GlassWater },
    { id: "Terraza", label: "Terraza", icon: Sun },
    { id: "Aire Acondicionado", label: "Aire Acondicionado", icon: Snowflake },
    { id: "Vestuarios", label: "Vestuarios", icon: Shirt },
    { id: "Streaming", label: "Streaming en vivo", icon: Globe },
    { id: "Catering", label: "Catering", icon: GlassWater },
    { id: "Fotógrafo", label: "Fotógrafo", icon: Camera },
    { id: "Seguridad", label: "Seguridad", icon: Shield },
  ],
  [
    { id: "Streaming", label: "Streaming", icon: Globe },
    { id: "Chat", label: "Chat en vivo", icon: ChartBar },
    { id: "SoporteTecnico", label: "Soporte", icon: Headset },
    { id: "Salas", label: "Salas virtual", icon: Users },
    { id: "Encuestas", label: "Encuestas", icon: PaintRoller },
    { id: "Grabacion", label: "Grabación", icon: VideoIcon },
    { id: "Subtitulos", label: "Subtítulos ", icon: Subtitles },
    { id: "CompartirPantalla", label: "Compartir pantalla", icon: ScreenShare },
    { id: "Networking", label: "Networking ", icon: Network },
    { id: "ContenidoOnDemand", label: "On-Demand", icon: PlayCircle },
  ],
];

const CreateParty = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPumPum, setIsPumPum] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("0");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [genre, setGenre] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [venueId, setVenueId] = useState<string>("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [image, setImage] = useState<string>("");
  const [searchArtist, setSearchArtist] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [searchVenue, setSearchVenue] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from("artists")
          .select("*")
          .order("name");

        if (error) throw error;
        setArtists(data || []);
      } catch (error) {
        console.error("Error fetching artists:", error);
        toast.error("Error al cargar los artistas");
      }
    };

    const fetchVenues = async () => {
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("id, name")
          .order("name");

        if (error) throw error;
        setVenues(data || []);
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast.error("Error al cargar los recintos");
      }
    };

    fetchArtists();
    fetchVenues();
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
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
        setImage(data.data.url);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para crear un Evento");
      return;
    }

    if (!date || !startTime || !address || !partyName || !venue) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: party, error } = await supabase
        .from("parties")
        .insert({
          user_id: user.id,
          name: partyName,
          description,
          genre,
          capacity: isPumPum ? null : Number(capacity),
          entry_price: isPumPum ? 0 : Number(price),
          date,
          start_time: startTime,
          end_time: isPumPum ? null : endTime,
          address,
          city: isOnline ? "" : city,
          postal_code: isOnline ? "" : postalCode,
          is_pum_pum: isPumPum,
          is_online: isOnline,
          images: [image],
          venue: venueId === "" ? null : venueId,
          amenities,
          artists: selectedArtists,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Evento creado con éxito!");
      await sendNotification(party.name);
      navigate("/add-financiation/" + party.id);
    } catch (error: any) {
      console.error("Error creating party:", error);
      toast.error(error.message || "Error al crear el Evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArtistSelection = (artistId: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchArtist.toLowerCase())
  );

  const filteredGenres = genresOptions.filter((g) =>
    g.toLowerCase().includes(searchGenre.toLowerCase())
  );

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(searchVenue.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-4 mt-6">
        <h1 className="text-2xl font-bold">Crear un Evento</h1>
        <p className="text-fiesta-muted">
          Completa el formulario para crear una nuevo Evento
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información Básica */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Info size={18} className="mr-2 text-fiesta-primary" />
              Información Básica
            </h2>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="pum-pum"
                checked={isPumPum}
                onCheckedChange={(checked) => setIsPumPum(checked === true)}
              />
              <label htmlFor="pum-pum" className="text-sm">
                Evento "Pum Pum" (evento sin costo, para todos)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-fiesta-dark mb-1">
                Nombre del evento*
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fiesta-primary/50"
                placeholder="Ej. Evento de Verano 2025"
                required
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fiesta-dark mb-1">
                Lugar/Recinto*
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                  placeholder={venue ? venue : "Buscar recinto..."}
                  value={searchVenue}
                  onChange={(e) => setSearchVenue(e.target.value)}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
              {filteredVenues.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-slate-100">
                  {filteredVenues.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 hover:bg-gray-50 cursor-pointer"
                      style={{
                        backgroundColor:
                          v.id === venueId ? "rgba(0,0,0,0.2)" : "",
                      }}
                      onClick={() => {
                        setVenueId(v.id); // Guardar el ID del venue
                        setVenue(v.name); // Guardar el nombre del venue
                      }}
                    >
                      {v.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-fiesta-dark mb-1">
                Descripción
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fiesta-primary/50 min-h-[100px]"
                placeholder="Describe tu evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {!isPumPum && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-fiesta-dark mb-1">
                    Capacidad Máxima
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                      placeholder="100"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                    <Users
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-fiesta-dark mb-1">
                    Precio de Entrada
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                      placeholder="0"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <MapPin size={18} className="mr-2 text-fiesta-primary" />
              Ubicación
            </h2>

            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="online"
                checked={isOnline}
                onCheckedChange={(checked) => setIsOnline(checked)}
              />
              <label htmlFor="online" className="text-sm">
                Evento Online
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-fiesta-dark mb-1">
                {isOnline ? "Red Social/Enlace*" : "Dirección*"}
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                placeholder={
                  isOnline ? "Ej. https://zoom.us/..." : "Calle y número"
                }
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {!isOnline && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-fiesta-dark mb-1">
                    Ciudad*
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                    placeholder="Ej. La Habana"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fiesta-dark mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                    placeholder="10400"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar size={18} className="mr-2 text-fiesta-primary" />
              Fecha y Hora
            </h2>

            <div>
              <label className="block text-sm font-medium text-fiesta-dark mb-1">
                Fecha*
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className={isPumPum ? "" : "grid grid-cols-2 gap-3"}>
              <div>
                <label className="block text-sm font-medium text-fiesta-dark mb-1">
                  Hora de Inicio*
                </label>
                <div className="relative">
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <Clock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
              {!isPumPum && (
                <div>
                  <label className="block text-sm font-medium text-fiesta-dark mb-1">
                    Hora de Fin
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Género Musical */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <MusicIcon size={18} className="mr-2 text-fiesta-primary" />
              {isOnline ? "Tipo" : "Género"}
            </h2>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                placeholder="Buscar género..."
                value={searchGenre}
                onChange={(e) => setSearchGenre(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredGenres.map((g) => (
                <div key={g} className="flex items-center space-x-2">
                  <Checkbox
                    id={g}
                    checked={genre.includes(g)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setGenre([...genre, g]);
                      } else {
                        setGenre(genre.filter((item) => item !== g));
                      }
                    }}
                  />
                  <label htmlFor={g} className="text-sm">
                    {g}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Comodidades */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Wifi size={18} className="mr-2 text-fiesta-primary" />
              {isOnline ? "Comodidades" : "Acceso"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {isOnline
                ? amenitiesOptions[1].map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={amenity.id}
                        checked={amenities.includes(amenity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAmenities([...amenities, amenity.id]);
                          } else {
                            setAmenities(
                              amenities.filter((item) => item !== amenity.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={amenity.id}
                        className="text-sm flex items-center gap-2"
                      >
                        <amenity.icon size={16} className="text-gray-600" />
                        {amenity.label}
                      </label>
                    </div>
                  ))
                : amenitiesOptions[0].map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={amenity.id}
                        checked={amenities.includes(amenity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAmenities([...amenities, amenity.id]);
                          } else {
                            setAmenities(
                              amenities.filter((item) => item !== amenity.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={amenity.id}
                        className="text-sm flex items-center gap-2"
                      >
                        <amenity.icon size={16} className="text-gray-600" />
                        {amenity.label}
                      </label>
                    </div>
                  ))}
            </div>
          </div>

          {/* Artistas invitados */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Mic size={18} className="mr-2 text-fiesta-primary" />
              Artistas Invitados
            </h2>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm pl-9"
                placeholder="Buscar artista..."
                value={searchArtist}
                onChange={(e) => setSearchArtist(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>
            <div className="flex flex-wrap flex-col gap-4 h-[150px] overflow-auto">
              {filteredArtists.map((artist) => (
                <div key={artist.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={artist.id}
                    checked={selectedArtists.includes(artist.id)}
                    onCheckedChange={(checked) =>
                      toggleArtistSelection(artist.id)
                    }
                  />
                  <label htmlFor={artist.id} className="text-sm">
                    {artist.name} ({artist.genre})
                  </label>
                </div>
              ))}
            </div>
            {selectedArtists.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-fiesta-primary mb-2">
                  Artistas Seleccionados:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedArtists.map((artistId) => {
                    const artist = artists.find((a) => a.id === artistId);
                    return (
                      artist && (
                        <div
                          key={artist.id}
                          className="flex items-center bg-gray-200 px-3 py-1 rounded-lg text-sm"
                        >
                          {artist.name}
                          <button
                            type="button"
                            className="ml-2 text-red-500 hover:text-red-700"
                            onClick={() => toggleArtistSelection(artist.id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <ImageIcon size={18} className="mr-2 text-fiesta-primary" />
              Imagen Principal
            </h2>

            <ImageUploader
              onFileUpload={handleImageUpload}
              isLoading={uploadingImage}
              imageUrl={image}
            />

            {image && (
              <div className="mt-4 text-center text-sm text-fiesta-muted">
                <p>Imagen seleccionada:</p>
                <div className="relative inline-block mt-2">
                  <img
                    src={image}
                    alt="Preview"
                    className="max-h-40 rounded-lg border"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    onClick={() => setImage("")}
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ButtonAnimated
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
          >
            Crear Evento
          </ButtonAnimated>
        </form>
      </div>
    </Layout>
  );
};

export default CreateParty;
