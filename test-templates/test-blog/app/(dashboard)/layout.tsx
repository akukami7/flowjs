import * as React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ padding: "1.5rem", background: "#fafafa", border: "1px solid #eee", borderRadius: "8px" }}>
            <h2 style={{ margin: 0, color: '#333' }}>Admin Dashboard Pattern</h2>
            <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
            {children}
        </div>
    );
}
