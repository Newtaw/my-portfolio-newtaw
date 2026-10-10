import { useRef, useState } from "react";

const STORAGE_KEY = "game-journal-v1";
const emptyDraft = {
  title: "",
  platform: "",
  status: "เล่นจบแล้ว",
  rating: "",
  review: "",
};
const gameStatuses = ["กำลังเล่น", "เล่นจบแล้ว", "อยากเล่น"];

function isValidGames(games) {
  if (!Array.isArray(games)) return false;

  const ids = new Set();
  return games.every((game) => {
    const validGame =
      game &&
      typeof game.id === "string" &&
      game.id.length > 0 &&
      !ids.has(game.id) &&
      typeof game.title === "string" &&
      game.title.trim().length > 0 &&
      game.title.length <= 100 &&
      typeof game.platform === "string" &&
      game.platform.length <= 60 &&
      gameStatuses.includes(game.status) &&
      (game.rating === null ||
        (Number.isInteger(game.rating) && game.rating >= 1 && game.rating <= 5)) &&
      typeof game.review === "string" &&
      game.review.length <= 1000;

    if (validGame) ids.add(game.id);
    return validGame;
  });
}

function readSavedGames() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { games: [], savedSnapshot: null, message: "" };

    const games = JSON.parse(saved);
    if (!isValidGames(games)) {
      return {
        games: [],
        savedSnapshot: null,
        message: "ข้อมูลบันทึกเกมไม่ถูกต้อง จึงไม่ได้โหลดข้อมูล",
      };
    }

    return { games, savedSnapshot: saved, message: "" };
  } catch (error) {
    return {
      games: [],
      savedSnapshot: null,
      message: `อ่านข้อมูลที่บันทึกไว้ไม่สำเร็จ: ${String(error)}`,
    };
  }
}

