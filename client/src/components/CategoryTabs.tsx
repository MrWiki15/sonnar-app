import { useState } from "react";
import { Music, Martini, Beer, PartyPopper, Users } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { id: "todas", label: "Todas", icon: PartyPopper },
  { id: "musica", label: "Música", icon: Music },
  { id: "cocteles", label: "Cócteles", icon: Martini },
  { id: "cerveza", label: "Cerveza", icon: Beer },
  { id: "social", label: "Social", icon: Users },
];

interface CategoryTabsProps {
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = ({ onSelectCategory }: CategoryTabsProps) => {
  const [activeCategory, setActiveCategory] = useState("todas");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onSelectCategory(categoryId);
  };

  return (
    <div className="mb-4" style={{ marginTop: "-1rem" }}>
      <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const Icon = category.icon;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-2 rounded-xl transition-all relative ${
                isActive ? "text-fiesta-primary" : "text-fiesta-muted"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="category-background"
                  className="absolute inset-0 bg-fiesta-primary/10 rounded-xl"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <div
                className={`relative z-10 p-2 rounded-full ${
                  isActive ? "bg-white shadow-sm" : ""
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-xs mt-1 font-medium relative z-10">
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
