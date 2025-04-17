import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";

// Configuración constante
const APP_METADATA = {
  name: "Party App",
  description: "Party Platform Crowdfunding",
  url: "https://party.polarisweb3.org",
  icons: ["https://i.ibb.co/sdddTzJV/image.png"],
};

const WALLET_CONNECT_PROJECT_ID = "943fab23d0718260659c61679f373824";
const NETWORK_TYPE = LedgerId.TESTNET; // Cambiar para producción
const CHAIN_ID = HederaChainId.Testnet; // Cambiar para producción

const ConnectWalletButton = () => {
  const { setDappConnector, setAccountId: setAuthAccountId } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(
    null
  );

  // Inicializar DAppConnector una sola vez
  useEffect(() => {
    const connector = new DAppConnector(
      APP_METADATA,
      NETWORK_TYPE,
      WALLET_CONNECT_PROJECT_ID,
      [...Object.values(HederaJsonRpcMethod), "hedera_associateToken"],
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [CHAIN_ID]
    );

    setDAppConnector(connector);
    setDappConnector(connector);
  }, [setDappConnector]);

  // Manejadores de eventos con useCallback
  const handleNewSession = useCallback(
    (session: any) => {
      const sessionAccount = session.namespaces?.hedera?.accounts?.[0];
      const [accountId, network] = sessionAccount?.split(":")?.reverse() || [];

      if (accountId) {
        localStorage.setItem("hederaAccountId", accountId);
        localStorage.setItem("hederaNetwork", network);
        setAuthAccountId(accountId);
        setIsConnected(true);
        toast.success(`Conectado: ${accountId}`);
      }
    },
    [setAuthAccountId]
  );

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem("hederaAccountId");
    localStorage.removeItem("hederaNetwork");
    setAuthAccountId(null);
    setIsConnected(false);
    toast.success("Wallet desconectada");
  }, [setAuthAccountId]);

  // Configurar y limpiar listeners
  useEffect(() => {
    if (!dAppConnector) return;

    const initialize = async () => {
      try {
        await dAppConnector.init({ logger: "error" });

        // Verificar sesión existente desde localStorage
        const savedAccountId = localStorage.getItem("hederaAccountId");
        if (savedAccountId) {
          setAuthAccountId(savedAccountId);
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Error inicializando WalletConnect:", err);
        setError("Error inicializando conexión con wallet");
      }
    };

    initialize();

    // Configurar listeners
    dAppConnector.onSessionIframeCreated = handleNewSession;
    dAppConnector.onSessionDisconnect = handleDisconnect;

    // Limpieza
    return () => {
      dAppConnector.onSessionIframeCreated = null;
      dAppConnector.onSessionDisconnect = null;
    };
  }, [dAppConnector, handleNewSession, handleDisconnect, setAuthAccountId]);

  // Manejo de conexión
  const connectWallet = useCallback(async () => {
    if (!dAppConnector || isConnecting) return;

    try {
      setIsConnecting(true);
      toast.info("Conectando a wallet...");
      const session = await dAppConnector.openModal();
      handleNewSession(session);
    } catch (err) {
      console.error("Error de conexión:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error("Error al conectar wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [dAppConnector, isConnecting, handleNewSession]);

  // Manejo de desconexión
  const disconnectWallet = useCallback(async () => {
    if (!dAppConnector) return;

    try {
      await dAppConnector.disconnectAll();
      handleDisconnect();
    } catch (err) {
      console.error("Error desconectando:", err);
      setError("Error al desconectar wallet");
    }
  }, [dAppConnector, handleDisconnect]);

  // Estado derivado
  const savedAccountId = localStorage.getItem("hederaAccountId");
  const buttonText =
    isConnected && savedAccountId
      ? `${savedAccountId.slice(0, 6)}...${savedAccountId.slice(-4)}`
      : "Conectar Wallet";

  // Memoriza la renderización del botón para evitar renders innecesarios
  const memoizedButton = useMemo(
    () => (
      <ButtonAnimated
        variant={isConnected ? "ghost" : "primary"}
        onClick={isConnected ? disconnectWallet : connectWallet}
        isLoading={isConnecting}
        disabled={!dAppConnector}
      >
        <div className="flex items-center gap-2">
          <Wallet size={16} />
          {buttonText}
        </div>
      </ButtonAnimated>
    ),
    [
      isConnected,
      isConnecting,
      dAppConnector,
      buttonText,
      disconnectWallet,
      connectWallet,
    ]
  );

  return memoizedButton;
};

export default ConnectWalletButton;
