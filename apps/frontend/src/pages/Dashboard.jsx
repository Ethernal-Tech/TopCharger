// src/pages/Dashboard.jsx
import Navbar from "../components/Navbar";

export default function Dashboard() {
    const BACKEND = "http://localhost:3000";

    return (
        <div
            className="min-h-screen relative bg-cover bg-center bg-fixed overflow-hidden"
            style={{ backgroundImage: "url('/bg-charger.png')" }}
        >
            {/* Soft overlay for readability */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            {/* Subtle floating shapes */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-400 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-500 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>

            {/* Content */}
            <div className="relative z-10">
                <main className="p-6 max-w-4xl mx-auto">
                    <section className="mb-6">
                        <h1 className="text-3xl font-bold text-green-900 mb-4">Welcome to TopCharger</h1>
                        <p className="text-green-900">
                            Explore charging stations, manage your account, and connect your wallet or Google account.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
}
