import { ReactNode, useMemo } from "react";
import Navbar from "./Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const memoizedNavbar = useMemo(() => <Navbar />, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {memoizedNavbar}
      <main className="flex-1 pt-16 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container-mobile pb-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
