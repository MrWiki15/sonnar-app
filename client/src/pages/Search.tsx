import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PartyCard from "@/components/PartyCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Party } from "@/types/supabase";
import { motion, AnimatePresence } from "framer-motion";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);

  // Se obtienen las fiestas desde Supabase
  useEffect(() => {
    const fetchParties = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("parties").select("*");
        if (error) {
          toast.error("Error cargando datos");
        } else {
          setParties(data as Party[]);
          setFilteredParties(data as Party[]);
        }
      } catch (err) {
        toast.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, []);

  // Filtra las fiestas por nombre o descripción según el query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredParties(parties);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = parties.filter((party) => {
      return (
        (party.name && party.name.toLowerCase().includes(lowerQuery)) ||
        (party.description &&
          party.description.toLowerCase().includes(lowerQuery))
      );
    });
    setFilteredParties(filtered);
  }, [searchQuery, parties]);

  return (
    <Layout>
      <div className="mt-4 mr-[-15px] ml-[-15px]">
        {/* Input de búsqueda */}
        <div className="mb-4 px-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar fiestas por nombre o descripción..."
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Listado de fiestas con animaciones */}
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4 px-4"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-64 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-4 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredParties.map((party, index) => (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PartyCard {...party} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Search;
