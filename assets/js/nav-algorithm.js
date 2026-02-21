async function trackAnalytics() {
  if (!window.supabaseClient) {
    setTimeout(trackAnalytics, 500);
    return;
  }

  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) throw new Error("IP Service Unavailable");
    const { ip } = await res.json();

    const referrer = document.referrer || null;

    const { data: trackingID, error } = await window.supabaseClient.rpc(
      "track_visit",
      {
        p_ip_address: ip,
        p_page_path: window.location.pathname + window.location.search,
        p_referrer: referrer,
      },
    );

    if (error) {
    } else if (trackingID) {
      sessionStorage.setItem("tracking_id", trackingID);
    }
  } catch (err) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", trackAnalytics);
} else {
  trackAnalytics();
}
