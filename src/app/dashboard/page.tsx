// TODO : This is a demo page for testing purposes, not intended for production use.
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  // Get the auth object and the current user object
  const authObject = await auth();
  //Get the current user object, which contains information about the authenticated user
  const userObject = await currentUser();

  console.log(authObject);
  console.log(userObject);
  return <div></div>;
}
