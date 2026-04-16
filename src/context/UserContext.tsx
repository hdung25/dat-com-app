'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface UserState {
  phone: string | null;
  userCode: string | null;
  loading: boolean;
}

const UserContext = createContext<UserState & {
  refresh: () => void;
}>({
  phone: null,
  userCode: null,
  loading: true,
  refresh: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>({
    phone: null,
    userCode: null,
    loading: true,
  });

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/user/me');
      const data = await res.json();
      setState({
        phone: data.phone || null,
        userCode: data.code || null,
        loading: false,
      });
    } catch {
      setState({ phone: null, userCode: null, loading: false });
    }
  };

  useEffect(() => { fetchMe(); }, []);

  return (
    <UserContext.Provider value={{ ...state, refresh: fetchMe }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
