/**
 * Fournisseurs OAuth : points d'accès officiels et périmètres minimaux.
 * Microsoft identity platform v2 + Microsoft Graph ; Google OAuth 2.0 + API Gmail/Agenda/Drive.
 */
export type Provider = "microsoft" | "google";

export interface ProviderConfig {
  id: Provider;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId?: string;
  clientSecret?: string;
  /** Paramètres supplémentaires de l'URL d'autorisation. */
  extraAuth: Record<string, string>;
}

export function providerConfig(p: Provider): ProviderConfig {
  if (p === "microsoft") {
    const tenant = process.env.MICROSOFT_TENANT_ID || "organizations";
    return {
      id: p,
      label: "Microsoft 365",
      authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      // Délégué, minimal : profil, courrier (lecture/brouillons/envoi), agenda, réunions Teams, fichiers de l'utilisateur
      scopes: ["openid", "email", "offline_access", "User.Read", "Mail.ReadWrite", "Mail.Send", "Calendars.ReadWrite", "OnlineMeetings.ReadWrite", "Files.ReadWrite"],
      clientId: process.env.MICROSOFT_CLIENT_ID || undefined,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || undefined,
      extraAuth: { response_mode: "query" },
    };
  }
  return {
    id: p,
    label: "Google Workspace",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/drive.file"],
    clientId: process.env.GOOGLE_CLIENT_ID || undefined,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || undefined,
    extraAuth: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  };
}

/** Le fournisseur peut-il être connecté (identifiants d'application + clé de chiffrement présents) ? */
export const providerReady = (p: Provider) => {
  const c = providerConfig(p);
  return Boolean(c.clientId && c.clientSecret && process.env.INTEGRATIONS_ENCRYPTION_KEY);
};

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const redirectUri = (p: Provider) => `${appUrl()}/api/integrations/${p}/callback`;
