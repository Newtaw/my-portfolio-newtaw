import React, { useState } from "react";

export default function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (task.trim() === "") return;
    setTasks([...tasks, { text: task, done: false }]);
    setTask("");
  };

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-purple-200/70 backdrop-blur-sm transition duration-300 hover:shadow-purple-300/80">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent">
            สิ่งที่ต้องทำวันนี้
          </h1>
        </div>

        <div className="mb-5 flex gap-2">
          <input
            type="text"
            placeholder="ระบุเรื่องที่จะทำ..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
          />
          <button
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-purple-600 hover:shadow-purple-300 active:translate-y-0"
            onClick={addTask}
          >
            เพิ่ม
          </button>
        </div>

        <ul className="space-y-3">
          {tasks.map((t, index) => (
            <li
              key={index}
              className={`flex items-center justify-between rounded-xl border p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                t.done
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50"
              }`}
            >
              <span
                onClick={() => toggleTask(index)}
                className={`flex-1 cursor-pointer text-sm transition ${
                  t.done
                    ? "text-emerald-500 line-through"
                    : "text-slate-700 hover:text-indigo-600"
                }`}
              >
                {t.text}
              </span>
              <button
                onClick={() => toggleTask(index)}
                className={`rounded-xl px-3 py-1 text-sm font-medium transition duration-200 hover:scale-105 ${
                  t.done
                    ? "bg-emerald-400 text-white shadow-md shadow-emerald-100"
                    : "bg-white text-indigo-600 shadow-sm hover:bg-indigo-100"
                }`}
              >
                {t.done ? "Done" : "Mark"}
              </button>
            </li>
          ))}
        </ul>

        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/50 p-5 text-center text-sm text-purple-400">
            เพิ่มงาน
          </div>
        )}
      </div>
    </div>
  );
}
