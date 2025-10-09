// src/components/GoogleSignInButton.jsx
const BACKEND = "http://localhost:3000";
const FRONTEND = "http://localhost:5173";

export default function GoogleSignInButton() {
    const signInWithGoogle = () => {
        const callbackUrl = encodeURIComponent(`${FRONTEND}/auth/callback`);
        window.location.href = `${BACKEND}/api/auth/signin/google?callbackUrl=${callbackUrl}`;
    };

    return (
        <button
            onClick={signInWithGoogle}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
            Sign in with Google
        </button>
    );
}
