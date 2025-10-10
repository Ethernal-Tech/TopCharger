// src/components/LoginModal.jsx
export default function LoginModal({ isOpen, onClose, onGoogleSignIn, onWalletSignIn }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-80">
                <h2 className="text-xl font-bold mb-4">Sign in</h2>
                <button
                    onClick={onGoogleSignIn}
                    className="w-full bg-blue-500 text-white py-2 rounded mb-2 hover:bg-blue-600"
                >
                    Sign in with Google
                </button>
                <button
                    onClick={onWalletSignIn}
                    className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800"
                >
                    Sign in with Wallet
                </button>
                <button
                    onClick={onClose}
                    className="mt-4 text-gray-500 hover:underline"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
