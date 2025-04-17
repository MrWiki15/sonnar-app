import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, Plus, MapPin, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ConnectWalletButton from "./ConnectWalletButton";

const Navbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Inicio" },
    { path: "/buscar", icon: Search, label: "Buscar" },
    { path: "/crear", icon: Plus, label: "Crear" },
    { path: "/perfil", icon: User, label: "Perfil" },
    { path: "/setting", icon: Settings, label: "Setting" },
  ];

  return (
    <>
      <header
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/90 backdrop-blur-md shadow-md" : ""
        }`}
      >
        <nav className="container-mobile py-2">
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-md px-2 py-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                    isActive
                      ? "text-fiesta-primary"
                      : "text-fiesta-muted hover:text-fiesta-primary"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-fiesta-primary/10 rounded-xl"
                      transition={{ duration: 0.3, type: "spring" }}
                    ></motion.div>
                  )}
                  <item.icon
                    size={22}
                    className={`relative z-10 ${
                      isActive ? "stroke-[2.5px]" : ""
                    }`}
                  />
                  <span className="text-[10px] mt-1 font-medium relative z-10">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm"
        style={{ backdropFilter: "blur(10px)" }}
      >
        <div className="container-mobile py-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-fiesta-primary flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 350 350"
            >
              <defs>
                <linearGradient
                  id="gradSonar"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style={{
                      stopColor: "#FFCDD2",
                      stopOpacity: 1,
                    }}
                  />
                  <stop
                    offset="100%"
                    style={{
                      stopColor: "#EF9A9A",
                      stopOpacity: 1,
                    }}
                  />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <line
                x1="125"
                y1="175"
                x2="225"
                y2="175"
                stroke="url(#gradSonar)"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1="175"
                y1="125"
                x2="175"
                y2="225"
                stroke="url(#gradSonar)"
                strokeWidth="1"
                opacity="0.3"
              />

              <circle
                cx="175"
                cy="175"
                r="6"
                fill="url(#gradSonar)"
                filter="url(#glow)"
              />

              <polygon
                points="
      175,160
      188,167.5
      188,182.5
      175,190
      162,182.5
      162,167.5
    "
                fill="none"
                stroke="url(#gradSonar)"
                strokeWidth="2"
                stroke-dasharray="4,4"
                filter="url(#glow)"
              />

              <circle
                cx="175"
                cy="175"
                r="20"
                fill="none"
                stroke="url(#gradSonar)"
                strokeWidth="3"
                opacity="0.5"
                filter="url(#glow)"
              >
                <animate
                  attributeName="r"
                  begin="0s"
                  dur="3s"
                  values="20;130"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  begin="0s"
                  dur="3s"
                  values="0.5;0"
                  repeatCount="indefinite"
                />
              </circle>

              <circle
                cx="175"
                cy="175"
                r="20"
                fill="none"
                stroke="url(#gradSonar)"
                strokeWidth="3"
                opacity="0.5"
                filter="url(#glow)"
              >
                <animate
                  attributeName="r"
                  begin="1.5s"
                  dur="3s"
                  values="20;130"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  begin="1.5s"
                  dur="3s"
                  values="0.5;0"
                  repeatCount="indefinite"
                />
              </circle>

              <circle
                cx="175"
                cy="175"
                r="60"
                fill="none"
                stroke="url(#gradSonar)"
                strokeWidth="2"
                stroke-dasharray="4,2"
                opacity="0.3"
              />
            </svg>

            <span>Sonnar</span>
          </Link>
          <div className="flex items-center space-x-2">
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
