import { useWallet } from "../context/WalletProvider.jsx"; // correct path

export default function Navbar() {
    const { walletAddress, connectWallet } = useWallet(); // use connectWallet, not setWalletAddress

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