export default function GameJournal() {
  const [initialData] = useState(readSavedGames);
  const [games, setGames] = useState(initialData.games);
  const [savedSnapshot, setSavedSnapshot] = useState(initialData.savedSnapshot);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(initialData.message);
  const importFileRef = useRef(null);
  const hasUnsavedChanges =
    savedSnapshot === null ? games.length > 0 : JSON.stringify(games) !== savedSnapshot;

  const handleSubmit = (event) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    const gameData = {
      ...draft,
      title,
      platform: draft.platform.trim(),
      rating: draft.rating === "" ? null : Number(draft.rating),
      review: draft.review.trim(),
    };

    if (editingId) {
      setGames((currentGames) =>
        currentGames.map((game) =>
          game.id === editingId ? { ...game, ...gameData } : game
        )
      );
      setMessage("แก้ไขบันทึกแล้ว อย่าลืมกดบันทึก");
    } else {
      setGames((currentGames) => [
        ...currentGames,
        { ...gameData, id: crypto.randomUUID() },
      ]);
      setMessage("เพิ่มเกมแล้ว อย่าลืมกดบันทึก");
    }

    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleSave = () => {
    try {
      const snapshot = JSON.stringify(games);
      localStorage.setItem(STORAGE_KEY, snapshot);
      setSavedSnapshot(snapshot);
      setMessage("บันทึกสมุดเกมไว้ในเครื่องนี้แล้ว");
    } catch (error) {
      setMessage(`บันทึกสมุดเกมไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleDeleteSave = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setGames([]);
      setSavedSnapshot(null);
      setDraft(emptyDraft);
      setEditingId(null);
      setMessage("ลบสมุดเกมที่บันทึกไว้แล้ว");
    } catch (error) {
      setMessage(`ลบข้อมูลที่บันทึกไว้ไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleExport = () => {
    try {
      const backup = new Blob([JSON.stringify(games, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(backup);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `game-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
      setMessage("ดาวน์โหลดไฟล์สำรองสมุดเกมแล้ว");
    } catch (error) {
      setMessage(`ส่งออกไฟล์สำรองไม่สำเร็จ: ${String(error)}`);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedGames = JSON.parse(await file.text());
      if (!isValidGames(importedGames)) {
        setMessage("ไฟล์สำรองไม่ถูกต้องหรือมีข้อมูลไม่ครบ จึงไม่ได้นำเข้า");
        return;
      }

      if (!window.confirm("นำเข้าแล้วจะแทนที่รายการเกมปัจจุบันและเซฟเดิม ต้องการดำเนินการต่อหรือไม่?")) {
        return;
      }

      const snapshot = JSON.stringify(importedGames);
      localStorage.setItem(STORAGE_KEY, snapshot);
      setGames(importedGames);
      setSavedSnapshot(snapshot);
      setDraft(emptyDraft);
      setEditingId(null);
      setMessage(`นำเข้าบันทึกเกม ${importedGames.length} รายการสำเร็จ`);
    } catch (error) {
      setMessage(`นำเข้าไฟล์สำรองไม่สำเร็จ: ${String(error)}`);
    } finally {
      event.target.value = "";
    }
  };

  const handleEdit = (game) => {
    setDraft({
      title: game.title,
      platform: game.platform,
      status: game.status,
      rating: game.rating === null ? "" : String(game.rating),
      review: game.review,
    });
    setEditingId(game.id);
    setMessage("");
  };

  const handleDeleteGame = (id) => {
    setGames((currentGames) => currentGames.filter((game) => game.id !== id));
    setMessage("ลบเกมแล้ว อย่าลืมกดบันทึก");
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl md:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-700">สมุดบันทึกเกม</h1>
        <p className="mt-2 text-sm text-gray-500">
          เก็บเกมที่เล่น แพลตฟอร์ม สถานะ คะแนน และรีวิวส่วนตัว
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
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="game-title">
            ชื่อเกม
          </label>
          <input
            id="game-title"
            required
            maxLength={100}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="เช่น Stardew Valley"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="game-platform">
              แพลตฟอร์ม
            </label>
            <input
              id="game-platform"
              maxLength={60}
              value={draft.platform}
              onChange={(event) => setDraft({ ...draft, platform: event.target.value })}
              placeholder="เช่น PC, PS5"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="game-status">
              สถานะ
            </label>
            <select
              id="game-status"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {gameStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="game-rating">
              คะแนน (1–5)
            </label>
            <select
              id="game-rating"
              value={draft.rating}
              onChange={(event) => setDraft({ ...draft, rating: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">ยังไม่ให้คะแนน</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} / 5</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="game-review">
            รีวิวหรือบันทึก
          </label>
          <textarea
            id="game-review"
            rows="3"
            maxLength={1000}
            value={draft.review}
            onChange={(event) => setDraft({ ...draft, review: event.target.value })}
            placeholder="ชอบอะไรในเกมนี้ หรืออยากจำอะไรไว้..."
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มเกม"}
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
          บันทึกไว้ {games.length} เกม
          {hasUnsavedChanges && <span className="ml-2 text-amber-700">• มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
          >
            ส่งออกไฟล์เซฟ
          </button>
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            นำเข้าไฟล์เซฟ
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="sr-only"
            aria-label="เลือกไฟล์เซฟสมุดเกม"
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
            ลบเซฟ
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        ส่งออกจะรวมรายการปัจจุบันแม้ยังไม่ได้กดบันทึก การนำเข้าจะแทนที่รายการและเซฟเดิม
      </p>

      {games.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          ยังไม่มีเกมในสมุด เพิ่มเกมแรกของคุณด้านบน
        </p>
      ) : (
        <ul className="space-y-3">
          {games.map((game) => (
            <li key={game.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">{game.title}</h2>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                      {game.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {game.platform || "ไม่ระบุแพลตฟอร์ม"}
                    {game.rating !== null && (
                      <span className="ml-3 font-medium text-amber-600">
                        คะแนน {game.rating}/5
                      </span>
                    )}
                  </p>
                  {game.review && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                      {game.review}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(game)}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGame(game.id)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
                  >
                    ลบเกม
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
