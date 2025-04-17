import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAccountId = (accountId?: string | null) => {
  if (!accountId) return "";
  const parts = accountId.split(".");
  if (parts.length < 3) return accountId;
  return `${parts[0].slice(0, 5)}...${parts[2].slice(-4)}`;
};

export const formatHbar = (amount: number) => {
  return (
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " ℏ"
  );
};
