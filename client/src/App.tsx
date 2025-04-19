import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PartyDetails from "./pages/PartyDetails";
import VenueDetails from "./pages/VenueDetails";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import Map from "./pages/Map";
import ArtistDetails from "./pages/ArtistDetails";
import CreateParty from "./pages/CreateParty";
import Admin from "./pages/Admin";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterVenue from "./pages/RegisterLocal";
import CreateFinanciation from "./pages/CreateFinanciation";
import FinanceParty from "./pages/FinanceParty";
import Settings from "./pages/Settings";
import Recuperar from "./pages/Recuperar";
import PartyAdminPanel from "./pages/PartyAdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />

            <Route
              path="/recuperar"
              element={
                <ProtectedRoute>
                  <Recuperar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/fiesta/:id" element={<PartyDetails />} />
            <Route
              path="/fiesta/admin/:id"
              element={
                <ProtectedRoute>
                  <PartyAdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/local/:id"
              element={
                <ProtectedRoute>
                  <VenueDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/nuevo-local" element={<RegisterVenue />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/mapa" element={<Map />} />
            <Route path="/artista/:id" element={<ArtistDetails />} />
            <Route
              path="/crear"
              element={
                <ProtectedRoute>
                  <CreateParty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-financiation/:id"
              element={
                <ProtectedRoute>
                  <CreateFinanciation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PartyAdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/setting"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
