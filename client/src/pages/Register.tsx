
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUp, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // En una implementación real, mostrarías un toast o error
      console.error("Las contraseñas no coinciden");
      return;
    }
    
    await signUp(email, password, name);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container-mobile py-4">
        <Link 
          to="/login" 
          className="inline-flex items-center text-fiesta-muted hover:text-fiesta-dark transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span className="text-sm">Volver</span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center container-mobile pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center bg-fiesta-primary text-white rounded-xl w-16 h-16 mb-4 shadow-lg mx-auto">
            <UserPlus size={28} />
          </div>
          <h1 className="text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-fiesta-muted mt-2">Únete y comienza a promocionar tus fiestas</p>
        </motion.div>
        
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
              className="input-primary"
            />
          </div>
          
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
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Crea una contraseña segura"
              className="input-primary"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              className="input-primary"
            />
          </div>
          
          <div className="pt-2">
            <ButtonAnimated
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Crear Cuenta
            </ButtonAnimated>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-fiesta-muted text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-fiesta-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default Register;
