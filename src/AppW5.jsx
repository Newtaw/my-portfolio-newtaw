import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes} from "react-router-dom";
import Home from "./Home.jsx";
import Page1 from "./Page1.jsx";
import Page2 from "./Page2.jsx";
import TodoList from "./AppW4.jsx";
import GameJournal from "./GameJournal.jsx";
import CalendarPage from "./CalendarPage.jsx";

function readThemePreference() {
  try {
    const savedTheme = localStorage.getItem("portfolio-theme");
    return {
      theme: savedTheme === "dark" ? "dark" : "light",
      error: "",
    };
  } catch (error) {
    return {
      theme: "light",
      error: `อ่านการตั้งค่าธีมไม่สำเร็จ: ${String(error)}`,
    };
  }
}

export default function App() {
  const [themeState, setThemeState] = useState(readThemePreference);
  const { theme, error: themeError } = themeState;

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("portfolio-theme", nextTheme);
      setThemeState({ theme: nextTheme, error: "" });
    } catch (error) {
      setThemeState({
        theme: nextTheme,
        error: `บันทึกการตั้งค่าธีมไม่สำเร็จ: ${String(error)}`,
      });
    }
  };

  return (
    <div
      className="app-shell flex min-h-screen flex-col font-sans text-gray-800 bg-gray-50"
      data-theme={theme}
    >

      <header className="px-4 py-7 bg-white border-b border-gray-200 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 md:flex-row md:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600">
            Game Portfolio
          </h1>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-base font-medium text-gray-600">
            <Link to="/" className="transition hover:text-indigo-500">Home</Link>
            <Link to="/page1" className="transition hover:text-indigo-500">Game Projects</Link>
            <Link to="/page2" className="transition hover:text-indigo-500">About</Link>
            <Link to="/tasks" className="transition hover:text-indigo-500">สิ่งที่ต้องทำ</Link>
            <Link to="/calendar" className="transition hover:text-indigo-500">ปฏิทิน</Link>
            <Link to="/games" className="transition hover:text-indigo-500">บันทึกเกม</Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "เปลี่ยนเป็นโหมดมืด" : "เปลี่ยนเป็นโหมดสว่าง"}
              aria-pressed={theme === "dark"}
              className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              {theme === "light" ? "🌙 โหมดมืด" : "☀️ โหมดสว่าง"}
            </button>
          </nav>
        </div>
      </header>

      {themeError && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {themeError}
        </p>
      )}

      <main className="flex items-center justify-center flex-grow p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/tasks" element={<TodoList />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/games" element={<GameJournal />} />
          <Route path="/exercise" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>

      <footer className="py-8 bg-white border-t border-gray-200">
        <div className="px-4 mx-auto text-center max-w-7xl">
          <p className="text-sm tracking-widest text-gray-400 uppercase">
            Game Portfolio © 2026
          </p>
        </div>
      </footer>

    </div>
  )
}