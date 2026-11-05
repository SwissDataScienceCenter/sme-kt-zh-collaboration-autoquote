import branding from "../../branding/branding.json";
import logoUrl from "../../branding/logo.png";

export const APP_CONFIG = {
    name: branding.name,
    description: branding.description,
    logo: logoUrl,
    logoAlt: branding.logoAlt,
};

export const BRAND_COLORS = branding.colors;
