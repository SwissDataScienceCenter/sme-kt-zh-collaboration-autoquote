import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { BRAND_COLORS } from "@/config";
import { initTranslation } from "@/lib/lang/i18n";
import { applyBrandColors } from "@/lib/theme";
import { routeTree } from "@/routeTree.gen";

initTranslation();
applyBrandColors(BRAND_COLORS);

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const ROOT_ELEMENT_ID = "app";

const rootElement = document.getElementById(ROOT_ELEMENT_ID);

if (rootElement === null) {
    throw new Error(`Root element #${ROOT_ELEMENT_ID} not found`);
}

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<RouterProvider router={router} />);
}
