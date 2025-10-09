// src/components/Navbar.jsx
import { useWallet } from "../context/WalletContext.jsx";

export default function Navbar() {
    const { walletAddress, setWalletAddress } = useWallet();

    const connectWallet = async () => {
        const { solana } = window;
        if (!solana) return alert("Phantom wallet not found!");
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
    };

    return (
        <nav className="p-4 bg-green-700 text-white flex justify-between">
            <div>⚡ TopCharger</div>
            <div>
                {walletAddress ? (
                    walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
                ) : (
                    <button onClick={connectWallet}>Connect Wallet</button>
                )}
            </div>
        </nav>
    );
}
