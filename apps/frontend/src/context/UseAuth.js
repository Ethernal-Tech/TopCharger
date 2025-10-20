import { useContext } from "react";
import AuthContextInternal from "./AuthContext"; // default import

export const useAuth = () => useContext(AuthContextInternal);
