'use client';

export default function Home() {
  const createUser = async () => {
    const res = await fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', name: 'Alice' }),
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div>
      <button onClick={createUser}>Create User</button>
    </div>
  );
}
