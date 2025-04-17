import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  CheckCircle,
  Edit,
  FileX,
  Info,
  PieChart,
  Shield,
  Store,
  Trash,
  User,
  PartyPopper,
  Users,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  MusicIcon,
  Wifi,
  Trash2,
  Edit3,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import VenueDetails from "@/components/admin/VenueDetails";
import UserDetails from "@/components/admin/UserDetails";
import {
  getVenueStats,
  getVenuesWithProfiles,
  updateVenueStatus,
  deleteVenue,
} from "@/integrations/supabase/adminUtils";
import PartyDetails from "@/components/admin/PartyDetails";

type DashboardStats = {
  totalUsers: number;
  totalVenues: number;
  approvedVenues: number;
  pendingVenues: number;
  totalParties: number;
};

export interface PartyDetailsProps {
  party: any;
  onBack: () => void;
  onEdit: (partyId: string) => void;
  onDelete: (partyId: string) => void;
}

type AdminTab = "dashboard" | "users" | "venues" | "partys";

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVenues: 0,
    approvedVenues: 0,
    pendingVenues: 0,
    totalParties: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [partys, setPartys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "venues") {
      fetchVenues();
    } else if (activeTab === "partys") {
      fetchPartys();
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get count of users
      const { count: userCount, error: userError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (userError) throw userError;

      // Get venue stats
      const venueStats = await getVenueStats();

      // Get count of parties
      const { count: partyCount, error: partyError } = await supabase
        .from("parties")
        .select("*", { count: "exact", head: true });

      if (partyError) throw partyError;

      setStats({
        totalUsers: userCount || 0,
        totalVenues: venueStats.totalVenues,
        approvedVenues: venueStats.approvedVenues,
        pendingVenues: venueStats.pendingVenues,
        totalParties: partyCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPartys(data);
    } catch (e) {
      console.error("Error fetching partys:", e);
      toast.error("Error al cargar las fiestas");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const data = await getVenuesWithProfiles();
      setVenues(data);
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("Error al cargar locales");
    } finally {
      setLoading(false);
    }
  };

  const approveVenue = async (venueId: string) => {
    try {
      await updateVenueStatus(venueId, "approved");
      toast.success("Local aprobado con éxito");
      fetchVenues();
      fetchStats();
      setSelectedVenue(null);
    } catch (error) {
      console.error("Error approving venue:", error);
      toast.error("Error al aprobar el local");
    }
  };

  const rejectVenue = async (venueId: string) => {
    try {
      await updateVenueStatus(venueId, "rejected");
      toast.success("Local rechazado");
      fetchVenues();
      fetchStats();
      setSelectedVenue(null);
    } catch (error) {
      console.error("Error rejecting venue:", error);
      toast.error("Error al rechazar el local");
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm("¿Estás seguro que deseas eliminar este local?")) return;

    try {
      await deleteVenue(venueId);
      toast.success("Local eliminado con éxito");
      fetchVenues();
      fetchStats();
      setSelectedVenue(null);
    } catch (error) {
      console.error("Error deleting venue:", error);
      toast.error("Error al eliminar el local");
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast.success("Usuario eliminado con éxito");
      fetchUsers();
      fetchPartys();
      fetchStats();
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar el usuario");
    }
  };

  // Agrega esta función para eliminar fiestas:
  const handleDeleteParty = async (partyId: string) => {
    if (!confirm("¿Estás seguro que deseas eliminar esta fiesta?")) return;

    try {
      const { error } = await supabase
        .from("parties")
        .delete()
        .eq("id", partyId);

      if (error) throw error;

      toast.success("Fiesta eliminada con éxito");
      fetchPartys();
      fetchStats();
      setSelectedParty(null);
    } catch (error) {
      console.error("Error deleting party:", error);
      toast.error("Error al eliminar la fiesta");
    }
  };

  if (selectedUser) {
    return (
      <UserDetails
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onDelete={deleteUser}
      />
    );
  }

  if (selectedVenue) {
    return (
      <VenueDetails
        venue={selectedVenue}
        onBack={() => setSelectedVenue(null)}
        onApprove={approveVenue}
        onReject={rejectVenue}
        onDelete={handleDeleteVenue}
      />
    );
  }

  // Agrega esta condición antes del return principal:
  if (selectedParty) {
    return (
      <PartyDetails
        party={selectedParty}
        onBack={() => setSelectedParty(null)}
        onEdit={(partyId) => navigate(`/edit-party/${partyId}`)}
        onDelete={handleDeleteParty}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-fiesta-primary text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Panel de Administración</h1>
          </div>
          <div className="flex items-center">
            <Shield size={20} className="mr-2" />
            <span className="font-medium">Admin</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-12 gap-6 py-6">
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="mb-6">
              <h2 className="font-bold text-lg">Fiesta App</h2>
              <p className="text-fiesta-muted text-sm">
                Panel de administración
              </p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center p-3 rounded-lg text-left ${
                  activeTab === "dashboard"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100 text-fiesta-dark"
                }`}
              >
                <PieChart size={18} className="mr-3" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center p-3 rounded-lg text-left ${
                  activeTab === "users"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100 text-fiesta-dark"
                }`}
              >
                <Users size={18} className="mr-3" />
                <span>Usuarios</span>
              </button>

              <button
                onClick={() => setActiveTab("venues")}
                className={`w-full flex items-center p-3 rounded-lg text-left ${
                  activeTab === "venues"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100 text-fiesta-dark"
                }`}
              >
                <Store size={18} className="mr-3" />
                <span>Locales</span>
              </button>

              <button
                onClick={() => setActiveTab("partys")}
                className={`w-full flex items-center p-3 rounded-lg text-left ${
                  activeTab === "partys"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100 text-fiesta-dark"
                }`}
              >
                <PartyPopper size={18} className="mr-3" />
                <span>Fiestas</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9">
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Resumen</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <span className="text-xs text-fiesta-muted">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">
                    {stats.totalUsers}
                  </h3>
                  <p className="text-fiesta-muted text-sm">
                    Usuarios registrados
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Store size={20} className="text-green-600" />
                    </div>
                    <span className="text-xs text-fiesta-muted">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">
                    {stats.approvedVenues}
                  </h3>
                  <p className="text-fiesta-muted text-sm">Locales aprobados</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-100 rounded-full p-3">
                      <PieChart size={20} className="text-purple-600" />
                    </div>
                    <span className="text-xs text-fiesta-muted">Total</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">
                    {stats.totalParties}
                  </h3>
                  <p className="text-fiesta-muted text-sm">Fiestas creadas</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <h3 className="font-bold mb-4">Estadísticas de locales</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Locales pendientes</span>
                      <span className="text-sm font-medium">
                        {stats.pendingVenues}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-yellow-400 h-2.5 rounded-full"
                        style={{
                          width: `${
                            stats.totalVenues
                              ? (stats.pendingVenues / stats.totalVenues) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Locales aprobados</span>
                      <span className="text-sm font-medium">
                        {stats.approvedVenues}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            stats.totalVenues
                              ? (stats.approvedVenues / stats.totalVenues) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Gestión de Usuarios</h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Usuario
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Perfil
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Estado
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Fecha
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {user.avatar_url ? (
                                    <img
                                      className="h-10 w-10 rounded-full object-cover"
                                      src={user.avatar_url}
                                      alt={user.full_name}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User
                                        size={16}
                                        className="text-gray-500"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.full_name || "Usuario sin nombre"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.is_artist ? "Artista" : "Usuario"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.is_profile_completed ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Completo
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Incompleto
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-fiesta-primary hover:text-fiesta-primary/80 mr-3"
                              >
                                <Info size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "venues" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Gestión de Locales</h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center">
                    <div className="bg-yellow-100 rounded-full p-2 mr-3">
                      <Info size={20} className="text-yellow-700" />
                    </div>
                    <div>
                      <h3 className="font-medium">Pendientes de aprobación</h3>
                      <p className="text-sm text-yellow-700">
                        Hay {stats.pendingVenues} locales esperando tu revisión
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venues.map((venue) => (
                      <div
                        key={venue.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div
                          className={`h-2 ${
                            venue.status === "approved"
                              ? "bg-green-500"
                              : venue.status === "rejected"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">{venue.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                venue.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : venue.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {venue.status === "approved"
                                ? "Aprobado"
                                : venue.status === "rejected"
                                ? "Rechazado"
                                : "Pendiente"}
                            </span>
                          </div>

                          <p className="text-sm text-fiesta-muted mb-3 line-clamp-2">
                            {venue.description}
                          </p>

                          <div className="flex items-center text-xs text-fiesta-muted mb-4">
                            <User size={12} className="mr-1" />
                            <span>
                              {venue.profiles?.full_name || "Usuario"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <ButtonAnimated
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVenue(venue)}
                            >
                              Ver detalles
                            </ButtonAnimated>

                            {venue.status === "pending" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => approveVenue(venue.id)}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => rejectVenue(venue.id)}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "partys" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Gestión de Fiestas</h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary"></div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Local
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Organizador
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {partys.map((party) => (
                          <tr key={party.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{party.name}</div>
                              <div className="text-sm text-gray-500">
                                ${party.entry_price} - {party.capacity} personas
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {new Date(party.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {party.start_time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {party.venue || "Sin local asignado"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  party.is_online
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {party.is_online ? "Online" : "Presencial"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {party.profiles?.full_name ||
                                  "Organizador desconocido"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => setSelectedParty(party)}
                                className="text-fiesta-primary hover:text-fiesta-primary/80 mr-3"
                              >
                                <Info size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteParty(party.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
function from(arg0: string) {
  throw new Error("Function not implemented.");
}
