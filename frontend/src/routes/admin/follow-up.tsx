import { createFileRoute } from "@tanstack/react-router";
import { FollowUpView } from "@/views/follow-up-view";

export const Route = createFileRoute("/admin/follow-up")({ component: FollowUpView });
