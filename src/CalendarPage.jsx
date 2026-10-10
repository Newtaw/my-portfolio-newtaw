import { useEffect, useState } from "react";

const TASKS_STORAGE_KEY = "todo-list-v1";
const weekDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function readSavedTasks() {
  try {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!saved) return { tasks: [], error: "" };

    const parsed = JSON.parse(saved);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (task) =>
          task &&
          typeof task.title === "string" &&
          typeof task.dueDate === "string" &&
          typeof task.completed === "boolean"
      )
    ) {
      return { tasks: [], error: "ข้อมูลรายการงานไม่ถูกต้อง จึงไม่สามารถแสดงในปฏิทินได้" };
    }

    return {
      tasks: parsed.filter((task) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) return false;
        const [year, month, day] = task.dueDate.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        );
      }),
      error: "",
    };
  } catch (error) {
    return { tasks: [], error: `อ่านรายการงานไม่สำเร็จ: ${String(error)}` };
  }
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [taskData, setTaskData] = useState(readSavedTasks);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const refreshTasks = (event) => {
      if (!event || event.key === null || event.key === TASKS_STORAGE_KEY) {
        setTaskData(readSavedTasks());
      }
    };
    window.addEventListener("storage", refreshTasks);
    window.addEventListener("focus", refreshTasks);
    return () => {
      window.removeEventListener("storage", refreshTasks);
      window.removeEventListener("focus", refreshTasks);
    };
  }, []);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = new Date(year, month, 1).getDay();
  const calendarCellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const tasksByDate = new Map();

  taskData.tasks.forEach((task) => {
    if (!task.dueDate) return;
    const dayTasks = tasksByDate.get(task.dueDate) ?? [];
    dayTasks.push(task);
    tasksByDate.set(task.dueDate, dayTasks);
  });

  const monthLabel = new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const changeMonth = (offset) => {
    setVisibleMonth(new Date(year, month + offset, 1));
  };

  return (
    <section className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-xl md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700">ปฏิทินกำหนดส่ง</h1>
          <p className="mt-1 text-sm text-gray-500">
            แสดงงานที่บันทึกไว้และมีวันกำหนดส่ง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="เดือนก่อนหน้า"
            className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
          >
            ←
          </button>
          <h2 aria-live="polite" className="min-w-36 text-center text-lg font-semibold text-gray-800">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="เดือนถัดไป"
            className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => {
              const currentDate = new Date();
              setVisibleMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
            }}
            className="rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
          >
            วันนี้
          </button>
        </div>
      </header>

      {taskData.error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {taskData.error}
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-sm font-semibold text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: calendarCellCount }, (_, cellIndex) => {
              const day = cellIndex - leadingDays + 1;
              const isInMonth = day >= 1 && day <= daysInMonth;
              if (!isInMonth) {
                return (
                  <div
                    key={`empty-${cellIndex}`}
                    aria-hidden="true"
                    className="min-h-28 border-b border-r border-gray-200 bg-gray-50/60"
                  />
                );
              }

              const dateKey = toDateKey(year, month, day);
              const dayTasks = tasksByDate.get(dateKey) ?? [];
              const isToday = dateKey === todayKey;

              return (
                <div
                  key={dateKey}
                  className={`min-h-28 border-b border-r border-gray-200 p-2 ${
                    isToday ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday ? "bg-indigo-600 font-bold text-white" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                  <ul className="space-y-1">
                    {dayTasks.map((task) => (
                      <li
                        key={task.id}
                        title={task.title}
                        className={`truncate rounded px-1.5 py-1 text-xs ${
                          task.completed
                            ? "bg-emerald-50 text-emerald-800 line-through"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!taskData.error && taskData.tasks.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
          ยังไม่มีงานที่บันทึกไว้ ไปที่หน้า “สิ่งที่ต้องทำ” เพื่อเพิ่มงานและกำหนดส่ง
        </p>
      )}
      {!taskData.error && taskData.tasks.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          แสดงจากงานที่บันทึกในเครื่องนี้เท่านั้น หากแก้ไขงานให้กดบันทึกก่อน ปฏิทินจึงจะแสดงข้อมูลล่าสุด
        </p>
      )}
    </section>
  );
}
