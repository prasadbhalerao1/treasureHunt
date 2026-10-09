import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { DEFAULT_SETTINGS } from "../utils/constants";

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  refreshSettings: () => {},
});

// Loads the public (branding) settings once and keeps the tab title in sync
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const refreshSettings = async () => {
    try {
      const { data } = await api.get("/settings/public");
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {
      // keep defaults when the API is unreachable
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    document.title = settings.eventName;
  }, [settings.eventName]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
