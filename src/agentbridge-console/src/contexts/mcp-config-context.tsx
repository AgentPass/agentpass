import React, { createContext, useContext, useState } from "react";

export interface NewMcpServerDetails {
  serverName: string;
  description: string;
  fileContent: string;
}

interface ServerImportContextType {
  newMcpServerDetails: NewMcpServerDetails | null;
  setNewMcpServerDetails: (config: NewMcpServerDetails | null) => void;
}

const ServerImportContext = createContext<ServerImportContextType>({
  newMcpServerDetails: null,
  setNewMcpServerDetails: () => {
    //empty
  },
});

export const useServerImport = () => useContext(ServerImportContext);

export const ServerImportProvider = ({ children }: { children: React.ReactNode }) => {
  const [newMcpServerDetails, setNewMcpServerDetails] = useState<NewMcpServerDetails | null>(null);

  return (
    <ServerImportContext.Provider value={{ newMcpServerDetails, setNewMcpServerDetails }}>
      {children}
    </ServerImportContext.Provider>
  );
};
