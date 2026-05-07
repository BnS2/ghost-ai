import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/editor");
  } else {
    redirect("/sign-in");
  }

  // This will never be reached but satisfies the component return
  return null;
}
