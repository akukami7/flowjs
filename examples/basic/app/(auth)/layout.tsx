export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <div className="auth-layout">{children as React.ReactNode}</div>;
}
