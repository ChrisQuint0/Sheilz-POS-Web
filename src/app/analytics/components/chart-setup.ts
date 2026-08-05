"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Polished default options matching the dashboard's premium look
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: "easeOutQuart" as const,
  },
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#826f69",
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 16,
        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
      },
    },
    tooltip: {
      backgroundColor: "#3a2b27",
      titleColor: "#f5ede8",
      bodyColor: "#f5ede8",
      borderColor: "rgba(194,69,106,0.15)",
      borderWidth: 0,
      padding: 12,
      cornerRadius: 8,
      boxPadding: 6,
      usePointStyle: true,
      boxWidth: 8,
      boxHeight: 8,
      titleFont: { size: 12, weight: "bold" as const, family: "'Plus Jakarta Sans', sans-serif" },
      bodyFont: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: "#826f69",
        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
      },
    },
    y: {
      grid: { color: "rgba(194,69,106,0.06)" },
      border: { display: false },
      ticks: {
        color: "#826f69",
        font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
      },
    },
  },
};

/**
 * Smart currency tick formatter that adapts to the data magnitude.
 * - Under 1,000: shows raw value (e.g., "₱500")
 * - 1,000 to 999,999: shows in thousands (e.g., "₱1.5k", "₱25k")
 * - 1,000,000+: shows in millions (e.g., "₱1.2M")
 * Avoids misleading labels like "₱0k" for small values.
 */
export function formatCurrencyTick(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `₱0`;

  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    // Millions: show 1 decimal if fractional, otherwise whole
    const m = num / 1_000_000;
    return m % 1 === 0 ? `₱${m}M` : `₱${m.toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    // Thousands: show 1 decimal if fractional, otherwise whole
    const k = num / 1_000;
    return k % 1 === 0 ? `₱${k}k` : `₱${k.toFixed(1)}k`;
  }

  // Under 1,000: show raw value, no decimals
  return `₱${Math.round(num)}`;
}

export const chartColors = {
  primary: "#c2456a",
  primaryLight: "rgba(194, 69, 106, 0.12)",
  secondary: "#e08a4f",
  secondaryLight: "rgba(224, 138, 79, 0.12)",
  chart3: "#4f9a5c",
  chart3Light: "rgba(79, 154, 92, 0.12)",
  chart4: "#e8839e",
  chart5: "#3a2b27",
  muted: "#fbe4ea",
  destructive: "#d6485e",
};
