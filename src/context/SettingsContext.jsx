import { createContext, useContext, useState } from 'react';

export const DEFAULT_SETTINGS = {
  gymName: 'GymPro',
  gymAddress: '',
  gymPhone: '',
  gymEmail: '',
  gymLogo: null,
  membershipPrices: { Basic: 0, Standard: 0, Premium: 0, VIP: 0 },
  workingHours: {
    Monday:    { open: true,  openTime: '06:00', closeTime: '22:00' },
    Tuesday:   { open: true,  openTime: '06:00', closeTime: '22:00' },
    Wednesday: { open: true,  openTime: '06:00', closeTime: '22:00' },
    Thursday:  { open: true,  openTime: '06:00', closeTime: '22:00' },
    Friday:    { open: true,  openTime: '06:00', closeTime: '22:00' },
    Saturday:  { open: true,  openTime: '08:00', closeTime: '20:00' },
    Sunday:    { open: false, openTime: '08:00', closeTime: '18:00' },
  },
};

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('gym_settings') || '{}');
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      membershipPrices: { ...DEFAULT_SETTINGS.membershipPrices, ...stored.membershipPrices },
      workingHours: { ...DEFAULT_SETTINGS.workingHours, ...stored.workingHours },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const saveSettings = (next) => {
    localStorage.setItem('gym_settings', JSON.stringify(next));
    setSettings(next);
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
