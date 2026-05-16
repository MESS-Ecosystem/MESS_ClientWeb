'use client'

type Listener = () => void;
let listeners: Listener[] = [];
let token =
  typeof window !== "undefined"
    ? localStorage.getItem("messtoken")
    : null;
const notify = () => {
  listeners.forEach(listener => listener()); // update functions by component, those are meant to be called to update the ui
};
export const auth = {
  token: () => token,
  setToken: (newToken: string) => {
    token = newToken;
    localStorage.setItem("messtoken", newToken);
    notify();
  },
  clearToken: () => {
    token = null;
    localStorage.removeItem("messtoken");
    notify();
  },
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};