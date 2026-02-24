import * as React from "react";

export const meta = {
    title: "Admin Dashboard"
};

export default function DashboardPage() {
    return (
        <div>
            <h3>Overview</h3>
            <p>This is a protected dashboard area seamlessly nested inside a route group layout (`(dashboard)`). Notice the URL remains `/dashboard` autonomously masking the group logic cleanly!</p>
        </div>
    );
}
