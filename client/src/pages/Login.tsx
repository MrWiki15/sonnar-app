import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container-mobile py-4">
        <Link
          to="/"
          className="inline-flex items-center text-fiesta-muted hover:text-fiesta-dark transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span className="text-sm">Volver</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center container-mobile">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center bg-fiesta-primary text-white rounded-xl w-16 h-16 mb-4 shadow-lg mx-auto">
            <LogIn size={28} />
          </div>
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-fiesta-muted mt-2">
            Accede a tu cuenta para crear y gestionar fiestas
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
              className="input-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <Link
                to="/recuperar"
                className="text-xs text-fiesta-primary hover:underline"
              >
                ¿Deseas cambiar tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña"
              className="input-primary"
            />
          </div>

          <ButtonAnimated
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="mt-6"
          >
            Iniciar Sesión
          </ButtonAnimated>

          <div className="text-center mt-6">
            <p className="text-fiesta-muted text-sm">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/registro"
                className="text-fiesta-primary font-medium hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
