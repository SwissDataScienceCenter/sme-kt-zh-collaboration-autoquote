import { HeadContent, createRootRoute } from "@tanstack/react-router";

import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { APP_CONFIG } from "@/config";
import { RootLayout } from "@/views/root-layout";
import "../styles.css";

export const Route = createRootRoute({
    head: () => ({
        meta: [{ title: APP_CONFIG.name }, { name: "description", content: APP_CONFIG.description }],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <>
            <HeadContent />
            <RootLayout />
            <TanStackDevtools
                config={{
                    position: "bottom-right",
                }}
                plugins={[
                    {
                        name: "TanStack Router",
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                ]}
            />
        </>
    );
}
