import { Banknote, Calendar, Ticket } from "lucide-react";
import { Donations as Donation } from "@/types/supabase";

interface DonationCardProps {
  donation: Donation;
}

const getStatusStyle = (status: number) => {
  switch (status) {
    case 0:
      return { text: "Fallida", bg: "bg-red-100", textColor: "text-red-800" };
    case 1:
      return {
        text: "Pendiente",
        bg: "bg-yellow-100",
        textColor: "text-yellow-800",
      };
    case 2:
      return {
        text: "Completada",
        bg: "bg-green-100",
        textColor: "text-green-800",
      };
    case 3:
      return {
        text: "Reembolsada",
        bg: "bg-blue-100",
        textColor: "text-blue-800",
      };
    default:
      return {
        text: "Desconocido",
        bg: "bg-gray-100",
        textColor: "text-gray-800",
      };
  }
};

const DonationCard = ({ donation }: DonationCardProps) => {
  const status = getStatusStyle(donation?.status);
  const donationDate = new Date(donation?.created_at).toLocaleDateString(
    "es-CU",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-fiesta-primary" />
            <h3 className="text-lg font-bold">{donation?.amount} Hbar</h3>
          </div>

          {donation?.partie_id && typeof donation?.partie_id === "object" && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <Ticket className="h-4 w-4" />
              <span>{(donation?.partie_id as any)?.name}</span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{donationDate}</span>
          </div>
        </div>

        <div
          className={`${status?.bg} ${status?.textColor} px-3 py-1 rounded-full text-sm`}
        >
          {status?.text}
        </div>
      </div>

      {donation?.message && (
        <p className="mt-3 text-sm text-gray-600 italic">
          "{donation?.message}"
        </p>
      )}

      {donation?.transaction_id && (
        <div className="mt-3 text-sm">
          <p className="text-gray-500">ID de transacción:</p>
          <p className="font-mono text-fiesta-primary break-all">
            {donation?.transaction_id}
          </p>
        </div>
      )}
    </div>
  );
};

export default DonationCard;
