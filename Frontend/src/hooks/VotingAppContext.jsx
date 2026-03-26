/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useVotingApp } from "./useVotingApp";

const VotingAppContext = createContext(null);

export function VotingAppProvider({ children }) {
  const app = useVotingApp();
  return <VotingAppContext.Provider value={app}>{children}</VotingAppContext.Provider>;
}

export function useVotingAppContext() {
  const ctx = useContext(VotingAppContext);
  if (!ctx) throw new Error("useVotingAppContext must be used inside VotingAppProvider");
  return ctx;
}

