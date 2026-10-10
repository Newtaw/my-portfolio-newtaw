import { useRef, useState } from "react";

const TASKS_STORAGE_KEY = "todo-list-v1";
const emptyDraft = { title: "", details: "", dueDate: "" };

function isValidTasks(tasks) {
  if (!Array.isArray(tasks)) return false;

  const ids = new Set();
  return tasks.every((task) => {
    const validTask =
      task &&
      typeof task.id === "string" &&
      task.id.length > 0 &&
      !ids.has(task.id) &&
      typeof task.title === "string" &&
      task.title.trim().length > 0 &&
      task.title.length <= 120 &&
      typeof task.details === "string" &&
      task.details.length <= 500 &&
      typeof task.dueDate === "string" &&
      (task.dueDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) &&
      typeof task.completed === "boolean";

    if (validTask) ids.add(task.id);
    return validTask;
  });
}

function readSavedTasks() {
  try {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!saved) return { tasks: [], savedSnapshot: null, message: "" };

    const tasks = JSON.parse(saved);
    if (!isValidTasks(tasks)) {
      return {
        tasks: [],
        savedSnapshot: null,
        message: "ข้อมูลรายการที่บันทึกไว้ไม่ถูกต้อง จึงไม่ได้โหลดข้อมูล",
      };
    }

    return { tasks, savedSnapshot: saved, message: "" };
  } catch (error) {
    return {
      tasks: [],
      savedSnapshot: null,
      message: `อ่านข้อมูลจาก Local Storage ไม่สำเร็จ: ${String(error)}`,
    };
  }
}

