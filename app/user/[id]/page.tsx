
import UserPage from "@/components/UserPage";
import { users } from "@/lib/types/user";
import { notFound } from "next/navigation";

interface UserPageParams {
  params: Promise<{
    id: string;
  }>;
}


export default async function userProfilePage({ params }: UserPageParams) {
  const { id } = await params;
  const user = users.find((user) => user.id === id);

  if (!user) {
    notFound();
  }

  return <UserPage user={user} />;
}

