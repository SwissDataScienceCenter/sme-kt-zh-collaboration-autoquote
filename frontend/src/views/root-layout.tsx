import type { FunctionComponent } from "react";
import { Outlet } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { ExtractionProvider } from "@/hooks/useExtraction";

export const RootLayout: FunctionComponent = () => {
    return (
        <ExtractionProvider>
            <div className="min-h-screen">
                <Header />
                <main className="page-container pt-8 pb-16">
                    <Outlet />
                </main>
            </div>
        </ExtractionProvider>
    );
};
