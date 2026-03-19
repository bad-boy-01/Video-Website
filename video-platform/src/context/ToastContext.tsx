"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ t, onRemove }: { t: ToastMessage; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const config = {
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
    error: { bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertCircle className="w-5 h-5 text-red-400" /> },
    info: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: <Info className="w-5 h-5 text-indigo-400" /> },
  };

  const style = config[t.type];

  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-xl border ${style.bg} ${style.border} p-4 pr-12 shadow-2xl backdrop-blur-xl relative transition-all duration-300 animate-in slide-in-from-right-8 fade-in`}>
      {style.icon}
      <p className="text-sm font-semibold text-white">{t.message}</p>
      <button onClick={onRemove} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
