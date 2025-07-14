export interface RoleColor {
  bg: string;
  text: string;
  border: string;
}

export const ROLE_COLORS: Record<string, RoleColor> = {
  developer: {
    bg: "#dbeafe",
    text: "#1e40af",
    border: "#3b82f6",
  },
  designer: {
    bg: "#fef3c7",
    text: "#92400e",
    border: "#f59e0b",
  },
  "product-manager": {
    bg: "#dcfce7",
    text: "#166534",
    border: "#22c55e",
  },
  qa: {
    bg: "#fce7f3",
    text: "#be185d",
    border: "#ec4899",
  },
  stakeholder: {
    bg: "#e0e7ff",
    text: "#3730a3",
    border: "#6366f1",
  },
  other: {
    bg: "#f3f4f6",
    text: "#374151",
    border: "#6b7280",
  },
};

export function getRoleColor(role: string): RoleColor {
  return ROLE_COLORS[role] || ROLE_COLORS.other;
}

export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    developer: "Developer",
    designer: "Designer",
    "product-manager": "Product Manager",
    qa: "QA",
    stakeholder: "Stakeholder",
    other: "Other",
  };

  return displayNames[role] || "Other";
}
