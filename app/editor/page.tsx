import { getProjects } from "@/lib/projects";
import { EditorView } from "./editor-view";

export default async function EditorPage() {
  const { owned, shared } = await getProjects();

  return <EditorView ownedProjects={owned} sharedProjects={shared} />;
}
