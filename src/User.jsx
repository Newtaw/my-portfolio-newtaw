import { useEffect, useState } from "react";
export default function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">กำลังโหลดข้อมูล...</p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">รายชื่อผู้ใช้งาน</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {users.map((user) => (
          <li
            key={user.id}
            className="p-4 border rounded-lg shadow hover:bg-gray-50 transition"
          >
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-500 text-sm">{user.phone}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}