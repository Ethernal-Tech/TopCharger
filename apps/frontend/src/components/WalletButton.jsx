import { useState } from "react";
export default function WalletButton({ onConnect }) {
    const [walletAddress, setWalletAddress] = useState(null);

    const connectWallet = async () => {
        const { solana } = window;
        if (solana) {
            try {
                const response = await solana.connect();
                setWalletAddress(response.publicKey.toString());
                if (onConnect) onConnect(response.publicKey.toString());
            } catch {
                console.error("User rejected connection");
            }
        } else {
            alert("Phantom wallet not found.");
        }
    };

    return walletAddress ? (
        <span>{walletAddress}</span>
    ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
    );
}
