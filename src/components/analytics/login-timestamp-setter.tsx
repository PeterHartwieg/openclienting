"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LOGIN_TS_KEY } from "@/lib/analytics/ia-events";

function Setter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("oc_login") !== "1") return;
    if (typeof window === "undefined") return;

    sessionStorage.setItem(LOGIN_TS_KEY, String(Date.now()));

    // Remove the param without triggering a full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.delete("oc_login");
    const search = params.toString();
    const cleanUrl = search ? `${pathname}?${search}` : pathname;
    window.history.replaceState(null, "", cleanUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function LoginTimestampSetter() {
  return (
    <Suspense>
      <Setter />
    </Suspense>
  );
}
