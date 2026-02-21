import { auth, currentUser } from '@clerk/nextjs/server';

export default async function Dashboard() {
  const authObject = await auth();
  const userObject = await currentUser();

  console.log(authObject);
  console.log(userObject);
  return <div></div>;
}
