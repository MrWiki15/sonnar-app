import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  Moon,
  Sun,
  Bell,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch"; // Importa el componente Switch
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Constante con los mensajes personalizados
const PERSONALIZED_MESSAGES = [
  {
    id: "1",
    text: "¡Bienvenido a la mejor plataforma de eventos!",
    image: "/public/sonar.svg",
  },
  {
    id: "2",
    text: "Encuentra los eventos más exclusivos aquí!",
    image: "https://www.murcia.com/noticias/fotos/1118226484w2.jpg",
  },
  {
    id: "3",
    text: "No te pierdas los mejores podcast",
    image:
      "https://media.licdn.com/dms/image/v2/D4E12AQGfrdOvJHGxgA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1702292417477?e=1747267200&v=beta&t=0GNhEcBaT4Zjm-hvysr0PgYdCpgtv_ocvAkrgZQnp10",
  },
  {
    id: "4",
    text: "Conéctate con otros amantes de los eventos!",
    image:
      "https://cryptoconexion.com/wp-content/uploads/2024/03/KARO-SHOW.jpg",
  },
];

// Redes sociales de la organización (solo lectura)
const ORGANIZATION_SOCIAL_MEDIA = {
  twitter: "https://twitter.com/PolarisWeb3",
};

const Settings = () => {
  const auth = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cambiar el mensaje personalizado cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prev) => (prev + 1) % PERSONALIZED_MESSAGES.length
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Guardar configuración
  const handleSaveSettings = async () => {
    try {
      await auth.setUserSettings(false, notificationsEnabled);
      toast.success("Configuración guardada con éxito");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    }
  };

  const handleNotifications = async () => {
    // 1. Solicitar permisos de notificaciones
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // 2. Registrar el Service Worker (necesitas un archivo service-worker.js)
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register(
            "/service-worker.js"
          );
          console.log("Service Worker registrado:", registration);

          // 3. Suscribir al usuario para recibir notificaciones push
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              "BEM6Oyl8BegjNHUtEtorILsOEiz3y2WJEqOmwKOlWqJTqPKKFEqf-dvb5mQ06MMjwQCm6zCjvWeiOcGrGUX-uag", // Reemplaza con tu clave VAPID
          });

          console.log("Usuario suscrito:", subscription);
          toast.success("Notificaciones activadas correctamente");

          setNotificationsEnabled(true);
        } catch (error) {
          console.error("Error registrando Service Worker:", error);
          toast.error("Error al activar notificaciones");
        }
      } else {
        toast.error("Tu navegador no soporta notificaciones push");
      }
    } else if (permission === "denied") {
      toast.error("Permiso de notificaciones denegado");
    }
  };

  const handleDarkMode = async () => {};

  return (
    <Layout>
      <div className="space-y-4 mt-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-fiesta-muted">
          Personaliza tu experiencia en la plataforma
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Notificaciones */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Bell size={18} className="mr-2 text-fiesta-primary" />
              Notificaciones
            </h2>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={async () => await handleNotifications()}
              />
              <label htmlFor="notifications" className="text-sm">
                {notificationsEnabled
                  ? "Notificaciones Activadas"
                  : "Notificaciones Desactivadas"}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="layoutmode"
                checked={darkMode}
                onCheckedChange={async () => await handleDarkMode()}
              />
              <label htmlFor="notifications" className="text-sm">
                {darkMode ? "Modo Oscuro" : "Modo Claro"}
              </label>
            </div>
          </div>

          {/* Redes Sociales de la Organización */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle size={18} className="mr-2 text-fiesta-primary" />
              Redes Sociales
            </h2>
            <div className="flex items-center space-x-3">
              <Twitter size={20} className="text-gray-600" />
              <a
                href={ORGANIZATION_SOCIAL_MEDIA.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fiesta-dark hover:text-fiesta-primary"
              >
                Twitter
              </a>
            </div>
          </div>

          {/* Mensaje Personalizado */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle size={18} className="mr-2 text-fiesta-primary" />
              Que encontraras en Sonnar ?
            </h2>
            <div className="relative h-40 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={PERSONALIZED_MESSAGES[currentMessageIndex].image}
                alt="Mensaje personalizado"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <p className="text-lg font-semibold text-center relative z-10">
                {PERSONALIZED_MESSAGES[currentMessageIndex].text}
              </p>
            </div>
          </div>

          {/* Botón de Guardar */}
          <ButtonAnimated
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSaveSettings}
          >
            Guardar Cambios
          </ButtonAnimated>
        </form>
      </div>
    </Layout>
  );
};

export default Settings;
