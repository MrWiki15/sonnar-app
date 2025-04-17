
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck } from "lucide-react";

const AdminLink = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkIsAdmin();
    }
  }, [user]);

  const checkIsAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  if (!isAdmin) return null;

  return (
    <Link to="/admin">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center text-yellow-800">
        <ShieldCheck size={20} className="mr-2 text-yellow-600" />
        <div>
          <p className="font-medium text-sm">Panel de Administración</p>
          <p className="text-xs text-yellow-700">Gestiona usuarios, locales y estadísticas</p>
        </div>
        <span className="ml-auto text-xs">→</span>
      </div>
    </Link>
  );
};

export default AdminLink;
