import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Key } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Recuperar = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { updatePassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    // Validar longitud mínima de la contraseña
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Actualizar la contraseña
    const result = await updatePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess("Contraseña actualizada correctamente");
      setError("");
      // Limpiar el formulario después de éxito
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(result.error || "Error al actualizar la contraseña");
      setSuccess("");
    }
  };

  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
    } else {
      setError("");
    }
  }, [newPassword, confirmPassword]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container-mobile py-4">
        <Link 
          to="/perfil" 
          className="inline-flex items-center text-fiesta-muted hover:text-fiesta-dark transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span className="text-sm">Volver al perfil</span>
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
            <Key size={28} />
          </div>
          <h1 className="text-2xl font-bold">Cambiar Contraseña</h1>
          <p className="text-fiesta-muted mt-2">Actualiza tu contraseña para mantener segura tu cuenta</p>
        </motion.div>
        
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Ingresa tu contraseña actual"
              className="input-primary"
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              className="input-primary"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu nueva contraseña"
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
            Cambiar Contraseña
          </ButtonAnimated>
        </motion.form>
      </div>
    </div>
  );
};

export default Recuperar;