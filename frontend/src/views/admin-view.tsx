import type { FunctionComponent } from "react";
import { Outlet } from "@tanstack/react-router";
import { AdminModulesNav } from "@/components/admin/admin-modules-nav";

export const AdminView: FunctionComponent = () => {
    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <AdminModulesNav />
            <Outlet />
        </div>
    );
};
