import { useEffect } from "react";

// Every overlay (cart, checkout, finder, product view, treatment detail,
// Goldie) calls this while it is open. The body carries a count so CSS can
// hide the Goldie launcher and the phone booking bar whenever anything is
// covering the page: body[data-sheets-open] is present while the count > 0.
let openCount = 0;

function sync() {
  if (openCount > 0) {
    document.body.setAttribute("data-sheets-open", String(openCount));
  } else {
    document.body.removeAttribute("data-sheets-open");
  }
}

export default function useSheetOpen(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;
    openCount += 1;
    sync();
    return () => {
      openCount -= 1;
      sync();
    };
  }, [isOpen]);
}
