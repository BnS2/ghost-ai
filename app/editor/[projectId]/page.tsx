import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { checkProjectAccess, getIdentity } from "@/lib/project-access";
import { getProjects } from "@/lib/projects";
import { WorkspaceView } from "./workspace-view";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const identity = await getIdentity();
  if (!identity) redirect("/sign-in");

  const { projectId } = await params;
  const project = await checkProjectAccess(projectId);

  if (!project) {
    return <AccessDenied />;
  }

  const { owned, shared } = await getProjects();

  return <WorkspaceView project={project} ownedProjects={owned} sharedProjects={shared} />;
}
