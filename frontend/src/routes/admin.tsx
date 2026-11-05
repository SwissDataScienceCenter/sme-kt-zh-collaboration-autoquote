import { createFileRoute } from "@tanstack/react-router";
import { AdminView } from "@/views/admin-view";

export const Route = createFileRoute("/admin")({ component: AdminView });
