// --- Mobile Menu ---
const mobileToggles = document.querySelectorAll(".mobile-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileLinks = document.querySelectorAll(".mobile-link");

// Global Posts Data for Search
window.allSearchablePosts = [];

// --- Supabase Init ---
const SUPABASE_URL = "https://hzxwqxmldlncrhqxlnlq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eHdxeG1sZGxuY3JocXhsbmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODIwMDEsImV4cCI6MjA4NTc1ODAwMX0.pP3i8KquZmqhiUkaTw3ROi86mslTyzK5ysD2va1JI10";

if (typeof window.supabase !== "undefined") {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
}

mobileToggles.forEach((btn) => {
  btn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("open");
    if (isOpen) {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    } else {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  });
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  });
});

// --- Preloader ---
window.addEventListener("load", () => {
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    preloader.classList.add("hidden");
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }
});

// --- Scroll Fade In ---
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target); // Only animate once
    }
  });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

// --- Project Preview Interaction (Desktop) ---
const previewTitle = document.getElementById("preview-title");
const previewDesc = document.getElementById("preview-desc");
const previewLink = document.querySelector(".preview-content .btn"); // The button
let projectData = []; // Will be populated from Supabase

async function loadProjects() {
  const menuContainer = document.querySelector(".project-menu");
  // Check if we are on a page with the project menu
  if (!menuContainer) return;

  if (!window.supabaseClient) {
    console.warn("Supabase not initialized");
    return;
  }

  const { data: projects, error } = await window.supabaseClient
    .from("projects")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  if (!projects || projects.length === 0) {
    menuContainer.innerHTML = "<p>No case studies found.</p>";
    return;
  }

  projectData = projects;
  menuContainer.innerHTML = ""; // Clear existing

  projects.forEach((proj, index) => {
    const item = document.createElement("div");
    item.className = `project-item ${index === 0 ? "active" : ""}`; // Set first as active
    item.setAttribute("data-index", index);

    // Pad number with zero
    const num = (index + 1).toString().padStart(2, "0");

    item.innerHTML = `
      <span class="p-num">${num}</span>
      <div class="p-header">
        <h3>${proj.title}</h3>
        <span class="p-tag">${proj.category}</span>
      </div>
      <i data-lucide="arrow-right" class="p-arrow"></i>
      <p class="p-mobile-desc">${proj.description}</p>
    `;

    // Add click/hover listeners
    item.addEventListener("mouseenter", () => updatePreview(index));
    item.addEventListener("click", () => {
      // On mobile/click, also update or navigate?
      // For now, let's keep interactions consistent
      updatePreview(index);
    });

    menuContainer.appendChild(item);
  });

  // Initialize icons for new elements
  lucide.createIcons();

  // Set initial preview to first item
  if (projects.length > 0) {
    updatePreview(0);
  }
}

function updatePreview(index) {
  const items = document.querySelectorAll(".project-item");
  items.forEach((i) => i.classList.remove("active"));

  const currentItem = document.querySelector(
    `.project-item[data-index="${index}"]`,
  );
  if (currentItem) currentItem.classList.add("active");

  if (projectData[index]) {
    previewTitle.style.opacity = "0";
    previewDesc.style.opacity = "0";
    if (previewLink) previewLink.style.opacity = "0"; // Fade button too

    setTimeout(() => {
      previewTitle.textContent = projectData[index].title;
      previewDesc.textContent = projectData[index].description;

      // Update Link
      if (previewLink) {
        previewLink.href = projectData[index].link || "#"; // Use link from DB
        previewLink.style.opacity = "1";
      }

      previewTitle.style.opacity = "1";
      previewDesc.style.opacity = "1";
    }, 200);
  }
}

// Call function
loadProjects();

// --- Search Overlay (Blog) ---
// --- Search Overlay (Blog) ---
const searchOverlay = document.querySelector(".search-overlay");
const searchInput = document.querySelector(".search-input");
const searchSuggestions = document.querySelector(".search-suggestions");
const closeSearchBtn = document.querySelector(".close-search");

