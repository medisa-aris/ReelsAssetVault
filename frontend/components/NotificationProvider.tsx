"use client";

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import { ToastNotification } from "@carbon/react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NotificationKind = "error" | "success" | "warning" | "info";

interface Toast {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle?: string;
}

type Action =
  | { type: "add"; payload: Toast }
  | { type: "remove"; id: string };

interface NotificationContextValue {
  notify: (kind: NotificationKind, title: string, subtitle?: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export function useNotification() {
  return useContext(NotificationContext);
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "add":
      return [...state, action.payload];
    case "remove":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const notify = useCallback(
    (kind: NotificationKind, title: string, subtitle?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      dispatch({ type: "add", payload: { id, kind, title, subtitle } });
      setTimeout(() => dispatch({ type: "remove", id }), 5000);
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Fixed toast container — top-right, above Carbon Header (z-index 8000) */}
      <div
        style={{
          position: "fixed",
          top: "3.5rem",
          right: "1rem",
          zIndex: 9000,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "all" }}>
            <ToastNotification
              kind={t.kind}
              title={t.title}
              subtitle={t.subtitle}
              onCloseButtonClick={() => dispatch({ type: "remove", id: t.id })}
              timeout={5000}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
