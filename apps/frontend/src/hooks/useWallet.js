import { useContext } from "react";
import WalletContext from "../context/WalletContext";

export function useWallet() {
    return useContext(WalletContext);
}
