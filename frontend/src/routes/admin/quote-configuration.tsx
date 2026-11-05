import { createFileRoute } from "@tanstack/react-router";
import { QuoteConfigurationView } from "@/views/quote-configuration-view";

export const Route = createFileRoute("/admin/quote-configuration")({ component: QuoteConfigurationView });
