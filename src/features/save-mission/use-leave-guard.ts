"use client";

import { useEffect, useState } from "react";

// 쓰던 내용이 있을 때 다른 화면으로 가는 것을 한 번 묻는다.
// 넓은 화면에서는 S13 옆에 목록이 그대로 있어 카드나 탭을 누르면 입력이 사라지기 때문이다.
// Next에는 이동을 막는 API가 없어 링크 클릭을 캡처 단계에서 먼저 받는다.
// 브라우저 뒤로 가기는 막을 수 없고, 새로 고침·탭 닫기는 브라우저 기본 확인을 쓴다

export function useLeaveGuard(dirty: boolean) {
  /** 확인을 기다리는 이동 주소. null이면 팝업을 닫는다 */
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      // 다른 사이트로 가면 beforeunload가 묻는다. 같은 화면이면 사라질 것이 없다
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      // Next Link(React 핸들러)보다 먼저 받아 이동을 멈춘다
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty]);

  return {
    pendingHref,
    /** 머무르기 */
    stay: () => setPendingHref(null),
  };
}
