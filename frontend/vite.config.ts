import { defineConfig, searchForWorkspaceRoot } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxying keeps the API on the same origin in development, so the session cookie works without CORS.
const BACKEND_URL = "http://127.0.0.1:8000";
// The branding is shared with the backend, so it lives outside the frontend folder.
const BRANDING_FOLDER = "../branding";

const config = defineConfig({
    resolve: { tsconfigPaths: true },
    plugins: [devtools(), tailwindcss(), tanstackRouter({ target: "react", autoCodeSplitting: true }), viteReact()],
    server: {
        proxy: {
            "/api": BACKEND_URL,
        },
        fs: {
            allow: [searchForWorkspaceRoot(process.cwd()), BRANDING_FOLDER],
        },
    },
});

export default config;
