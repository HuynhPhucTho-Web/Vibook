import React, { useEffect } from 'react';

export default function AdSense({ adSlot, adLayoutKey, adFormat = "fluid", style = { display: 'block' } }) {
  useEffect(() => {
    try {
      // Push the ad to the adsbygoogle array
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense Error: ", err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-4828836541522904"
      data-ad-slot={adSlot}
      {...(adFormat ? { "data-ad-format": adFormat } : {})}
      {...(adLayoutKey ? { "data-ad-layout-key": adLayoutKey } : {})}
    />
  );
}
