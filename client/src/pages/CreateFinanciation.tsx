import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate, useNavigation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, ArrowUp, Check, Reply } from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import {
  createEvent as createWallet,
  checkWalletFounding,
  createToken,
} from "@/api/fetch";
import {
  TransferTransaction,
  AccountId,
  Hbar,
  HbarUnit,
  TransactionReceipt,
} from "@hashgraph/sdk";
import {
  BenefitsSection,
  FundingStatus,
  InputCurrency,
  PhaseSection,
  WalletInfo,
} from "@/components/PhaseSection";

type Party = {
  id: string;
  name: string;
  benefits?: string[];
  goal_amount?: number;
  organizer_wallet?: string;
  parti_wallet?: string;
  parti_wallet_private_key?: string;
};

type TransactionState = {
  status: "idle" | "loading" | "success" | "error";
  receipt?: TransactionReceipt;
};

export default function CreateFinanciation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [amount, setAmount] = useState("");
  const [state, setState] = useState(1);
  const [ownerWallet, setOwnerWallet] = useState("");
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: "idle",
  });
  const [transactionFoundWallet, setTransactionFoundWallet] = useState(false);
  const [tokenId, setTokenId] = useState("");

  // Obtener datos del evento
  const fetchParty = useCallback(async () => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Evento no encontrado");

      setParty(data);

      if (auth.user?.id !== data.user_id) {
        navigate("/fiesta/" + id);
      }

      setBenefits(data.benefits || []);
      setAmount(data.goal_amount?.toString() || "");

      // Determinar estado inicial
      if (data.parti_wallet) {
        data.goal_amount ? setState(3) : setState(2);
      }

      setTransactionState({ status: "loading" });
      const dataY = await checkWalletFounding(id);
      if (dataY.funded) {
        setState(4);
        setTransactionState({ status: "success" });
      }
      setTransactionState({ status: "idle" });

      if (data.token_id) {
        setState(5);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParty();
  }, []);

  // Manejo de beneficios
  const handleBenefits = {
    add: () => {
      if (newBenefit.trim() && benefits.length < 10) {
        setBenefits((prev) => [...prev, newBenefit.trim()]);
        setNewBenefit("");
      }
    },
    remove: (index: number) => {
      setBenefits((prev) => prev.filter((_, i) => i !== index));
    },
  };

  // Guardar información básica
  const handleSave = async () => {
    if (!auth.accountId) {
      toast.error("No se encontró tu wallet");
      return;
    }

    if (!auth.accountId || !validateForm()) return;

    try {
      const { error } = await supabase
        .from("parties")
        .update({
          organizer_wallet: auth.accountId,
          benefits,
          goal_amount: Number(amount),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Información guardada exitosamente");
      setState(2);
    } catch (error) {
      toast.error("Error al guardar la información");
    }
  };

  const validateForm = () => {
    const validations = [
      [!auth.accountId, "Por favor conecta tu wallet"],
      [!amount, "Ingresa una cantidad válida"],
      [Number(amount) <= 0, "La cantidad debe ser positiva"],
      [benefits.length === 0, "Agrega al menos un beneficio"],
      [Number(amount) > 100000, "El monto máximo es 100,000 HBAR"],
    ];

    const [hasError, message] =
      validations.find(([condition]) => condition) || [];
    if (hasError) toast.error(message as string);

    return !hasError;
  };

  // Crear wallet del evento
  const handleCreateWallet = async () => {
    try {
      const walletData = await createWallet({ event_id: id });
      setParty((prev) =>
        prev ? { ...prev, parti_wallet: walletData.wallet } : null
      );
      setState(3);
      toast.success("Wallet creada exitosamente");
    } catch (error) {
      toast.error("Error al crear la wallet");
    }
  };

  // Transferir fondos
  const handleFundWallet = async () => {
    if (!auth.accountId || !party?.parti_wallet) return;

    setTransactionState({ status: "loading" });
    setTransactionFoundWallet(true);

    try {
      const signer = auth.dappConnector?.signers.find(
        (s) => s.getAccountId().toString() === auth.accountId
      );

      if (!signer) throw new Error("No se encontró el firmante");

      const transferTx = new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(auth.accountId),
          Hbar.from(-10, HbarUnit.Hbar)
        )
        .addHbarTransfer(
          AccountId.fromString(party.parti_wallet),
          Hbar.from(10, HbarUnit.Hbar)
        )
        .setTransactionMemo("Fondeo inicial para comisiones");

      const receipt = await transferTx
        .freezeWithSigner(signer)
        .then((tx) => tx.executeWithSigner(signer))
        .then((tx) => tx.getReceiptWithSigner(signer))
        .catch((err) => {
          console.log(err);
        });

      const t = setTimeout(() => {
        const yt = checkWalletFounding(party.id)
          .then((data) => data.json())
          .then((data) => {
            if (data.funded) {
              setState(4);
              setTransactionState({ status: "success" });
              toast.success("Fondeo exitoso!");
              setTransactionFoundWallet(false); // Reset loading state
              clearTimeout(t);
            }
          });
      }, 1000);
    } catch (error) {
      //puede ocurrir error inesperado asi que se verifica si los fondos se enviaron de todas formas
      const data = await checkWalletFounding(id);

      if (data.funded) {
        setState(4);
        setTransactionState({ status: "success" });
        toast.success("Fondeo exitoso!");
      } else {
        setTransactionState({ status: "error" });
        toast.error("Error en la transacción");
        console.error(error);
      }
    }
  };

  // Crear token
  const handleCreateToken = async () => {
    try {
      const response = await createToken(id);
      setTokenId(response.tokenId);
      toast.success("Token creado exitosamente!");
      setState(5);
    } catch (error) {
      console.log(error);
      toast.error("Error al crear el token");
    }
  };

  const handleCompleteSetup = async () => {
    navigate("/fiesta/" + id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fiesta-primary" />
        </div>
      </Layout>
    );
  }

  if (!party) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-fiesta-muted">Evento no encontrado</p>
          <Link to="/" className="text-fiesta-primary mt-4 font-medium">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 p-4">
        {/* Fase 1: Configuración básica */}
        <PhaseSection
          title="Fase 1: Configuración inicial 🚧"
          active={state >= 1}
          completed={state > 1}
        >
          <WalletInfo wallet={auth.accountId} />

          <InputCurrency
            value={amount}
            onChange={setAmount}
            placeholder="Meta de financiamiento (HBAR)"
          />

          <BenefitsSection
            benefits={benefits}
            newBenefit={newBenefit}
            onAdd={handleBenefits.add}
            onRemove={handleBenefits.remove}
            onInputChange={setNewBenefit}
          />

          <ButtonAnimated
            onClick={handleSave}
            disabled={state !== 1}
            className="w-full"
            variant={state !== 1 ? "ghost" : "primary"}
          >
            Guardar configuración
          </ButtonAnimated>
        </PhaseSection>

        {/* Fase 2: Creación de wallet */}
        <PhaseSection
          title="Fase 2: Crear Wallet 🔐"
          active={state >= 2}
          completed={state > 2}
        >
          <WalletInfo
            wallet={party.parti_wallet}
            label="Wallet del evento"
            explorerLink
          />

          <ButtonAnimated
            onClick={handleCreateWallet}
            disabled={state !== 2}
            className="w-full"
            variant={state !== 2 ? "ghost" : "primary"}
          >
            Generar wallet segura
          </ButtonAnimated>
        </PhaseSection>

        {/* Fase 3: Fondeo inicial */}
        <PhaseSection
          title="Fase 3: Fondeo inicial 💸"
          active={state >= 3}
          completed={state > 3}
        >
          <div className="space-y-4">
            <FundingStatus
              current={transactionState.receipt?.currentHbar}
              required="10 ℏ"
              funded={transactionState.status === "success"}
            />

            <ButtonAnimated
              onClick={handleFundWallet}
              disabled={state !== 3}
              isLoading={transactionFoundWallet}
              className="w-full"
              variant={state !== 3 ? "ghost" : "primary"}
            >
              Transferir 10 HBAR
            </ButtonAnimated>
          </div>
        </PhaseSection>

        {/* Fase 4: Creación de token */}
        <PhaseSection
          title="Fase 4: Crear Token ✨"
          active={state >= 4}
          completed={!!tokenId}
        >
          <WalletInfo
            wallet={party.token_id ? party.token_id : tokenId}
            label="Token del evento"
            explorerLink
            token
          />

          <ButtonAnimated
            onClick={handleCreateToken}
            disabled={state !== 4}
            className="w-full"
            variant={state !== 4 ? "ghost" : "primary"}
          >
            {tokenId ? "Token creado" : "Generar token"}
          </ButtonAnimated>
        </PhaseSection>

        <ButtonAnimated
          onClick={handleCompleteSetup}
          disabled={state !== 5}
          className="w-full"
          variant={state !== 5 ? "ghost" : "primary"}
        >
          Completar setup
        </ButtonAnimated>
      </div>
    </Layout>
  );
}
