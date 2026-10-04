import React, { useEffect, useRef } from "react";
import "../style/AdSense.css";

export default function AdSense({
  adSlot,
  adLayoutKey,
  adFormat = "fluid",
  style = { display: "block" },
  className = "",
}) {
  const insRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return undefined;

    const findContainer = () =>
      ins.closest(
        ".blog-ad-card, .blog-detail-ad-container, .home-ad-container, .source-ad-card, [data-ad-card]"
      );

    const markFilled = () => {
      const container = findContainer();
      if (container) {
        container.classList.add("is-filled");
        container.classList.remove("is-unfilled");
        container.style.removeProperty("display");
      }
    };

    const markUnfilled = () => {
      const container = findContainer();
      if (container) {
        container.classList.add("is-unfilled");
        container.classList.remove("is-filled");
        container.style.setProperty("display", "none", "important");
      }
    };

    const checkStatus = () => {
      const status = ins.getAttribute("data-ad-status");
      const isHidden =
        ins.style.display === "none" ||
        (window.getComputedStyle && window.getComputedStyle(ins).display === "none");

      if (status === "filled" && !isHidden) {
        markFilled();
      } else if (status === "unfilled" || isHidden) {
        markUnfilled();
      }
    };

    // 1. Observe mutations on <ins> element for ad status updates
    const observer = new MutationObserver(() => {
      checkStatus();
    });

    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "style", "class"],
      childList: true,
      subtree: true,
    });

    // 2. Request ad from AdSense safely (avoiding duplicate push TagError)
    const isAlreadyInitialized =
      ins.getAttribute("data-adsbygoogle-status") === "done" || pushedRef.current;

    if (!isAlreadyInitialized) {
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes("already have ads in them")) {
          // All elements already have ads, re-verify status without erroring out
          checkStatus();
        } else {
          console.warn("AdSense push error:", err);
          markUnfilled();
        }
      }
    } else {
      checkStatus();
    }

    // 3. Fallback timeout: If ad is not filled (pending approval, unapproved, unfilled, or blocked), collapse cleanly
    const timer = setTimeout(() => {
      const status = ins.getAttribute("data-ad-status");
      if (status !== "filled") {
        markUnfilled();
      }
    }, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [adSlot]);

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`.trim()}
      style={style}
      data-ad-client="ca-pub-4828836541522904"
      data-ad-slot={adSlot}
      {...(adFormat ? { "data-ad-format": adFormat } : {})}
      {...(adLayoutKey ? { "data-ad-layout-key": adLayoutKey } : {})}
    />
  );
}