function openSearch() {
  if (searchOverlay) {
    searchOverlay.classList.add("active");
    setTimeout(() => searchInput.focus(), 100);
    document.body.style.overflow = "hidden";
  }
}

function closeSearch() {
  if (searchOverlay) {
    searchOverlay.classList.remove("active");
    document.body.style.overflow = "";
    if (searchInput) searchInput.value = "";
    if (searchSuggestions) searchSuggestions.innerHTML = "";
  }
}

function performSearch(term) {
  const grid = document.getElementById("posts-grid");
  if (!grid) {
    // If not on blog page, redirect (optional, currently just logs)
    console.log("Not on blog page, cannot render results.");
    window.location.href = `blog.html?q=${encodeURIComponent(term)}`;
    return;
  }

  closeSearch();

  const allPosts = window.allSearchablePosts || [];
  const filtered = allPosts.filter((p) =>
    p.title.toLowerCase().includes(term.toLowerCase()),
  );

  if (filtered.length > 0) {
    renderBlogGrid(filtered, grid);
  } else {
    // Show "No Results" + Related (Random 3)
    const randomRelated = allPosts.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Custom render for no results
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; margin-bottom: 2rem;">
        <h3>No matches found for "${term}"</h3>
        <p style="color: var(--text-muted);">But you might find these interesting:</p>
      </div>
    `;

    // Append related posts logic
    // We can reuse the map logic from renderBlogGrid but we need to append it
    // Actually simpler to just use renderBlogGrid if we change the innerHTML first?
    // No, renderBlogGrid overwrites.
    // Let's manually append related cards.
    const cardsHtml = randomRelated
      .map(
        (post) => `
        <a href="/pulse/?slug=${post.slug || post.id}&trackingid=${generateTrackingId()}" class="post-card fade-in">
          <div class="post-image" style="background: ${
            post.image_url
              ? `url('${post.image_url}')`
              : "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)"
          }; background-size: cover; background-position: center;"></div>
          <div class="post-content">
            <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-excerpt">${post.excerpt || ""}</p>
            <span class="read-more">Read Article <i data-lucide="arrow-right" size="16"></i></span>
          </div>
        </a>
    `,
      )
      .join("");

    grid.innerHTML += cardsHtml;

    if (typeof lucide !== "undefined") lucide.createIcons();
    grid.querySelectorAll(".fade-in").forEach((el) => {
      if (typeof observer !== "undefined") observer.observe(el);
      else el.classList.add("visible");
    });
  }
}

if (searchInput) {
  // Suggestions Logic
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    if (!term) {
      searchSuggestions.innerHTML = "";
      return;
    }

    const matches = (window.allSearchablePosts || [])
      .filter((p) => p.title.toLowerCase().includes(term))
      .slice(0, 5); // Limit to 5

    if (matches.length > 0) {
      searchSuggestions.innerHTML = matches
        .map(
          (p) =>
            `<div class="search-suggestion-item" data-title="${p.title}">${p.title}</div>`,
        )
        .join("");

      // Add click listeners to suggestions
      document.querySelectorAll(".search-suggestion-item").forEach((item) => {
        item.addEventListener("click", () => {
          performSearch(item.getAttribute("data-title"));
        });
      });
    } else {
      searchSuggestions.innerHTML = `<div style="padding:0.8rem; color: #999;">No direct matches...</div>`;
    }
  });

  // Enter Key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      performSearch(searchInput.value);
    }
  });
}

if (closeSearchBtn) {
  closeSearchBtn.addEventListener("click", closeSearch);
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "k" || e.key === "f" || e.key === "s")) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === "Escape") {
    closeSearch();
  }
});
/* Update Footer Year */
const yearSpan = document.getElementById("current-year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// --- Cookie Consent Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("accept-cookies");
  const CONSENT_KEY = "cookie_consent_accepted";

  if (!banner || !acceptBtn) return;

  // Check if user has already accepted usage on this device
  const hasConsented = localStorage.getItem(CONSENT_KEY);

  if (!hasConsented) {
    // Show banner after a short delay
    setTimeout(() => {
      banner.classList.add("visible");
    }, 1000);
  }

  acceptBtn.addEventListener("click", () => {
    // Save consent to local storage
    localStorage.setItem(CONSENT_KEY, "true");
    // Hide banner
    banner.classList.remove("visible");
  });
});

// --- SIP Calculator Logic ---
const sipAmount = document.getElementById("sip-amount");
const sipAmountRange = document.getElementById("sip-amount-range");
const sipRate = document.getElementById("sip-rate");
const sipRateRange = document.getElementById("sip-rate-range");
const sipYears = document.getElementById("sip-years");
const sipYearsRange = document.getElementById("sip-years-range");

const resInvested = document.getElementById("res-invested");
const resReturns = document.getElementById("res-returns");
const resTotal = document.getElementById("res-total");

const barInvested = document.getElementById("bar-invested");
const barReturns = document.getElementById("bar-returns");

function formatCurrency(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateSIP() {
  if (!sipAmount) return; // Exit if elements don't exist (i.e. not on tools page)

  const P = parseFloat(sipAmount.value);
  const r = parseFloat(sipRate.value);
  const n = parseFloat(sipYears.value);

  // SIP Formula: P * [ ( (1 + i)^n - 1 ) / i ] * (1 + i)
  // where i = r / 100 / 12
  // n_months = n * 12

  const i = r / 100 / 12;
  const n_months = n * 12;

  const totalValue = P * ((Math.pow(1 + i, n_months) - 1) / i) * (1 + i);
  const investedAmount = P * n_months;
  const estReturns = totalValue - investedAmount;

  if (resInvested) resInvested.textContent = formatCurrency(investedAmount);
  if (resReturns) resReturns.textContent = formatCurrency(estReturns);
  if (resTotal) resTotal.textContent = formatCurrency(totalValue);

  // Update Chart bars
  if (totalValue > 0) {
    const pInv = (investedAmount / totalValue) * 100;
    const pRet = (estReturns / totalValue) * 100;
    if (barInvested) barInvested.style.width = `${pInv}%`;
    if (barReturns) barReturns.style.width = `${pRet}%`;
  }
}

function syncInputs(input, range, callback) {
  if (!input || !range) return;
  input.addEventListener("input", () => {
    range.value = input.value;
    if (callback) callback();
  });
  range.addEventListener("input", () => {
    input.value = range.value;
    if (callback) callback();
  });
}

// Initial Setup - SIP
if (sipAmount) {
  syncInputs(sipAmount, sipAmountRange, calculateSIP);
  syncInputs(sipRate, sipRateRange, calculateSIP);
  syncInputs(sipYears, sipYearsRange, calculateSIP);
  calculateSIP();
}

// --- Lumpsum Calculator Logic ---
const lumpAmount = document.getElementById("lump-amount");
const lumpAmountRange = document.getElementById("lump-amount-range");
const lumpRate = document.getElementById("lump-rate");
const lumpRateRange = document.getElementById("lump-rate-range");
const lumpYears = document.getElementById("lump-years");
const lumpYearsRange = document.getElementById("lump-years-range");

const resLumpInvested = document.getElementById("res-lump-invested");
const resLumpReturns = document.getElementById("res-lump-returns");
const resLumpTotal = document.getElementById("res-lump-total");

const barLumpInvested = document.getElementById("bar-lump-invested");
const barLumpReturns = document.getElementById("bar-lump-returns");

function calculateLumpsum() {
  if (!lumpAmount) return;

  const P = parseFloat(lumpAmount.value);
  const r = parseFloat(lumpRate.value);
  const n = parseFloat(lumpYears.value);

  // Lumpsum Formula: P * (1 + r/100)^n
  const totalValue = P * Math.pow(1 + r / 100, n);
  const investedAmount = P;
  const estReturns = totalValue - investedAmount;

  if (resLumpInvested)
    resLumpInvested.textContent = formatCurrency(investedAmount);
  if (resLumpReturns) resLumpReturns.textContent = formatCurrency(estReturns);
  if (resLumpTotal) resLumpTotal.textContent = formatCurrency(totalValue);

  // Update Chart bars
  if (totalValue > 0) {
    const pInv = (investedAmount / totalValue) * 100;
    const pRet = (estReturns / totalValue) * 100;
    if (barLumpInvested) barLumpInvested.style.width = `${pInv}%`;
    if (barLumpReturns) barLumpReturns.style.width = `${pRet}%`;
  }
}

if (lumpAmount) {
  syncInputs(lumpAmount, lumpAmountRange, calculateLumpsum);
  syncInputs(lumpRate, lumpRateRange, calculateLumpsum);
  syncInputs(lumpYears, lumpYearsRange, calculateLumpsum);
  calculateLumpsum();
}

// --- GST Calculator Logic ---
const gstAmount = document.getElementById("gst-amount");
const gstRateInput = document.getElementById("gst-rate");
const gstTypeRadios = document.querySelectorAll('input[name="gst-type"]');
const gstRateBtns = document.querySelectorAll(".gst-rate-btn");

const resGstNet = document.getElementById("res-gst-net");
const resGstVal = document.getElementById("res-gst-val");
const resGstTotal = document.getElementById("res-gst-total");

function calculateGST() {
  if (!gstAmount) return;

  const amount = parseFloat(gstAmount.value) || 0;
  const rate = parseFloat(gstRateInput.value) || 0;
  let type = "exclusive";
  gstTypeRadios.forEach((r) => {
    if (r.checked) type = r.value;
  });

  let net = 0,
    gst = 0,
    total = 0;

  if (type === "exclusive") {
    // Input is Net
    net = amount;
    gst = amount * (rate / 100);
    total = net + gst;
  } else {
    // Input is Total (Inclusive)
    // Formula: Net = Total / (1 + Rate/100)
    total = amount;
    net = total / (1 + rate / 100);
    gst = total - net;
  }

  if (resGstNet) resGstNet.textContent = formatCurrency(net);
  if (resGstVal) resGstVal.textContent = formatCurrency(gst);
  if (resGstTotal) resGstTotal.textContent = formatCurrency(total);
}

if (gstAmount) {
  gstAmount.addEventListener("input", calculateGST);

  gstRateBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      gstRateBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      gstRateInput.value = e.target.getAttribute("data-rate");
      calculateGST();
    });
  });

  gstTypeRadios.forEach((radio) => {
    radio.addEventListener("change", calculateGST);
  });

  calculateGST();
}

// --- Page Specific Logic & Routing ---
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Initialize Icons Globally
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Index Page: Load Latest Posts
  // robust check: if #latest-posts-grid exists, we are on home/index
  if (document.getElementById("latest-posts-grid")) {
    loadLatestPosts();
  }

  // Blog Page: Load All Posts
  // robust check: if #posts-grid exists, we are on blog page
  if (document.getElementById("posts-grid")) {
    loadPosts();
  }

  // Viewer Page: Load Article & Comments
  // robust check: we look for the article container
  if (document.getElementById("article-display") || path.includes("/pulse/")) {
    initViewerPage();
  }

  // 404 Page: Animation
  if (document.querySelector(".e-code")) {
    const box = document.querySelector(".content-box");
    if (box) {
      box.style.opacity = "1";
      box.style.transform = "translateY(0)";
    }
  }
});

// --- Helper Functions ---

function generateTrackingId() {
  return (
    "tid_" +
    Math.random().toString(36).substring(2, 9) +
    Date.now().toString(36)
  );
}

async function loadLatestPosts() {
  const grid = document.getElementById("latest-posts-grid");
  if (!grid) return; // Not on index page

  if (!window.supabaseClient) {
    console.error("Supabase client not initialized");
    grid.innerHTML =
      "<p>Error: Could not connect to database (Client not initialized).</p>";
    return;
  }

  const { data: posts, error } = await window.supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching posts:", error);
    grid.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    return;
  }

  if (!posts || posts.length === 0) {
    grid.innerHTML =
      "<p>No articles found. Please run seeder.html to populate data.</p>";
    return;
  }

  if (posts.length > 0) {
    grid.innerHTML = posts
      .map(
        (post) => `
          <a href="/pulse/?slug=${post.slug || post.id}&trackingid=${generateTrackingId()}" class="post-card fade-in">
            <div class="post-image" style="background: ${
              post.image_url
                ? `url('${post.image_url}')`
                : "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)"
            }; background-size: cover; background-position: center;"></div>
            <div class="post-content">
              <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
              <h3 class="post-title">${post.title}</h3>
              <p class="post-excerpt">${post.excerpt || ""}</p>
              <span class="read-more">Read Article <i data-lucide="arrow-right" size="16"></i></span>
            </div>
          </a>
        `,
      )
      .join("");
    if (typeof lucide !== "undefined") lucide.createIcons();

    // Observe new fade-in elements
    grid.querySelectorAll(".fade-in").forEach((el) => {
      if (typeof observer !== "undefined") observer.observe(el);
      else el.classList.add("visible"); // Fallback
    });
  }
}

async function loadPosts() {
  const grid = document.getElementById("posts-grid");
  if (!grid) return;

  if (!window.supabaseClient) {
    console.error("Supabase client not initialized");
    grid.innerHTML = "<p>Error: Could not connect to database.</p>";
    return;
  }

  const { data: posts, error } = await window.supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    return;
  }

  // Save for global search
  window.allSearchablePosts = posts;

  renderBlogGrid(posts, grid);
}

function renderBlogGrid(posts, gridElement) {
  if (posts.length === 0) {
    gridElement.innerHTML = "<div class='no-results'>No articles found.</div>";
    return;
  }

  gridElement.innerHTML = posts
    .map(
      (post) => `
        <a href="/pulse/?slug=${post.slug || post.id}&trackingid=${generateTrackingId()}" class="post-card fade-in">
          <div class="post-image" style="background: ${
            post.image_url
              ? `url('${post.image_url}')`
              : "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)"
          }; background-size: cover; background-position: center;"></div>
          <div class="post-content">
            <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-excerpt">${post.excerpt || ""}</p>
            <span class="read-more">Read Article <i data-lucide="arrow-right" size="16"></i></span>
          </div>
        </a>
     `,
    )
    .join("");

  if (typeof lucide !== "undefined") lucide.createIcons();

  // Observe new fade-in elements
  gridElement.querySelectorAll(".fade-in").forEach((el) => {
    if (typeof observer !== "undefined") observer.observe(el);
    else el.classList.add("visible"); // Fallback
  });
}

// --- Viewer Page Logic ---
let currentPostId = null;

async function initViewerPage() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug") || params.get("id");

  // Fallback: Check pathname for /pulse/slug
  if (!slug) {
    const path = window.location.pathname;
    const match = path.match(/\/pulse\/([^\/]+)/);
    if (match && match[1]) {
      slug = match[1];
    }
  }

  if (!slug) {
    // Check if we are physically on pulse index
    if (
      window.location.pathname.endsWith("/pulse/index.html") ||
      window.location.pathname.endsWith("/pulse/")
    ) {
      // Allow for direct navigation if we want a gallery there?
      // For now, if no slug, redirect to main blog
      window.location.href = "/blog.html";
      return;
    }
    window.location.href = "/blog.html";
    return;
  }

  // --- Url Beautification (SPA-like) ---
  // If we have a slug and are on the pulse page, rewrite URL to /pulse/slug
  // CRITICAL: We only do this if NOT on localhost.
  // Localhost servers generally cannot handle virtual paths like /pulse/slug on reload.
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname,
  );

  if (!isLocal && slug && window.location.pathname.includes("/pulse/")) {
    const trackingId = params.get("trackingid");
    let newUrl = `/pulse/${slug}`;
    if (trackingId) {
      newUrl += `?trackingid=${trackingId}`;
    }
    // Check if we are already on the correct URL to prevent loop/redundancy
    if (!window.location.pathname.endsWith(slug)) {
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }

  checkAuth();
  loadArticle(slug);

  const loginBtn = document.getElementById("google-login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      // Determine the safe redirect URL.
      // On localhost, we MUST return to the physical file (index.html) with query params.
      // On production, we can return to the clean URL.
      let redirectUrl = window.location.href;

      if (isLocal) {
        // Force construct the safe URL
        const url = new URL(window.location.href);
        // e.g. http://127.0.0.1:5500/pulse/index.html
        // Ensure we have the search params
        if (!url.searchParams.has("slug") && slug)
          url.searchParams.set("slug", slug);
        redirectUrl = url.toString();
      }

      await window.supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  // logoutBtn might be dynamically added or hidden, so we might need event delegation or check existence
  // In viewer.html it is statically there but might be hidden.
  // Actually in viewer.html line 214 it is there.
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.supabaseClient.auth.signOut();
      checkAuth();
    });
  }

  const commentForm = document.getElementById("comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmit);
  }

  // --- Actions ---
  const copyBtn = document.getElementById("btn-copy-link");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      // Remove tracking ID for clean copy if desired? Or keep it?
      // User asked for tracking ID in URL "must come out like this".
      // But usually user wants to copy a CLEAN link or the current link?
      // "but url must comeout like this with a tracking id" -> This likely refers to generated links.
      // When copying, maybe a clean link is better? Or just the current URL.
      // Let's copy current URL, but maybe regen tracking ID? No, just copy current.
      navigator.clipboard.writeText(window.location.href).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i data-lucide="check" size="16"></i> Copied`;
        lucide.createIcons();
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          lucide.createIcons();
        }, 2000);
      });
    });
  }

  const shareBtn = document.getElementById("btn-share-linkedin");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const url = encodeURIComponent(window.location.href);
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        "_blank",
      );
    });
  }
}

