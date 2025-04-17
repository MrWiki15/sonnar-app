import Layout from "@/components/Layout";
import React, { useState } from "react";
import {
  Settings,
  Coins,
  Dam,
  X,
  Menu,
  Wallet2,
  EllipsisVerticalIcon,
  CoinsIcon,
  ChartBarBig,
  ChartArea,
  ChartColumnIncreasing,
  FolderEdit,
  HelpCircle,
  PartyPopperIcon,
} from "lucide-react";
import { ButtonAnimated } from "@/components/ui/button-animated";
import { useParams } from "react-router-dom";
import UpdateToken from "@/components/partyPanel/updateToken";
import SetupDiscord from "@/components/partyPanel/setupDiscord";
import DeployMarket from "@/components/partyPanel/deployMarket";
import EditEvent from "@/components/partyPanel/editEvent";
import SetupWallet from "@/components/partyPanel/setupWallet";
import SetupHelp from "@/components/partyPanel/setupHelp";

export default function PartyAdminPanel() {
  const { id } = useParams<{ partyId: string }>();

  const [activePanel, setActivePanel] = useState<
    "token" | "liquidity" | "discord" | "help" | "wallet" | "event"
  >("token");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <Layout>
      <div className="flex min-h-screen p-4 md:p-6">
        {/* Menú Flotante */}
        <div
          className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="w-64 h-full p-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Panel de Control</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActivePanel("event")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "event"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <PartyPopperIcon size={20} /> Event
              </button>

              <button
                onClick={() => setActivePanel("wallet")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "wallet"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Wallet2 size={20} /> Wallet
              </button>

              <button
                onClick={() => setActivePanel("token")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "token"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <CoinsIcon size={20} /> Token
              </button>

              <button
                onClick={() => setActivePanel("liquidity")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "liquidity"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <ChartBarBig size={20} /> Mercado
              </button>

              <button
                onClick={() => setActivePanel("discord")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "discord"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <FolderEdit size={20} /> Discord
              </button>

              <button
                onClick={() => setActivePanel("help")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === "help"
                    ? "bg-fiesta-primary text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <HelpCircle size={20} /> Ayuda
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido Principal */}
        <div
          className={`flex-1 transition-margin duration-300 relative ${
            isMenuOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            {!isMenuOpen && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg flex gap-2 items-center justify-center"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          <div className="flex justify-center">
            {activePanel === "event" && <EditEvent eventId={id} />}
            {activePanel === "wallet" && <SetupWallet eventId={id} />}
            {activePanel === "token" && <UpdateToken eventId={id} />}
            {activePanel === "liquidity" && <DeployMarket eventId={id} />}
            {activePanel === "discord" && <SetupDiscord eventId={id} />}
            {activePanel === "help" && <SetupHelp eventId={id} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
