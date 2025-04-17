
import { User, Music, Calendar, MapPin, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

export interface ArtistProfileProps {
  id: string;
  name: string;
  image: string;
  genres: string[];
  location: string;
  socials?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
  };
  upcomingEvents?: number;
}

const ArtistProfile = ({ 
  id,
  name,
  image,
  genres,
  location,
  socials,
  upcomingEvents = 0
}: ArtistProfileProps) => {
  return (
    <Link to={`/artista/${id}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-gray-100 flex">
        <div className="w-24 h-24">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-center mb-1">
            <h3 className="font-bold text-base">{name}</h3>
            {socials?.instagram && (
              <LinkIcon size={14} className="ml-2 text-fiesta-primary" />
            )}
          </div>
          
          <div className="flex items-center text-xs text-fiesta-muted mb-2">
            <MapPin size={12} className="mr-1" />
            <span className="line-clamp-1">{location}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {genres.map((genre, index) => (
              <span 
                key={index} 
                className="text-xs bg-gray-100 px-2 py-0.5 rounded-full flex items-center"
              >
                <Music size={10} className="mr-1 text-fiesta-primary" />
                {genre}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            {upcomingEvents > 0 && (
              <span className="text-xs flex items-center">
                <Calendar size={12} className="mr-1 text-fiesta-primary" />
                {upcomingEvents} próximos eventos
              </span>
            )}
            <span className="text-xs text-fiesta-primary">Ver perfil →</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArtistProfile;
