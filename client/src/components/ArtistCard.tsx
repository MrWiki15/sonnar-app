import { User, Music, Link } from "lucide-react";
import { Artist } from "@/types/supabase";

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 bg-fiesta-primary text-white rounded-full p-1">
            <Music className="h-4 w-4" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg">{artist?.name}</h3>
          <p className="text-sm text-fiesta-secondary">{artist?.genre}</p>

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{artist?.followers?.toLocaleString() || 0} seguidores</span>
          </div>

          {artist?.socials && artist?.socials.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-gray-600">
                Redes sociales:
              </p>
              <div className="flex flex-wrap gap-2">
                {artist?.socials[0].map((social, index) => (
                  <a
                    key={index}
                    href={social}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-fiesta-primary hover:text-fiesta-secondary text-sm"
                  >
                    <Link className="h-4 w-4 mr-1" />
                    {new URL(social)?.hostname?.replace("www.", "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {artist?.bio && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
              {artist?.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
