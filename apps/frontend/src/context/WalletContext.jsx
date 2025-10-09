// src/context/WalletContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const WalletContext = createContext();

export function WalletProvider({ children }) {
    const [walletAddress, setWalletAddress] = useState(null);

    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            window.solana.connect({ onlyIfTrusted: true }).then((resp) => {
                setWalletAddress(resp.publicKey.toString());
            }).catch(() => { });
        }
    }, []);

    const connectWallet = async () => {
        try {
            const { solana } = window;
            if (!solana) return alert("Phantom not found");
            const response = await solana.connect();
            setWalletAddress(response.publicKey.toString());
        } catch (err) {
            console.error(err);
        }
    };

    const disconnectWallet = async () => {
        try {
            const { solana } = window;
            if (solana) await solana.disconnect();
            setWalletAddress(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    return useContext(WalletContext);
}
