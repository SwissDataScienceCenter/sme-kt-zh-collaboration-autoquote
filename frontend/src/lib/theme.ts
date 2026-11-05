// Each key is the name of a CSS variable from styles.css, so the branding file stays the only place the brand colours are defined.
export const applyBrandColors = (brandColors: Record<string, string>): void => {
    Object.entries(brandColors).forEach(([variableName, color]) => document.documentElement.style.setProperty(`--${variableName}`, color));
};
