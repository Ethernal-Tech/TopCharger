import { useContext } from "react";
import WalletContext from "../context/WalletContext.jsx";

export function useWallet() {
    return useContext(WalletContext);
}
