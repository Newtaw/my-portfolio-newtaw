import { useState } from "react";

export default function Counter()
{
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl mb-4">
        จำนวน : {count}
      </h1>
      <button
        onClick={() => setCount(count + 1)}
        className="bg-green-600 text-white px-4">
        เพิ่ม
      </button>
    </div>
  );
}
