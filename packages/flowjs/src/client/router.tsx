import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import type { ClientManifest, RouterState } from "./types.js";

// @ts-ignore
const RouterContext = createContext<{
    state: RouterState;
    navigate: (url: string, push?: boolean) => Promise<void>;
    isPending: boolean;
} | null>(null);

export function useRouter() {
    const ctx = useContext(RouterContext);
    if (!ctx) throw new Error("useRouter must be used within <Router>");
    return ctx;
}

export function Router({
    initialUrl,
    initialData,
    manifest,
}: {
    initialUrl: string;
    initialData: any;
    manifest: ClientManifest;
}) {
    const [state, setState] = useState<RouterState>({
        url: initialUrl,
        routeId: initialData?.routeId || "/",
        data: initialData?.data || {},
        pageParams: initialData?.params || {},
        PageComponent: null,
        LayoutComponents: [],
    });
    const [isPending, startTransition] = useTransition();

    // Rehydrate initial route components seamlessly on the client
    useEffect(() => {
        const loadInitial = async () => {
            const entry = manifest.routes[state.routeId];
            if (entry && !state.PageComponent) {
                const [pageMod, ...layoutMods] = await Promise.all([
                    entry.page(),
                    ...(entry.layouts || []).map((l) => l()),
                ]);
                setState((prev) => ({
                    ...prev,
                    PageComponent: pageMod.default,
                    LayoutComponents: layoutMods.map((m) => m.default),
                }));
            }
        };
        loadInitial();
    }, [manifest, state.routeId, state.PageComponent]);

    // History interaction (Back/Forward)
    useEffect(() => {
        const handlePopState = () => navigate(window.location.pathname, false);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [manifest]);

    const navigate = async (url: string, push = true) => {
        // Fetch data. Allows fetching customized path. Uses FlowJS format, but
        // can easily be changed to Nova's ?path= convention!
        const res = await fetch(`/__flow/data${url}`);
        if (!res.ok) {
            console.error(`Failed to navigate to ${url}`);
            return;
        }

        const { routeId, data, params } = await res.json();
        const entry = manifest.routes[routeId];
        let PageComponent = null;
        let LayoutComponents: any[] = [];

        if (entry) {
            const [pageMod, ...layoutMods] = await Promise.all([
                entry.page(),
                ...(entry.layouts || []).map((l) => l()),
            ]);
            PageComponent = pageMod.default;
            LayoutComponents = layoutMods.map((m) => m.default);
        }

        if (push) {
            window.history.pushState(null, "", url);
        }

        // Start React Transition for seamless UI update + Suspense usage if desired
        startTransition(() => {
            setState({ url, routeId, data, pageParams: params, PageComponent, LayoutComponents });
        });
    };

    return (
        <RouterContext.Provider value={{ state, navigate, isPending }}>
            {state.PageComponent ? <RouterRenderer state={state} /> : null}
        </RouterContext.Provider>
    );
}

function RouterRenderer({ state }: { state: RouterState }) {
    // Reconstruct the nested layout tree preserving React Element stability.
    // Unchanged hierarchical Layout wrappers will preserve DOM, state, and identity cleanly!
    let tree = <state.PageComponent data={state.data} />;

    for (let i = state.LayoutComponents.length - 1; i >= 0; i--) {
        const Layout = state.LayoutComponents[i];
        // Note: Ideally, layout arrays need a stable key based on module path 
        // to prevent unintentional remounts, but using index `i` is a fast proxy
        tree = <Layout key={`layout-${i}`}>{tree}</Layout>;
    }

    return tree;
}
