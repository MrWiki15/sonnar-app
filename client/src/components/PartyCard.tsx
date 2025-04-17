import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Music, User } from "lucide-react";
import { motion } from "framer-motion";
import { Party as PartyCardProps } from "@/types/supabase";
import { formatHbar } from "@/lib/utils";

const PartyCard = ({
  id,
  name,
  genre,
  entry_price,
  date,
  start_time,
  address,
  is_pum_pum,
  images,
  collected_amount,
  goal_amount,
  style,
}: PartyCardProps) => {
  return (
    <motion.div
      style={{ ...style }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden mb-4 border border-gray-100"
    >
      <Link to={`/fiesta/${id}`}>
        <div className="relative">
          <img
            src={images && images[0]}
            alt={name}
            className="w-full h-48 object-cover object-center"
            loading="lazy"
          />
          {is_pum_pum && (
            <div className="absolute top-3 left-3 bg-fiesta-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              Pum Pum
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-1">{name}</h3>

          <div className="flex items-center text-sm text-fiesta-muted mb-2">
            <Calendar size={14} className="mr-1 text-fiesta-primary" />
            <span className="mr-3">{date}</span>
            <Clock size={14} className="mr-1 text-fiesta-primary" />
            <span>{start_time}</span>
          </div>

          <div className="flex items-center text-sm text-fiesta-muted mb-3">
            <MapPin
              size={14}
              className="mr-1 flex-shrink-0 text-fiesta-primary"
            />
            <span className="line-clamp-1">{address}</span>
          </div>

          {genre && (
            <div className="flex items-center text-xs mb-1">
              <Music size={14} className="mr-1 text-fiesta-primary" />
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                {genre[0]}
              </span>
            </div>
          )}

          <div className="p-2 rounded-xl mt-6 mb-2">
            <h3 className="text-sm font-semibold mb-4">
              Progreso de Financiación
            </h3>

            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-fiesta-primary h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (collected_amount / (goal_amount || 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Recaudado</p>
                  <p className="text-xl font-bold text-fiesta-primary">
                    {formatHbar(collected_amount)}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-600">Objetivo</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatHbar(goal_amount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PartyCard;
