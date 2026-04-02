'use client'

import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function (toast) {
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all mb-2 ${
              toast.variant === "destructive"
                ? "destructive group border-red-500/30 bg-red-500/10 text-red-500"
                : "border-slate-700 bg-slate-800 text-slate-100"
            }`}
          >
            <div className="grid gap-1">
              {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
              {toast.description && (
                <div className="text-sm opacity-90">{toast.description}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
