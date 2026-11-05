import { createFileRoute } from "@tanstack/react-router";
import { PlaygroundView } from "@/views/playground-view";

export const Route = createFileRoute("/")({ component: PlaygroundView });
