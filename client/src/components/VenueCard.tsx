import { MapPin, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Venue as VenueProps } from "@/types/supabase";

const VenueCard = ({
  id,
  name,
  address,
  description,
  venue_photo_url,
}: VenueProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow mb-4"
    >
      <Link to={`/local/${id}`} className="block">
        <div className="flex gap-4 p-4">
          <div className="w-32 h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {venue_photo_url && (
              <img
                src={venue_photo_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold truncate">{name}</h3>
            </div>

            <p className="mt-2 text-sm text-gray-600 line-clamp-3">
              {description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VenueCard;
