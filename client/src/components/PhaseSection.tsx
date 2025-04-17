import { Check, Reply } from "lucide-react";
import { ButtonAnimated } from "./ui/button-animated";

// Componentes auxiliares
export const PhaseSection: React.FC<{
  title: string;
  active: boolean;
  completed: boolean;
  children: React.ReactNode;
}> = ({ title, active, completed, children }) => (
  <section
    className={`p-6 bg-white rounded-xl space-y-6 transition-opacity ${
      !active ? "opacity-50 pointer-events-none" : ""
    }`}
  >
    <h2 className="text-xl font-semibold flex items-center gap-2">
      {title}
      {completed && <Check className="text-green-500" size={20} />}
    </h2>
    {children}
  </section>
);

export const WalletInfo: React.FC<{
  wallet?: string;
  label?: string;
  explorerLink?: boolean;
  token?: boolean;
}> = ({ wallet, label = "Tu wallet", explorerLink = false, token = false }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium">{label}</p>
    {wallet ? (
      <div className="flex items-center gap-2">
        <span className="font-mono text-fiesta-primary truncate">{wallet}</span>
        {explorerLink && (
          <a
            href={`https://hashscan.io/${
              token ? "testnet/token" : "mainnet/account"
            }/${wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            (Ver en explorador)
          </a>
        )}
      </div>
    ) : (
      <div className="flex items-center gap-2 text-gray-500">
        <Reply className="rotate-90" size={16} />
        <span>No configurada</span>
      </div>
    )}
  </div>
);

export const InputCurrency: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">Meta de financiamiento</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-fiesta-primary"
    />
  </div>
);

export const BenefitsSection: React.FC<{
  benefits: string[];
  newBenefit: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onInputChange: (value: string) => void;
}> = ({ benefits, newBenefit, onAdd, onRemove, onInputChange }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Beneficios para patrocinadores
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={newBenefit}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ej: Acceso VIP, merchandising exclusivo..."
          className="flex-1 border rounded-lg p-3"
          onKeyPress={(e) => e.key === "Enter" && onAdd()}
        />
        <ButtonAnimated
          onClick={onAdd}
          disabled={!newBenefit.trim() || benefits.length >= 10}
          className="whitespace-nowrap"
        >
          Agregar
        </ButtonAnimated>
      </div>
    </div>

    {benefits.length > 0 && (
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
          >
            <span>{benefit}</span>
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700"
              aria-label="Eliminar beneficio"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const FundingStatus: React.FC<{
  current?: string;
  required: string;
  funded: boolean;
}> = ({ current, required, funded }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div>
      <p className="font-medium">Estado del fondeo</p>
      <p className="text-sm text-gray-500">
        {funded ? "Fondeo completo" : `Fondeo requerido: ${required}`}
      </p>
    </div>
    <div
      className={`flex items-center gap-2 ${
        funded ? "text-green-500" : "text-amber-500"
      }`}
    >
      {funded ? <Check size={20} /> : <Reply size={20} />}
      {current && <span className="font-mono">{current}</span>}
    </div>
  </div>
);