export default function TodoList() {
  const [initialData] = useState(readSavedTasks);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [savedSnapshot, setSavedSnapshot] = useState(initialData.savedSnapshot);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(initialData.message);
  const importFileRef = useRef(null);
  const hasUnsavedChanges =
    savedSnapshot === null ? tasks.length > 0 : JSON.stringify(tasks) !== savedSnapshot;

  const handleSubmit = (event) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    if (editingId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingId ? { ...task, ...draft, title } : task
        )
      );
      setMessage("แก้ไขรายการแล้ว อย่าลืมกดบันทึก");
    } else {
      setTasks((currentTasks) => [
        ...currentTasks,
        { ...draft, title, id: crypto.randomUUID(), completed: false },
      ]);
      setMessage("เพิ่มรายการแล้ว อย่าลืมกดบันทึก");
    }

    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleEdit = (task) => {
    setDraft({ title: task.title, details: task.details, dueDate: task.dueDate });
    setEditingId(task.id);
    setMessage("");
  };

  const handleSave = () => {
    try {
      const snapshot = JSON.stringify(tasks);
      localStorage.setItem(TASKS_STORAGE_KEY, snapshot);
      setSavedSnapshot(snapshot);
      setMessage("บันทึกรายการไว้ในเครื่องนี้แล้ว");
    } catch (error) {
      setMessage(`บันทึกข้อมูลลง Local Storage ไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleDeleteSave = () => {
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
      setTasks([]);
      setSavedSnapshot(null);
      setDraft(emptyDraft);
      setEditingId(null);
      setMessage("ลบรายการที่บันทึกไว้แล้ว");
    } catch (error) {
      setMessage(`ลบข้อมูลที่บันทึกไว้ไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleExport = () => {
    try {
      const backup = new Blob([JSON.stringify(tasks, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(backup);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
      setMessage("ดาวน์โหลดไฟล์สำรองแล้ว");
    } catch (error) {
      setMessage(`ส่งออกไฟล์สำรองไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.confirm("นำเข้าแล้วจะแทนที่รายการปัจจุบันและเซฟเดิม ต้องการดำเนินการต่อหรือไม่?")) {
        return;
      }

      const importedTasks = JSON.parse(await file.text());
      if (!isValidTasks(importedTasks)) {
        setMessage("ไฟล์สำรองไม่ถูกต้องหรือมีข้อมูลไม่ครบ จึงไม่ได้นำเข้า");
        return;
      }

      const snapshot = JSON.stringify(importedTasks);
      localStorage.setItem(TASKS_STORAGE_KEY, snapshot);
      setTasks(importedTasks);
      setSavedSnapshot(snapshot);
      setDraft(emptyDraft);
      setEditingId(null);
      setMessage(`นำเข้ารายการ ${importedTasks.length} งานสำเร็จ`);
    } catch (error) {
      setMessage(`นำเข้าไฟล์สำรองไม่สำเร็จ: ${String(error)}`);
    } finally {
      event.target.value = "";
    }
  };

  const toggleCompleted = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    setMessage("เปลี่ยนสถานะแล้ว อย่าลืมกดบันทึก");
  };

  const deleteTask = (id) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    setMessage("ลบรายการแล้ว อย่าลืมกดบันทึก");
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl md:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-700">
          รายการสิ่งที่ต้องทำ
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          จัดการงาน รายละเอียด และกำหนดวันส่ง พร้อมบันทึกไว้ในเครื่อง
        </p>
      </header>

      {message && (
        <p
          role={message.includes("ไม่สำเร็จ") || message.includes("ไม่ถูกต้อง") ? "alert" : "status"}
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.includes("ไม่สำเร็จ") || message.includes("ไม่ถูกต้อง")
              ? "bg-red-50 text-red-700"
              : "bg-indigo-50 text-indigo-700"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4">
        <label className="block text-sm font-medium text-gray-700" htmlFor="task-title">
          ชื่องาน
        </label>
        <input
          id="task-title"
          required
          maxLength={120}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="เช่น ทำการบ้านวิชา React"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <label className="block text-sm font-medium text-gray-700" htmlFor="task-details">
          รายละเอียด (ไม่บังคับ)
        </label>
        <textarea
          id="task-details"
          rows="2"
          maxLength={500}
          value={draft.details}
          onChange={(event) => setDraft({ ...draft, details: event.target.value })}
          placeholder="จดข้อมูลเพิ่มเติม..."
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <label className="block text-sm font-medium text-gray-700" htmlFor="task-due-date">
          กำหนดส่ง (ไม่บังคับ)
        </label>
        <input
          id="task-due-date"
          type="date"
          value={draft.dueDate}
          onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มงาน"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setDraft(emptyDraft);
                setEditingId(null);
                setMessage("");
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          ทั้งหมด {tasks.length} งาน · เสร็จแล้ว {tasks.filter((task) => task.completed).length} งาน
          {hasUnsavedChanges && <span className="ml-2 text-amber-700">• มีรายการที่ยังไม่บันทึก</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
          >
            ส่งออกไฟล์สำรอง
          </button>
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            นำเข้าไฟล์สำรอง
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="sr-only"
            aria-label="เลือกไฟล์สำรองรายการงาน"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            บันทึกทั้งหมด
          </button>
          <button
            type="button"
            onClick={handleDeleteSave}
            disabled={savedSnapshot === null}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ลบข้อมูลที่บันทึก
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        ไฟล์สำรองจะรวมรายการที่แสดงอยู่ตอนนี้ การนำเข้าจะแทนที่รายการและเซฟเดิม
      </p>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบน
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`rounded-xl border p-4 ${
                task.completed ? "border-emerald-200 bg-emerald-50" : "border-gray-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleCompleted(task.id)}
                      className="mt-1 accent-indigo-600"
                    />
                    <span
                      className={`font-semibold ${
                        task.completed ? "text-gray-500 line-through" : "text-gray-800"
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>
                  {task.details && (
                    <p className="ml-6 mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {task.details}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="ml-6 mt-2 text-xs text-gray-500">
                      กำหนดส่ง: {task.dueDate}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(task)}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                  >
                    ลบงาน
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
