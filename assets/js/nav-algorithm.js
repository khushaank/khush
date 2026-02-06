/**
 * Navigation & Analytics Algorithm
 * Handles user tracking, referrer capture, and potential future navigation logic.
 */

async function trackAnalytics() {
  if (!window.supabaseClient) {
    // Retry if Supabase client isn't ready yet
    setTimeout(trackAnalytics, 500);
    return;
  }

  try {
    // 1. Get Public IP
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) throw new Error("IP Service Unavailable");
    const { ip } = await res.json();

    // 2. Capture Referrer
    const referrer = document.referrer || null;

    // 3. Track Visit -> Call RPC 'track_visit'
    const { data: trackingID, error } = await window.supabaseClient.rpc(
      "track_visit",
      {
        p_ip_address: ip,
        p_page_path: window.location.pathname + window.location.search,
        p_referrer: referrer,
      },
    );

    if (error) {
      console.error("Analytics Error:", error);
    } else if (trackingID) {
      sessionStorage.setItem("tracking_id", trackingID);
    }
  } catch (err) {
    // Fail silently (ad-blockers, etc.)
    // console.warn("Tracking skipped:", err);
  }
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", trackAnalytics);
} else {
  trackAnalytics();
}