async function loadArticle(slug) {
  if (!window.supabaseClient) return;

  // Use ID if UUID, else assume slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(slug);
  const column = isUUID ? "id" : "slug";

  const { data, error } = await window.supabaseClient
    .from("posts")
    .select("*")
    .eq(column, slug)
    .single();

  if (error || !data) {
    const loadingEl = document.getElementById("article-loading");
    if (loadingEl) loadingEl.textContent = "Article not found.";
    console.error(error);
  } else {
    document.getElementById("article-loading").style.display = "none";
    document.getElementById("article-display").style.display = "block";

    currentPostId = data.id;

    // SEO & Content
    document.title = `${data.title} - Khushaank Gupta`;

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = data.excerpt || data.title;

    // Update Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = data.title;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = data.excerpt || "";

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = window.location.href;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && data.image_url) ogImage.content = data.image_url;

    // Update Twitter Tags
    const twTitle = document.querySelector('meta[property="twitter:title"]');
    if (twTitle) twTitle.content = data.title;

    const twDesc = document.querySelector(
      'meta[property="twitter:description"]',
    );
    if (twDesc) twDesc.content = data.excerpt || "";

    const twImage = document.querySelector('meta[property="twitter:image"]');
    if (twImage && data.image_url) twImage.content = data.image_url;

    document.getElementById("article-title").textContent = data.title;
    document.getElementById("article-date").textContent = new Date(
      data.created_at,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.getElementById("article-views").textContent =
      (data.views || 0) + 1;
    document.getElementById("article-body").innerHTML = data.content;

    // Increment View
    window.supabaseClient.rpc("increment_views", { post_id: data.id });

    // --- New Features Initialization ---
    calculateReadingTime(data.content);
    generateTOC();
    initReadingProgress();

    // Re-run icons for new elements
    lucide.createIcons();

    // Load Comments
    loadComments(data.id);
  }
}

