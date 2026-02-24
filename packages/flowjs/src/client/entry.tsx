import React from "react";
import { hydrateRoot } from "react-dom/client";
import { Router } from "./router.js";
import type { ClientManifest } from "./types.js";

export function hydrate(manifest: ClientManifest) {
    const rootEl = document.getElementById("root");
    if (!rootEl) {
        throw new Error("Could not find root element to hydrate");
    }

    const scriptEl = document.getElementById("FLOW_DATA");
    const initialData = scriptEl ? JSON.parse(scriptEl.textContent || "{}") : {};
    const initialUrl = window.location.pathname;

    hydrateRoot(
        rootEl,
        <Router
            initialUrl={initialUrl}
            initialData={initialData}
            manifest={manifest}
        />
    );
}
