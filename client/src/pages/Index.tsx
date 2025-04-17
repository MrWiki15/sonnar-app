import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { Calendar, MapPin, Music, Users, Star, Ticket } from "lucide-react";
import { toast } from "sonner";
import PartyCard from "@/components/PartyCard";
import { Link } from "react-router-dom";
import "./css/index.css";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [featuredParties, setFeaturedParties] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from("parties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) throw error;
        setFeaturedParties(data);
      } catch (error) {
        toast.error("Error cargando eventos destacados");
      }
    };

    loadData();
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div
          className="bg-fiesta-primary/10 rounded-2xl p-8 text-center"
          style={{ marginTop: "1rem" }}
        >
          <h1 className="text-4xl font-bold mb-4">
            Encuentra los mejores eventos de la Web3
          </h1>
          <p className="text-lg text-fiesta-muted mb-6">
            Descubre eventos increíbles, financia tus propias fiestas y vive la
            experiencia nocturna
          </p>
          <div className="flex justify-center gap-4">
            <Link to={"/mapa"}>
              <ButtonAnimated variant="primary" size="lg">
                Explora Eventos
              </ButtonAnimated>
            </Link>

            <Link to={"/crear"}>
              <ButtonAnimated variant="outline" size="lg">
                Crear Evento
              </ButtonAnimated>
            </Link>
          </div>
        </div>

        {/* Características */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Music className="text-fiesta-primary mb-2" size={24} />
            <h3 className="text-lg font-semibold mb-2">Variedad de Estilos</h3>
            <p className="text-fiesta-muted text-sm">
              Desde charlas, podcast y entrevistas increibles
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Ticket className="text-fiesta-primary mb-2" size={24} />
            <h3 className="text-lg font-semibold mb-2">Comunidad activa</h3>
            <p className="text-fiesta-muted text-sm">
              Accede a la comunidad mas activa de la Web3
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Ticket className="text-fiesta-primary mb-2" size={24} />
            <h3 className="text-lg font-semibold mb-2">Financiacion Segura</h3>
            <p className="text-fiesta-muted text-sm">
              Utiliza la tecnologia NFT para financiar tu evento
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Ticket className="text-fiesta-primary mb-2" size={24} />
            <h3 className="text-lg font-semibold mb-2">Soporte 24 horas</h3>
            <p className="text-fiesta-muted text-sm">
              Obten ayuda para gestionar tus eventos 24/7
            </p>
          </div>
        </div>

        <div>
          <div
            className="index"
            style={{
              display: "flex",
              overflow: "auto",
              gap: "1rem",
              marginBottom: "-1rem",
            }}
          >
            {featuredParties?.map((f) => (
              <div>
                <PartyCard
                  style={{ width: "20rem" }}
                  id={f.id}
                  name={f.title}
                  date={f.date}
                  images={f.images}
                  goal_amount={f.goal_amount}
                  collected_amount={f.collected_amount}
                  start_time={f.date}
                  address={f.address}
                  genre={f.genre}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Cómo Funciona */}
        <div className="bg-fiesta-primary/5 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            ¿Cómo funciona Sonnar?
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-fiesta-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-fiesta-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Explora</h3>
              <p className="text-sm text-fiesta-muted">
                Encuentra eventos cercanos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-fiesta-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-fiesta-primary font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Crea</h3>
              <p className="text-sm text-fiesta-muted">
                Crea tus propios eventos
              </p>
            </div>

            <div className="text-center">
              <div className="bg-fiesta-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-fiesta-primary font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Gana</h3>
              <p className="text-sm text-fiesta-muted">
                Financia tu evento con FT
              </p>
            </div>

            <div className="text-center">
              <div className="bg-fiesta-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-fiesta-primary font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Comparte</h3>
              <p className="text-sm text-fiesta-muted">Comparte tus eventos</p>
            </div>
            {/* Pasos 2-4 similares */}
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-fiesta-primary/10 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            ¿Listo para vivir la mejor experiencia?
          </h2>
          <p className="text-fiesta-muted mb-6">
            Únete a nuestra comunidad de más de 50,000 fiesteros
          </p>
          <Link to={"/crear"}>
            <ButtonAnimated variant="primary" size="lg">
              Empieza Ahora
            </ButtonAnimated>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
