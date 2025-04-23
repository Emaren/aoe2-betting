import { useState, useEffect } from "react";

export function useUserAuth() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const storedUid = localStorage.getItem("uid");
    if (storedUid) {
      setUid(storedUid);
    }
  }, []);

  return { uid, setUid };
}
