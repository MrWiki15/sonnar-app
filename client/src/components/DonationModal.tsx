import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { donate } from "@/api/fetch";
import { TokenAssociateTransaction, AccountId, TokenId } from "@hashgraph/sdk";
import { ButtonAnimated } from "./ui/button-animated";
import { CheckCircle, Loader, X, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { sendTransfer } from "../hedera/sendTransfer";
import { QRCodeSVG } from "qrcode.react";

type DonationState =
  | "idle"
  | "associating_token"
  | "manual_association"
  | "token_associated"
  | "confirming_sending"
  | "sending_hbar"
  | "hbar_sent"
  | "minting_tokens"
  | "completed"
  | "sharing"
  | "error";

interface DonationModalProps {
  partyId: string;
  tokenId: string;
  organizerWallet: string;
  eventName: string;
  eventUrl: string;
  eventWallet: string;
  onClose: () => void;
}

const StatusIcon = ({ state }: { state: DonationState }) => {
  const icons = {
    idle: null,
    associating_token: <Loader className="animate-spin" size={24} />,
    token_associated: <CheckCircle className="text-green-500" size={24} />,
    confirming_sending: <Loader className="animate-spin" size={24} />,
    sending_hbar: <Loader className="animate-spin" size={24} />,
    hbar_sent: <CheckCircle className="text-green-500" size={24} />,
    completed: <CheckCircle className="text-green-500" size={48} />,
    minting_tokens: <Loader className="animate-spin" size={24} />,
    sharing: <CheckCircle className="text-green-500" size={48} />,
    error: <XCircle className="text-red-500" size={24} />,
  };

  return <div className="mb-4 text-center">{icons[state]}</div>;
};

const Dialog = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
      >
        <X size={24} />
      </button>
      {children}
    </div>
  </div>
);

