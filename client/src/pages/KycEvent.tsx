// Componente KycEvent completo
import Layout from "@/components/Layout";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/api/routes";
import { supabase } from "@/integrations/supabase/client";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useParams } from "react-router-dom";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
}

interface Guild {
  id: string;
  name: string;
  icon?: string;
  permissions: number;
}

export default function KycEvent() {
  const auth = useAuth();
  console.log(auth);
  const { id } = useParams();
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [isDiscordSetup, setIsDiscordSetup] = useState(false);
  const [setupData, setSetupData] = useState<any>(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [discordData, setDiscordData] = useState<any>(null);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [roleAssigned, setRoleAssigned] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [hasToken, setHasToken] = useState(false);

  // Obtener información del evento
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Cargando información del evento...");

        const eventId = id || localStorage.getItem("event-selected-for-kyc-id");
        if (!eventId) {
          toast.error("Evento no seleccionado");
          window.location.href = "/";
          return;
        }

        const { data: partyData, error: partyError } = await supabase
          .from("parties")
          .select("*")
          .eq("id", eventId)
          .single();

        if (partyError) throw partyError;

        setEvent(partyData);
        localStorage.setItem("event-selected-for-kyc-id", eventId);

        // Verificar configuración de Discord
        if (partyData.discord_setup_id) {
          const { data: discordSetup } = await supabase
            .from("discord_setups")
            .select("*")
            .eq("id", partyData.discord_setup_id)
            .single();

          setIsDiscordSetup(!!discordSetup);
          setSetupData(discordSetup);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el evento");
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [id]);

  // Conexión con Discord
  const handleConnectDiscord = async () => {
    try {
      const state = crypto.randomUUID();
      document.cookie = `discord_kyc_state=${state}; SameSite=Strict; Path=/; Secure`;

      await axios.post(routes.event.sesion, { state });
      window.location.href = `https://discord.com/oauth2/authorize?client_id=1277717716333232148&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fkyc%2F&scope=guilds+email+identify`;
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con Discord");
    }
  };

  // Procesar autenticación de Discord
  useEffect(() => {
    const processDiscordAuth = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (!code) {
        if (error)
          toast.error(`Error: ${params.get("error_description") || error}`);
        setLoading(false);
        return;
      }

      if (code) {
        try {
          setLoading(true);
          setLoadingMessage("Verificando cuenta de Discord...");

          const { data } = await axios.post(
            routes.event.discord_token_exchange,
            {
              code,
              redirect_uri: import.meta.env.VITE_KYC_DISCORD_REDIRECT_URI,
            }
          );

          if (!data?.token) throw new Error("Invalid token response");

          const decoded = jwtDecode<{ access_token: string; guilds: Guild[] }>(
            data.token
          );

          const userResponse = await axios.get(
            "https://discord.com/api/users/@me",
            {
              headers: { Authorization: `Bearer ${decoded.access_token}` },
            }
          );

          setDiscordUser(userResponse.data);
          setVerificationStep(1);
          window.history.replaceState({}, "", window.location.pathname);
        } catch (error) {
          console.error("Error en autenticación Discord:", error);
          toast.error("Error al conectar con Discord");
        } finally {
          setLoading(false);
        }
      }
    };

    processDiscordAuth();
  }, []);

  // Verificar token en wallet
  const verifyWalletToken = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Verificando tokens en tu wallet...");

      const mirrorNodeBaseUrl = "https://testnet.mirrornode.hedera.com/api/v1";
      const walletAddress = auth.accountId;
      const tokenId = event?.token_id;

      if (!walletAddress || !tokenId) {
        toast.error("Datos de cuenta o token faltantes");
        return;
      }

      // Consulta los balances del token para esta cuenta en testnet
      const response = await axios.get(
        `${mirrorNodeBaseUrl}/tokens/${tokenId}/balances`,
        { params: { "account.id": walletAddress } }
      );

      const balances = response.data.balances || [];
      const balance = balances.length > 0 ? balances[0].balance : 0;

      if (balance > 0) {
        setHasToken(true);
        setVerificationStep(2);
      } else {
        toast.error("No posees el token requerido");
      }
    } catch (error) {
      console.error("Error verificando token:", error);
      toast.error("Error al verificar tokens");
    } finally {
      setLoading(false);
    }
  };

  // Asignar rol de Discord
  const assignDiscordRole = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Asignando rol en Discord...");

      await axios.post(routes.event.assign_discord_role, {
        discordUserId: discordUser?.id,
        guildId: setupData.guild_id,
        roleId: setupData.roles[0].id,
        wallet: auth.accountId,
        tokenId: event?.token_id,
      });

      setRoleAssigned(true);
      setVerificationStep(3);
      toast.success("¡Rol asignado exitosamente!");
    } catch (error) {
      console.error("Error asignando rol:", error);
      toast.error("Error al asignar el rol");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (!isDiscordSetup)
      return (
        <div className="text-center text-red-500">
          Este evento no tiene configuración de Discord
        </div>
      );

    switch (verificationStep) {
      case 0:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold">Verificación KYC</h2>
            <p className="text-gray-600">
              Conecta tu cuenta de Discord y verifica tu wallet para obtener el
              rol
            </p>
            <Button onClick={handleConnectDiscord} disabled={!auth.accountId}>
              {auth.accountId ? (
                <>
                  <img
                    src="/discord-logo.svg"
                    alt="Discord"
                    className="w-5 h-5 mr-2"
                  />
                  Conectar Discord
                </>
              ) : (
                "Conecta tu wallet primero"
              )}
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">¡Discord conectado!</h3>
            <p className="text-gray-600">
              Ahora verifica que posees el token del evento en tu wallet
            </p>
            <Button onClick={verifyWalletToken}>Verificar Tokens</Button>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">¡Tokens verificados!</h3>
            <Button onClick={assignDiscordRole}>Obtener Rol en Discord</Button>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">¡Proceso completado!</h3>
            <p className="text-gray-600">
              El rol {event?.discord_setup?.roles[0]?.name} ha sido asignado
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center text-red-500">
            <XCircle className="h-12 w-12 mx-auto" />
            Error en el proceso
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-4">
        {loading ? (
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500" />
            <p className="mt-4 text-gray-600">{loadingMessage}</p>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>
    </Layout>
  );
}
