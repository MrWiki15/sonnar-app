import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { ButtonAnimated } from "./ui/button-animated";
import tt from "@tomtom-international/web-sdk-maps";

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowLocation, setAllowLocation] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [userPosition, setUserPosition] = useState<[number, number]>([
    -82.3666, 23.1136,
  ]);

  const TOMTOM_KEY = "GWGkrcQi2YXiNwGDLDkbBSxhJJu6VPfj";

  useEffect(() => {
    if (mapRef.current && !mapInstance) {
      const map = tt.map({
        key: TOMTOM_KEY,
        container: mapRef.current,
        center: userPosition,
        zoom: 11,
        dragPan: true,
        doubleClickZoom: true,
      });

      map.addControl(new tt.NavigationControl());
      setMapInstance(map);
      setIsLoading(false);

      return () => map.remove();
    }
  }, [mapRef]);

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAllowLocation(true);
          const newPos: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserPosition(newPos);
          mapInstance?.flyTo({ center: newPos, zoom: 14 });
        },
        (error) => console.error("Error obteniendo ubicación:", error)
      );
    }
  };

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setUserPosition(newPos);
          mapInstance?.flyTo({ center: newPos, zoom: 14 });
        },
        (error) => console.error("Error actualizando ubicación:", error)
      );
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-md relative h-[300px]">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <span className="text-fiesta-muted">Cargando mapa...</span>
        </div>
      )}

      <div ref={mapRef} className="h-full w-full rounded-2xl">
        {!allowLocation && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
            <MapPin size={30} className="text-white mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">
              Encuentra fiestas cercanas
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Permite acceso a tu ubicación para ver eventos cerca de ti
            </p>
            <ButtonAnimated onClick={handleLocationRequest} size="md">
              Permitir ubicación
            </ButtonAnimated>
          </div>
        )}
      </div>

      {allowLocation && (
        <div className="absolute bottom-3 right-3 z-10">
          <ButtonAnimated
            variant="primary"
            size="sm"
            className="shadow-lg"
            onClick={handleUpdateLocation}
          >
            <MapPin size={16} className="mr-1" />
            Mi ubicación
          </ButtonAnimated>
        </div>
      )}

      <div className="absolute bottom-1 left-1 text-[8px] text-gray-600">
        © TomTom
      </div>
    </div>
  );
};

export default MapView;
