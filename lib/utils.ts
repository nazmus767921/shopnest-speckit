import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatTaka(pricePaisa: number | null | undefined): string {
  // Handle null, undefined, NaN, and non-finite values gracefully
  if (
    pricePaisa == null ||
    typeof pricePaisa !== "number" ||
    !isFinite(pricePaisa) ||
    isNaN(pricePaisa)
  ) {
    return "৳0.00"
  }

  // Clamp negative values to 0 to prevent misleading display
  const safe = Math.max(0, pricePaisa)

  return (
    "৳" +
    (safe / 100).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}
