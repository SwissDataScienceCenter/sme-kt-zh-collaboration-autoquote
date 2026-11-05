import { createFileRoute } from "@tanstack/react-router";
import { EntityExtractionView } from "@/views/entity-extraction-view";

export const Route = createFileRoute("/admin/entity-extraction")({ component: EntityExtractionView });
