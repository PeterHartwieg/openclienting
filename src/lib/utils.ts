import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type OrgSizeTier = "Micro" | "Small" | "Medium" | "Large";

export function getOrgSizeTier(employeeCount: number | null): OrgSizeTier | null {
  if (employeeCount == null) return null;
  if (employeeCount < 10) return "Micro";
  if (employeeCount < 50) return "Small";
  if (employeeCount < 250) return "Medium";
  return "Large";
}
