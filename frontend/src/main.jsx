import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

/**
 * QueryClient configuration.
 *
 * - retry: 1  → retry once on failure, prevents hammering a broken API
 * - refetchOnWindowFocus: true  → re-validate stale data when user returns to tab
 * - staleTime set per-query in hooks (not globally) for fine-grained control
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0f172a",
              color: "#f1f5f9",
              fontSize: "13px",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              borderRadius: "10px",
              padding: "10px 14px",
              boxShadow: "0 4px 24px 0 rgb(0 0 0 / 0.18)",
            },
            success: {
              iconTheme: { primary: "#4ade80", secondary: "#0f172a" },
            },
            error: {
              iconTheme: { primary: "#f87171", secondary: "#0f172a" },
            },
          }}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
