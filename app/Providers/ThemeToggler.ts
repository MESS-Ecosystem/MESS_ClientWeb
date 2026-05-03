"use client";

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
//   localStorage.setItem("theme", isDark ? "dark" : "light");
}