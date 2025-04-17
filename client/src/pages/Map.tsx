import Layout from "@/components/Layout";
import MapView from "@/components/MapView";
import { Search } from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { useEffect, useState, useMemo } from "react";
import { getParties, getPumPum, getVenues } from "@/integrations/mapUtils";
import PartyCard from "@/components/PartyCard";
import VenueCard from "@/components/VenueCard";

type FilterType = "all" | "parties" | "locals" | "pum_pum";

const Map = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesData, venuesData] = await Promise.all([
          getParties(),
          getVenues(),
        ]);

        setParties(partiesData);
        setVenues(venuesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Datos filtrados y memoizados
  const filteredData = useMemo(() => {
    if (isLoading) return [];

    let result = [];
    switch (filter) {
      case "parties":
        result = parties;
        break;
      case "locals":
        result = venues;
        break;

      default:
        result = [...parties, ...venues];
    }

    return result.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filter, searchQuery, parties, venues, isLoading]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold mb-2">Mapa de Fiestas</h1>
        <p className="text-fiesta-muted mb-4">
          Encuentra fiestas y locales cercanos a tu ubicación
        </p>

        <div className="relative mb-4">
          <input
            className="w-full bg-white rounded-2xl border border-gray-200 px-4 py-3 pl-10 text-sm"
            placeholder="Buscar por nombre o ubicación..."
            type="text"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fiesta-muted"
          />
        </div>

        <MapView data={filteredData} />

        <div className="flex flex-wrap gap-2 mt-4">
          <ButtonAnimated
            variant={filter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </ButtonAnimated>
          <ButtonAnimated
            variant={filter === "parties" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("parties")}
          >
            Fiestas
          </ButtonAnimated>
          <ButtonAnimated
            variant={filter === "locals" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("locals")}
          >
            Locales
          </ButtonAnimated>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Eventos cercanos</h2>

          <div className="grid  gap-4">
            {filteredData.map((item) =>
              item.interested_users ? (
                <PartyCard key={`party-${item.id}`} {...item} />
              ) : (
                <VenueCard key={`venue-${item.id}`} {...item} />
              )
            )}
          </div>

          {filteredData.length === 0 && (
            <p className="text-center text-fiesta-muted py-8">
              No se encontraron resultados
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Map;