/* --- Feature Helpers --- */

function calculateReadingTime(contentHTML) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = contentHTML;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average 200 wpm

  const timeElement = document.getElementById("reading-time");
  if (timeElement) {
    timeElement.textContent = `${readingTime} min read`;
  }
}

function generateTOC() {
  const articleBody = document.getElementById("article-body");
  const tocList = document.getElementById("toc-list");
  const tocContainer = document.getElementById("toc-container");

  if (!articleBody || !tocList || !tocContainer) return;

  tocList.innerHTML = ""; // Clear existing

  const headers = articleBody.querySelectorAll("h2, h3");

  if (headers.length < 2) {
    tocContainer.style.display = "none";
    return;
  }

  tocContainer.style.display = "block";

  headers.forEach((header, index) => {
    // Generate ID if missing
    if (!header.id) {
      const slug = header.textContent
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      header.id = slug || `section-${index}`;
    }

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${header.id}`;
    a.textContent = header.textContent;
    a.className = `toc-link toc-${header.tagName.toLowerCase()}`;

    // Smooth scroll
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(header.id).scrollIntoView({
        behavior: "smooth",
      });
      // Update URL hash without jump
      history.pushState(null, null, `#${header.id}`);
    });

    li.appendChild(a);
    tocList.appendChild(li);
  });

  // TOC Scroll Spy
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          document.querySelectorAll(".toc-link").forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${activeId}`,
            );
          });
        }
      });
    },
    { rootMargin: "-100px 0px -60% 0px" },
  );

  headers.forEach((header) => observer.observe(header));
}

function initReadingProgress() {
  const progressBar = document.getElementById("reading-progress");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

async function loadComments(postId) {
  const list = document.getElementById("comments-list");
  if (!list) return;

  const { data: comments, error } = await window.supabaseClient
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<p>Could not load comments.</p>";
    return;
  }

  if (comments.length === 0) {
    list.innerHTML = "<p>No comments yet. Be the first to say something!</p>";
  } else {
    list.innerHTML = comments
      .map(
        (c) => `
        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <strong style="font-size: 0.95rem;">${c.user_name}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(c.created_at).toLocaleDateString()}</span>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">${c.content}</p>
        </div>
      `,
      )
      .join("");
  }
}

async function checkAuth() {
  if (!window.supabaseClient) return;
  const {
    data: { session },
  } = await window.supabaseClient.auth.getSession();
  const loginSection = document.getElementById("auth-comment");
  const formSection = document.getElementById("comment-form");
  const userDisplay = document.getElementById("user-display-name");

  if (session) {
    if (loginSection) loginSection.style.display = "none";
    if (formSection) formSection.style.display = "block";
    if (userDisplay) {
      const name = session.user.user_metadata.full_name || session.user.email;
      userDisplay.textContent = `Posting as ${name}`;
    }
  } else {
    if (loginSection) loginSection.style.display = "block";
    if (formSection) formSection.style.display = "none";
  }
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const contentInput = document.getElementById("comment-content");
  const btn = e.target.querySelector("button");

  if (!currentPostId) {
    alert("Article not loaded fully yet.");
    return;
  }

  const {
    data: { user },
  } = await window.supabaseClient.auth.getUser();
  if (!user) {
    alert("You must be logged in to comment.");
    return;
  }

  const userName = user.user_metadata.full_name || user.email.split("@")[0];
  const originalText = btn.textContent;
  btn.textContent = "Posting...";
  btn.disabled = true;

  const { error } = await window.supabaseClient.from("comments").insert([
    {
      post_id: currentPostId,
      user_name: userName,
      content: contentInput.value,
    },
  ]);

  if (error) {
    alert("Error posting comment: " + error.message);
  } else {
    contentInput.value = "";
    loadComments(currentPostId);
  }

  btn.textContent = originalText;
  btn.disabled = false;
}
