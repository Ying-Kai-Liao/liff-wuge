'use client';

import { useState, useEffect, createContext, useContext } from "react";
import type { Liff } from "@line/liff";
import type { ReactNode } from "react";
import {saveUserProfile} from "../lib/services/userService";

// Create a context for LIFF
type LiffContextType = {
  liff: Liff | null;
  liffError: string | null;
  isLoggedIn: boolean;
};

const LiffContext = createContext<LiffContextType>({
  liff: null,
  liffError: null,
  isLoggedIn: false,
});

export const useLiff = () => useContext(LiffContext);

export default function LiffProvider({ children }: { children: ReactNode }) {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ displayName?: string } | null>(null);

  // Execute liff.init() when the app is initialized
  useEffect(() => {
    // to avoid `window is not defined` error
    import("@line/liff")
      .then((liff) => liff.default)
      .then((liff) => {
        console.log("LIFF init...");
        liff
          .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
          .then(() => {
            console.log("LIFF init succeeded.");
            setLiffObject(liff);
            // Check if user is logged in
            setIsLoggedIn(liff.isLoggedIn());
            if (liff.isLoggedIn()) {
              liff
                .getProfile()
                .then((profile) => {
                  setProfile({ displayName: profile.displayName });
                })
                .catch((error: Error) => {
                  console.log("LIFF getProfile failed.");
                  setLiffError(error.toString());
                });
            }
          })
          .catch((error: Error) => {
            console.log("LIFF init failed.");
            setLiffError(error.toString());
          });
      });
  }, []);

  return (
    <LiffContext.Provider value={{ liff: liffObject, liffError, isLoggedIn }}>
      {children}
    </LiffContext.Provider>
  );
}
