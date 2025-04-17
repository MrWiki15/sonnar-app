import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showTypeSelector?: boolean;
  searchType?: "all" | "parties" | "venues";
  onTypeChange?: (type: "all" | "parties" | "venues") => void;
}

const SearchBar = ({
  onSearch,
  placeholder = "Busca...",
  showTypeSelector = false,
  searchType = "all",
  onTypeChange,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      onSearch(query.trim());
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative mb-6">
      <div className="relative">
        <div
          className={`relative flex items-center bg-white rounded-xl transition-all duration-300 ${
            isFocused ? "shadow-md ring-2 ring-fiesta-primary/20" : "shadow-sm"
          }`}
        >
          <Search
            size={18}
            className={`absolute left-4 transition-colors ${
              isFocused ? "text-fiesta-primary" : "text-fiesta-muted"
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none bg-transparent text-sm"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={handleClear}
                className="absolute right-3 text-fiesta-muted"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {showTypeSelector && (
          <div className="flex gap-2 mt-3">
            {["all", "parties", "venues"].map((type) => (
              <button
                key={type}
                onClick={() => onTypeChange?.(type as any)}
                className={`px-3 py-1 rounded-full text-sm ${
                  searchType === type
                    ? "bg-fiesta-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {
                  {
                    all: "Todo",
                    parties: "Fiestas",
                    venues: "Locales",
                  }[type]
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
