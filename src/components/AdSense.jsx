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

    // 1. Observe mutations on <ins> element for ad status updates
    const observer = new MutationObserver(() => {
      const status = ins.getAttribute("data-ad-status");
      const hasIframe = ins.querySelector("iframe");
      const isHidden =
        ins.style.display === "none" ||
        (window.getComputedStyle && window.getComputedStyle(ins).display === "none");

      if (status === "unfilled" || isHidden) {
        markUnfilled();
      } else if (status === "filled" || hasIframe) {
        markFilled();
      }
    });

    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status", "style"],
      childList: true,
    });

    // 2. Request ad from AdSense
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn("AdSense push error:", err);
      markUnfilled();
    }

    // 3. Fallback timeout: If ad is blocked by client or network fails, collapse after 2s
    const timer = setTimeout(() => {
      const status = ins.getAttribute("data-ad-status");
      const hasIframe = ins.querySelector("iframe");
      if (status !== "filled" && !hasIframe) {
        markUnfilled();
      }
    }, 2000);

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