const Stepper = ({
  activeStep,
  steps,
}: {
  activeStep: number;
  steps: string[];
}) => (
  <div className="flex justify-between mb-8">
    {steps.map((step, index) => (
      <div key={index} className="flex flex-col items-center w-1/4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
            ${
              index <= activeStep
                ? "bg-fiesta-primary text-white"
                : "bg-gray-200"
            }`}
        >
          {index + 1}
        </div>
        <span className="text-sm mt-2 text-center">{step}</span>
      </div>
    ))}
  </div>
);

const DonationModal = ({
  partyId,
  tokenId,
  organizerWallet,
  eventName,
  eventUrl,
  eventWallet,
  onClose,
}: DonationModalProps) => {
  const auth = useAuth();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donationId, setDonationId] = useState<string | null>(null);
  const [donationState, setDonationState] = useState<DonationState>("idle");
  const [error, setError] = useState("");
  const [tokensReceived, setTokensReceived] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [donationUrl, setDonationUrl] = useState("");
  const [asociatedRecipient, setAsociatedRecipient] = useState();
  const intervalRef = useRef<NodeJS.Timeout>();
  const attemptsRef = useRef(0);

  const steps = ["Vincular", "Enviar", "Recibir", "Compartir"];

  const stateToStep: Record<DonationState, number> = {
    idle: 0,
    associating_token: 0,
    token_associated: 0,
    confirming_sending: 1,
    sending_hbar: 1,
    hbar_sent: 1,
    minting_tokens: 2,
    completed: 2,
    sharing: 3,
    error: -1,
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkTokenAssociation = async () => {
    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${auth.accountId}/tokens`
      );
      const data = await response.json();
      return data.tokens?.some((t: any) => t.token_id === tokenId);
    } catch (err) {
      console.error("Error verificando asociación de token:", err);
      return false;
    }
  };

  const checkHbarTransfer = async (): Promise<boolean> => {
    try {
      const amountTinybar = Math.round(Number(amount) * 100_000_000);

      // Codificación Base64 segura para navegador
      const expectedMemo = btoa(unescape(encodeURIComponent(memo)));

      const url = new URL(
        "https://testnet.mirrornode.hedera.com/api/v1/transactions"
      );
      url.searchParams.append("account.id", auth.accountId!);
      url.searchParams.append("transactiontype", "CRYPTOTRANSFER");
      url.searchParams.append("result", "SUCCESS");
      url.searchParams.append("order", "desc");
      url.searchParams.append("limit", "25");

      const response = await fetch(url.toString());

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      let isT = false;

      data.transactions?.forEach((tx: any) => {
        if (tx.memo_base64 == expectedMemo) {
          isT = true;
        } else {
          isT = false;
        }
      });

      return isT;
    } catch (err) {
      console.error("Error checking HBAR transfer:", err);
      return false;
    }
  };

  const handleAssociateToken = async () => {
    try {
      setDonationState("associating_token");
      setError("");

      const isAssociated = await checkTokenAssociation();
      if (isAssociated) {
        setDonationState("token_associated");
        toast.success("Token ya está asociado");
        return;
      }

      const signer =
        auth.dappConnector?.signers.find(
          (s) => s.getAccountId().toString() === auth.accountId
        ) ?? auth.dappConnector?.signers[0];

      if (!signer) throw new Error("Wallet no conectada");

      try {
        const tx = await new TokenAssociateTransaction()
          .setAccountId(AccountId.fromString(auth.accountId!))
          .setTokenIds([TokenId.fromString(tokenId)])
          .freezeWithSigner(signer);

        const txResponse = await tx.executeWithSigner(signer);
        const receipt = await txResponse.getReceiptWithSigner(signer);
        setAsociatedRecipient(receipt);
      } catch (err) {
        console.log(err);
        setDonationState("manual_association");
      }

      if (asociatedRecipient?.status?.toString() === "SUCCESS") {
        toast.info(
          "Transacción enviada. Puedes verificar el estado manualmente"
        );
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleVerifyAssociation = async () => {
    try {
      setDonationState("associating_token");
      const isAssociated = await checkTokenAssociation();
      if (isAssociated) {
        setDonationState("token_associated");
        toast.success("Token asociado correctamente");
      } else {
        toast.warning("La asociación aún no se ha completado");
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleVerifyTransaction = async () => {
    try {
      setDonationState("sending_hbar");
      const isTransferComplete = await checkHbarTransfer();
      console.log(isTransferComplete);
      if (isTransferComplete) {
        setDonationState("hbar_sent");
        registerDonation(Number(amount), memo);
        toast.success("Transacción verificada exitosamente");
      } else {
        toast.warning("La transacción aún no se ha confirmado");
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSendDonation = async () => {
    try {
      setDonationState("sending_hbar");
      setError("");

      const amountNumber = Number(amount);
      if (isNaN(amountNumber)) throw new Error("Monto inválido");
      if (amountNumber < 0.1) throw new Error("Monto mínimo: 0.1 ℏ");

      const uniqueMemo = `donation-${crypto.randomUUID()}`;
      setMemo(uniqueMemo);

      toast.info(
        <div>
          <p>Por favor abre tu wallet para confirmar la transacción</p>
        </div>,
        { duration: 20000 }
      );

      try {
        await sendTransfer(
          auth,
          amountNumber,
          auth.accountId!,
          eventWallet,
          uniqueMemo
        );
      } catch (e) {
        console.log(e);
      }

      attemptsRef.current = 0;
      intervalRef.current = setInterval(async () => {
        attemptsRef.current++;

        if (await checkHbarTransfer()) {
          clearInterval(intervalRef.current!);
          setDonationState("hbar_sent");
          registerDonation(amountNumber, uniqueMemo);
        } else if (attemptsRef.current > 20) {
          clearInterval(intervalRef.current!);
          throw new Error("Tiempo de espera agotado");
        }
      }, 3000);
    } catch (err) {
      handleError(err);
    }
  };

  const registerDonation = async (amount: number, memo: string) => {
    try {
      setDonationState("minting_tokens");
      const { data: donation, error } = await supabase
        .from("donations")
        .insert([
          {
            partie_id: partyId,
            donator_id: auth.accountId,
            amount,
            message,
            memo,
            status: 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setDonationId(donation.id);
      setDonationUrl(`https://xxx.com/donations/${donation.id}`);

      const backendResponse = await donate({
        //-> minting tokens
        donation_id: donation.id,
        event_id: partyId,
        donor_wallet: auth.accountId!,
        amount_hbar: amount,
      });

      setTokensReceived(backendResponse.tokensReceived);
      setDonationState("completed");
    } catch (err) {
      handleError(err);
    }
  };

  const handleError = (error: Error) => {
    console.error(error);
    setDonationState("error");
    setError(
      error.message.includes("insufficient funds")
        ? "Fondos insuficientes en tu wallet"
        : error.message
    );
    toast.error(error.message);

    if (donationId) {
      supabase.from("donations").update({ status: 0 }).eq("id", donationId);
    }
  };

  const handleNextStep = () => {
    switch (donationState) {
      case "token_associated":
        setDonationState("confirming_sending");
        break;
      case "hbar_sent":
        setDonationState("completed");
        break;
      case "completed":
        setDonationState("sharing");
        break;
    }
  };

  const getCurrentContent = () => {
    switch (donationState) {
      case "idle":
      case "associating_token":
      case "token_associated":
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <StatusIcon state={donationState} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {donationState === "associating_token"
                ? "Verificando estado de la asociación..."
                : donationState === "token_associated"
                ? ""
                : "Para participar, debes asociar el token del evento a tu wallet."}
            </p>
            <div className="flex gap-2">
              <ButtonAnimated
                fullWidth
                size="lg"
                variant={
                  donationState === "token_associated" ? "ghost" : "primary"
                }
                onClick={
                  donationState === "token_associated"
                    ? undefined
                    : handleAssociateToken
                }
                isLoading={donationState === "associating_token"}
                disabled={donationState === "token_associated"}
              >
                {donationState === "token_associated"
                  ? "Token Vinculado"
                  : "Vincular Token"}
              </ButtonAnimated>

              {donationState === "associating_token" && (
                <ButtonAnimated
                  variant="outline"
                  onClick={handleVerifyAssociation}
                >
                  Verificar Asociación
                </ButtonAnimated>
              )}
            </div>
            {donationState === "token_associated" && (
              <ButtonAnimated onClick={handleNextStep}>
                Siguiente Paso
              </ButtonAnimated>
            )}
          </div>
        );
      case "manual_association":
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <StatusIcon state={donationState} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {donationState === "manual_association"
                ? "Presione el botón de abajo para verificar el estado de la asociación"
                : donationState === "manual_association"
                ? ""
                : "Para participar, debes asociar el token del evento a tu wallet."}
            </p>
            <div className="flex gap-2">
              <ButtonAnimated
                fullWidth
                size="lg"
                variant="ghost"
                onClick={undefined}
                isLoading={donationState === "manual_association"}
                disabled={donationState === "manual_association"}
              >
                {donationState === "manual_association"
                  ? "Verificando ..."
                  : ""}
              </ButtonAnimated>

              {donationState === "manual_association" && (
                <ButtonAnimated
                  variant="outline"
                  onClick={handleVerifyAssociation}
                >
                  Verificar Asociación
                </ButtonAnimated>
              )}
            </div>
            {donationState === "manual_association" && (
              <ButtonAnimated onClick={handleNextStep}>
                Siguiente Paso
              </ButtonAnimated>
            )}
          </div>
        );
      case "confirming_sending":
      case "sending_hbar":
      case "hbar_sent":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Cantidad a donar (ℏ)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={amount}
                  onChange={(e) => {
                    if (Number(e.target.value) >= 0.1) setError("");
                    setAmount(e.target.value);
                  }}
                  onBlur={(e) => {
                    if (Number(e.target.value) < 0.1) {
                      setError("Monto mínimo: 0.1 ℏ");
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <ButtonAnimated
                fullWidth
                size="lg"
                onClick={handleSendDonation}
                isLoading={donationState === "sending_hbar"}
                disabled={
                  donationState === "hbar_sent" ||
                  donationState === "sending_hbar"
                }
              >
                {donationState === "sending_hbar"
                  ? "Confirmando"
                  : "Confirmar Donación"}
              </ButtonAnimated>

              {donationState === "sending_hbar" && (
                <ButtonAnimated
                  variant="outline"
                  onClick={handleVerifyTransaction}
                >
                  Verificar Transacción
                </ButtonAnimated>
              )}
            </div>
          </div>
        );

      case "minting_tokens":
        return (
          <div className="text-center space-y-6 flex flex-col justify-center items-center">
            <StatusIcon state={donationState} />
            <p className="text-lg font-semibold">
              Minting tokens de recompensa...
            </p>
            <p className="text-sm text-gray-500">
              Por favor espera mientras se generan tus tokens.
              <br />
              Este proceso puede tomar unos segundos.
            </p>
            <div className="animate-pulse text-sm text-fiesta-primary">
              Transacción en progreso
            </div>
          </div>
        );

      case "completed":
        return (
          <div className="text-center space-y-6 flex flex-col justify-center items-center">
            <StatusIcon state={donationState} />
            <p className="text-lg font-semibold">
              ¡Has recibido {tokensReceived / Math.pow(10, 2)} tokens!
            </p>
            <ButtonAnimated onClick={handleNextStep}>
              Siguiente Paso
            </ButtonAnimated>
          </div>
        );

      case "sharing":
        return (
          <div className="space-y-6 text-center">
            <div className="mb-4">
              <CheckCircle className="text-green-500 mx-auto" size={48} />
            </div>
            <h4 className="text-xl font-semibold">¡Donación Exitosa!</h4>
            <p className="text-gray-600">
              Comparte tu contribución al evento en redes sociales
            </p>

            <div className="grid grid-cols-1 gap-2">
              <ButtonAnimated
                variant="outline"
                onClick={() => {
                  const tweetText = encodeURIComponent(
                    `Acabo de realizar una contribución de ${amount} hbar al evento "${eventName}" y a cambio recibí ${
                      tokensReceived / Math.pow(10, 2)
                    } tokens del evento. Si también quieres apoyar al evento puedes hacerlo a través de este enlace: ${eventUrl}`
                  );
                  window.open(
                    `https://twitter.com/intent/tweet?text=${tweetText}`,
                    "_blank"
                  );
                }}
              >
                Compartir en Twitter
              </ButtonAnimated>
            </div>

            <ButtonAnimated
              onClick={() => {
                onClose();
                location.reload();
              }}
            >
              Finalizar
            </ButtonAnimated>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6">
            <StatusIcon state={donationState} />
            <p className="text-red-500 text-center">{error}</p>
            <div className="flex gap-2">
              <ButtonAnimated onClick={onClose}>Cerrar</ButtonAnimated>
              <ButtonAnimated
                variant="outline"
                onClick={() => setDonationState("idle")}
              >
                Intentar de nuevo
              </ButtonAnimated>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog onClose={onClose}>
      <div className="p-6">
        <Stepper activeStep={stateToStep[donationState]} steps={steps} />
        {getCurrentContent()}
      </div>
    </Dialog>
  );
};

export default DonationModal;
