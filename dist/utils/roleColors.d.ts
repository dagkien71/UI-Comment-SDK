export interface RoleColor {
    bg: string;
    text: string;
    border: string;
}
export declare const ROLE_COLORS: Record<string, RoleColor>;
export declare function getRoleColor(role: string): RoleColor;
export declare function getRoleDisplayName(role: string): string;
