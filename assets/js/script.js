function initMobileMenu() {
  const mobileToggles = document.querySelectorAll(".mobile-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  if (!mobileMenu) return;

  mobileToggles.forEach((btn) => {
    btn.onclick = () => {
      const isOpen = mobileMenu.classList.contains("open");
      if (isOpen) {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
      } else {
        mobileMenu.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    };
  });

  mobileLinks.forEach((link) => {
    link.onclick = () => {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    };
  });
}

function initIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function initObservers() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
  window.currentObserver = observer;
}

function initHome() {
  if (document.getElementById("latest-posts-grid")) {
    loadLatestPosts();
  }

  const menuContainer = document.querySelector(".project-menu");
  if (menuContainer) {
    loadProjects();
  }
}

function initBlog() {
  if (document.getElementById("posts-grid")) {
    loadPosts();
  }

  const searchInput = document.querySelector(".search-input");
  const closeSearchBtn = document.querySelector(".close-search");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const searchSuggestions = document.querySelector(".search-suggestions");
      if (!term) {
        searchSuggestions.innerHTML = "";
        return;
      }
      const matches = (window.allSearchablePosts || [])
        .filter((p) => p.title.toLowerCase().includes(term))
        .slice(0, 5);

      if (matches.length > 0) {
        searchSuggestions.innerHTML = matches
          .map(
            (p) =>
              `<div class="search-suggestion-item" data-title="${p.title}">${p.title}</div>`,
          )
          .join("");
        document.querySelectorAll(".search-suggestion-item").forEach((item) => {
          item.addEventListener("click", () => {
            performSearch(item.getAttribute("data-title"));
          });
        });
      } else {
        searchSuggestions.innerHTML = `<div style="padding:0.8rem; color: #999;">No direct matches...</div>`;
      }
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performSearch(searchInput.value);
    });
  }

  if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", closeSearch);
  }
}

function initViewer() {
  if (
    document.getElementById("article-display") ||
    window.location.pathname.includes("/pulse/")
  ) {
    initViewerPage();
  }
}

function initPage() {
  initMobileMenu();
  initIcons();
  initObservers();

  const path = window.location.pathname;

  initHome();
  initBlog();

  initViewer();
  initContactForm();
  initNewsletter();
  initCookieConsent();

  document.body.style.overflow = "";

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    if (link.textContent.trim() === "Insights") {
      link.setAttribute("href", "/blog");
    }
  });

  if (document.querySelector(".ai-card")) {
    if (typeof initAICardEffects === "function") initAICardEffects();
  }

  document.querySelectorAll(".nav-link, .mobile-link").forEach((link) => {
    link.classList.remove("active");

    if (
      link.getAttribute("href") === path ||
      (path === "/" && link.getAttribute("href") === "/")
    ) {
      link.classList.add("active");
    } else if (
      path.includes(link.getAttribute("href")) &&
      link.getAttribute("href") !== "/"
    ) {
      link.classList.add("active");
    }
  });

  initCommunityPopup();
  trackPageView();
}

function initCommunityPopup() {
  const POPUP_KEY = "community_popup_dismissed";
  const INTERACT_KEY = "newsletter_interacted";

  const dismissedTime = localStorage.getItem(POPUP_KEY);
  const interacted = localStorage.getItem(INTERACT_KEY);

  if (interacted === "subscribed" || interacted === "followed") return;

  if (dismissedTime) {
    const now = new Date().getTime();
    const daysSince = (now - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return;
  }

  if (Math.random() > 0.4) return;

  const delay = Math.floor(Math.random() * 30000) + 15000;

  setTimeout(() => {
    if (document.querySelector(".community-popup")) return;

    const popup = document.createElement("div");
    popup.className = "community-popup";
    popup.innerHTML = `
      <div class="cp-content">
        <button class="cp-close" aria-label="Close">×</button>
        <div class="cp-icon">✨</div>
        <h3 class="cp-title">Join the Community</h3>
        <p class="cp-desc">Get exclusive insights on Finance, AI, and Strategy delivered to your inbox.</p>
        <div class="cp-actions">
          <a href="#newsletter-form" class="btn-cp-primary" id="cp-subscribe-btn">Subscribe Free</a>
          <a href="https://www.linkedin.com/in/khushaank/" target="_blank" class="btn-cp-outline" id="cp-linkedin-btn">
            <i data-lucide="linkedin" width="18" height="18"></i> Follow
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    if (!document.getElementById("cp-styles")) {
      const style = document.createElement("style");
      style.id = "cp-styles";
      style.textContent = `
        .community-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .community-popup.visible {
          opacity: 1;
        }
        
        .cp-content {
          width: 90%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          text-align: center;
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transform: scale(0.95) translateY(10px);
          transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .community-popup.visible .cp-content {
          transform: scale(1) translateY(0);
        }

        .cp-icon {
          font-size: 3.5rem;
          margin-bottom: 0.75rem;
          filter: drop-shadow(0 4px 16px rgba(255, 215, 0, 0.3));
          animation: cp-float 6s ease-in-out infinite;
        }
        @keyframes cp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .cp-title {
          font-family: var(--font-heading, serif);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #111;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .cp-desc {
          font-family: var(--font-body, sans-serif);
          font-size: 1.05rem;
          color: #555;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .cp-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        @media (max-width: 480px) {
           .cp-actions { flex-direction: column; }
        }

        .btn-cp-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 1.8rem;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          background: #111;
          text-decoration: none;
          transition: all 0.25s ease;
          border: none;
        }
        .btn-cp-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3);
          background: #000;
        }

        .btn-cp-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 1rem 1.8rem;
          border-radius: 14px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #111;
          background: transparent;
          border: 1px solid #ddd;
          text-decoration: none;
          transition: all 0.25s ease;
        }
        .btn-cp-outline:hover {
          background: #f9f9f9;
          border-color: #bbb;
          transform: translateY(-2px);
        }

        .cp-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0,0,0,0.04);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 1.4rem;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 0;
        }
        .cp-close:hover {
          background: rgba(0,0,0,0.1);
          color: #000;
          transform: rotate(90deg);
        }

        
        @media (prefers-color-scheme: dark) {
          .cp-content {
            background: rgba(22, 22, 22, 0.85);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .cp-title { color: #fff; }
          .cp-desc { color: #aaa; }
          .btn-cp-primary { background: #fff; color: #000; }
          .btn-cp-primary:hover { background: #f0f0f0; box-shadow: 0 10px 20px -5px rgba(255,255,255,0.2); }
          .btn-cp-outline { color: #fff; border-color: rgba(255,255,255,0.2); }
          .btn-cp-outline:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
          .cp-close { background: rgba(255,255,255,0.1); color: #fff; }
          .cp-close:hover { background: rgba(255,255,255,0.2); }
        }
      `;
      document.head.appendChild(style);
    }

    if (typeof lucide !== "undefined") lucide.createIcons();

    requestAnimationFrame(() => popup.classList.add("visible"));

    const closeBtn = popup.querySelector(".cp-close");
    const subscribeBtn = popup.querySelector("#cp-subscribe-btn");
    const linkedinBtn = popup.querySelector("#cp-linkedin-btn");

    const dismiss = () => {
      popup.classList.remove("visible");
      setTimeout(() => popup.remove(), 400);
      localStorage.setItem(POPUP_KEY, new Date().getTime().toString());
    };

    closeBtn.addEventListener("click", dismiss);

    popup.addEventListener("click", (e) => {
      if (e.target === popup) dismiss();
    });

    subscribeBtn.addEventListener("click", (e) => {
      dismiss();
      const form =
        document.getElementById("newsletter-form") ||
        document.getElementById("newsletter-slidein-form");
      if (form) {
        e.preventDefault();
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        form.querySelector("input").focus();
      }
    });

    linkedinBtn.addEventListener("click", () => {
      localStorage.setItem(INTERACT_KEY, "followed");
      dismiss();
    });
  }, delay);
}

class LoadingBar {
  constructor() {
    this.bar = document.createElement("div");
    this.bar.className = "loading-bar";
    document.body.appendChild(this.bar);
  }

  start() {
    this.bar.style.width = "0%";
    this.bar.style.opacity = "1";
    setTimeout(() => {
      this.bar.style.width = "30%";
    }, 50);
  }

  progress(percent) {
    this.bar.style.width = `${percent}%`;
  }

  finish() {
    this.bar.style.width = "100%";
    setTimeout(() => {
      this.bar.style.opacity = "0";
      setTimeout(() => {
        this.bar.style.width = "0%";
      }, 400);
    }, 400);
  }
}

const loadingBar = new LoadingBar();

async function navigateTo(url) {
  loadingBar.start();
  try {
    let fetchUrl = url;
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;

    if (path !== "/" && !path.includes(".") && !path.endsWith("/")) {
      fetchUrl = path + ".html" + urlObj.search;
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      const retryResponse = await fetch(url);
      if (!retryResponse.ok) throw new Error("Page not found");
    }

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    document.title = doc.title;

    const newMain = doc.querySelector("main");
    const currentMain = document.querySelector("main");

    if (newMain && currentMain) {
      currentMain.style.opacity = "0";
      currentMain.style.transition = "opacity 0.2s";

      setTimeout(() => {
        currentMain.innerHTML = newMain.innerHTML;
        currentMain.className = newMain.className;
        currentMain.removeAttribute("style");
        currentMain.classList.add("fade-in-page");

        setTimeout(() => currentMain.classList.remove("fade-in-page"), 500);

        if (window.location.href !== url) {
          window.history.pushState({}, "", url);
          currentSPAUrl = window.location.pathname;
        }

        initPage();

        if (typeof trackAnalytics === "function") {
          trackAnalytics();
        }

        window.scrollTo(0, 0);
        loadingBar.finish();
      }, 200);
    } else {
      window.location.href = url;
    }
  } catch (err) {
    console.error("Navigation error:", err);
    window.location.href = url;
  }
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("http") ||
    link.target === "_blank"
  ) {
    if (href.startsWith(window.location.origin)) {
    } else if (href.startsWith("http")) {
      return;
    } else {
      return;
    }
  }

  e.preventDefault();

  const destination = new URL(href, window.location.origin);

  if (destination.origin !== window.location.origin) {
    window.location.href = href;
    return;
  }

  if (
    destination.pathname === window.location.pathname &&
    destination.search === window.location.search
  ) {
    if (destination.hash) {
      const target = document.querySelector(destination.hash);
      if (target) target.scrollIntoView({ behavior: "smooth" });

      if (window.location.hash !== destination.hash) {
        window.history.pushState({}, "", destination.href);
      }
      return;
    } else if (destination.href === window.location.href.split("#")[0]) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  }

  navigateTo(destination.href);
});

let currentSPAUrl = window.location.pathname;

window.addEventListener("popstate", () => {
  if (window.location.pathname !== currentSPAUrl) {
    currentSPAUrl = window.location.pathname;
    navigateTo(window.location.href);
  } else if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

const SUPABASE_URL = "https://hzxwqxmldlncrhqxlnlq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eHdxeG1sZGxuY3JocXhsbmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODIwMDEsImV4cCI6MjA4NTc1ODAwMX0.pP3i8KquZmqhiUkaTw3ROi86mslTyzK5ysD2va1JI10";

function initSupabase() {
  if (typeof window.supabase !== "undefined" && !window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          detectSessionFromUrl: true,
          flowType: "implicit",
        },
      },
    );
  }
}

initSupabase();

window.addEventListener("load", () => {
  initSupabase();
});

window.allSearchablePosts = [];

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.log(e));
  });
}

if (document.readyState === "complete") {
  initPage();
  hidePreloader();
} else {
  window.addEventListener("load", () => {
    initPage();
    hidePreloader();
  });
}

function hidePreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return;
  preloader.classList.add("hidden");
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
}

let projectData = [];
async function loadProjects() {
  const menuContainer = document.querySelector(".project-menu");
  if (!menuContainer) return;
  if (!window.supabaseClient) return;

  const { data: projects } = await window.supabaseClient
    .from("projects")
    .select("*")
    .order("display_order", { ascending: true });

  if (!projects || projects.length === 0) {
    menuContainer.innerHTML = "<p>No case studies found.</p>";
    return;
  }

  projectData = projects;
  menuContainer.innerHTML = "";

  projects.forEach((proj, index) => {
    const item = document.createElement("div");
    item.className = `project-item ${index === 0 ? "active" : ""}`;
    item.setAttribute("data-index", index);
    const num = (index + 1).toString().padStart(2, "0");

    item.innerHTML = `
      <span class="p-num">${num}</span>
      <div class="p-header">
        <h3>${proj.title}</h3>
        <span class="p-tag">${proj.category}</span>
      </div>
      <i data-lucide="arrow-right" class="p-arrow"></i>
      <div class="p-mobile-desc" style="display:none">${proj.description}</div> 
    `;

    item.onmouseenter = () => updatePreview(index);
    item.onclick = () => updatePreview(index);
    menuContainer.appendChild(item);
  });

  lucide.createIcons();
  if (projects.length > 0) updatePreview(0);
}

const previewTitle = document.getElementById("preview-title");
const previewDesc = document.getElementById("preview-desc");
const previewLink = document.querySelector(".preview-content .btn");

function updatePreview(index) {
  if (!previewTitle) return;

  document
    .querySelectorAll(".project-item")
    .forEach((i) => i.classList.remove("active"));
  const currentItem = document.querySelector(
    `.project-item[data-index="${index}"]`,
  );
  if (currentItem) currentItem.classList.add("active");

  if (projectData[index]) {
    previewTitle.style.opacity = "0";
    if (previewDesc) previewDesc.style.opacity = "0";
    if (previewLink) previewLink.style.opacity = "0";

    setTimeout(() => {
      previewTitle.textContent = projectData[index].title;
      if (previewDesc) previewDesc.textContent = projectData[index].description;
      if (previewLink) {
        previewLink.href = projectData[index].link || "#";
        previewLink.style.opacity = "1";
      }
      previewTitle.style.opacity = "1";
      if (previewDesc) previewDesc.style.opacity = "1";
    }, 200);
  }
}

function openSearch() {
  const searchOverlay = document.querySelector(".search-overlay");
  const searchInput = document.querySelector(".search-input");
  if (searchOverlay) {
    searchOverlay.classList.add("active");
    setTimeout(() => searchInput && searchInput.focus(), 100);
    document.body.style.overflow = "hidden";
  }
}

function closeSearch() {
  const searchOverlay = document.querySelector(".search-overlay");
  const searchInput = document.querySelector(".search-input");
  const searchSuggestions = document.querySelector(".search-suggestions");

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
    navigateTo(`/blog?q=${encodeURIComponent(term)}`);
    return;
  }
  closeSearch();

  const allPosts = window.allSearchablePosts || [];
  const filtered = allPosts.filter((p) =>
    p.title.toLowerCase().includes(term.toLowerCase()),
  );

  if (filtered.length > 0) {
    renderBlogGrid(filtered.slice(0, 10), grid);
  } else {
    const randomRelated = allPosts.sort(() => 0.5 - Math.random()).slice(0, 3);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; margin-bottom: 2rem;">
        <h3>No matches found for "${term}"</h3>
        <p style="color: var(--text-muted);">But you might find these interesting:</p>
      </div>
    `;
    const cardsHtml = randomRelated
      .map((post) => createPostCardHtml(post))
      .join("");
    grid.innerHTML += cardsHtml;

    initIcons();
    initObservers();
  }
}

function createPostCardHtml(post) {
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const bgStyle = post.image_url
    ? `background-image: url('${post.image_url}')`
    : "background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)";

  return `
    <a href="/pulse/?slug=${post.slug || post.id}&trackingid=${generateTrackingId()}" class="blog-card fade-in" style="text-decoration: none;">
      <div class="blog-img" style="${bgStyle}"></div>
      <div class="blog-body">
        <span class="blog-cat">${post.category || "Insight"}</span>
        <h3 class="blog-title">${post.title}</h3>
        <p class="blog-excerpt">${post.excerpt || ""}</p>
        <div class="blog-footer">
           <span>${date}</span>
           <span style="display: flex; align-items: center; gap: 4px; font-weight: 500; color: var(--accent);">
             Read <i data-lucide="arrow-right" style="width: 14px;"></i>
           </span>
        </div>
      </div>
    </a>
  `;
}

function generateTrackingId() {
  return "tid_" + Math.random().toString(36).substring(2, 9);
}

function renderBlogGrid(posts, gridElement) {
  if (posts.length === 0) {
    gridElement.innerHTML = "<div class='no-results'>No articles found.</div>";
    return;
  }
  gridElement.innerHTML = posts.map(createPostCardHtml).join("");
  initIcons();
  initObservers();
}

async function loadLatestPosts() {
  const grid = document.getElementById("latest-posts-grid");
  if (!grid || !window.supabaseClient) return;

  const { data: posts } = await window.supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (posts && posts.length > 0) {
    grid.innerHTML = posts.map(createPostCardHtml).join("");
    initIcons();
    initObservers();
  } else {
    grid.innerHTML = "<p>No articles found.</p>";
  }
}

async function loadPosts() {
  const grid = document.getElementById("posts-grid");
  if (!grid || !window.supabaseClient) return;

  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  const { data: posts } = await window.supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (posts) {
    window.allSearchablePosts = posts;
    if (q) {
      performSearch(q);
    } else {
      renderBlogGrid(posts, grid);
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "k" || e.key === "f")) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === "Escape") closeSearch();
});

function initCookieConsent() {
  const CONSENT_KEY = "cookie_consent_accepted";
  const hasConsented = localStorage.getItem(CONSENT_KEY);

  if (hasConsented) {
    const existing = document.getElementById("cookie-banner");
    if (existing) existing.remove();
    return;
  }

  if (document.getElementById("cookie-banner")) return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.innerHTML = `
      <div class="cookie-text">
        <p>
          I use cookies to enhance your experience. By continuing to visit this site you agree to my use of cookies.
          <a href="/privacy">Learn more</a>.
        </p>
      </div>
      <div class="cookie-actions">
        <button id="accept-cookies" class="btn btn-primary" style="padding: 0.6rem 1.2rem; background: var(--text-main); color: #fff;">
          Accept
        </button>
      </div>
    `;

  document.body.appendChild(banner);

  setTimeout(() => banner.classList.add("visible"), 100);

  setTimeout(() => {
    const btn = document.getElementById("accept-cookies");
    if (btn) {
      btn.onclick = () => {
        localStorage.setItem(CONSENT_KEY, "true");
        banner.classList.remove("visible");
        setTimeout(() => banner.remove(), 400);
      };
    }
  }, 500);
}

let currentPostId = null;

async function initViewerPage() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug") || params.get("id");

  if (!slug) {
    const path = window.location.pathname;
    const match = path.match(/\/pulse\/([^\/]+)/);
    if (match && match[1]) {
      slug = match[1];
    }
  }

  if (!slug) {
    if (window.location.hash && window.location.hash.includes("access_token")) {
      slug = localStorage.getItem("pending_auth_slug");
    }
  }

  if (!slug) {
    if (
      window.location.pathname.endsWith("/pulse/index.html") ||
      window.location.pathname.endsWith("/pulse/")
    ) {
      window.location.href = "/blog";
      return;
    }
    window.location.href = "/blog";
    return;
  }

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname,
  );

  if (!isLocal && slug && window.location.pathname.includes("/pulse/")) {
    const trackingId = params.get("trackingid");
    let newUrl = `/pulse/${slug}`;
    if (trackingId) {
      newUrl += `?trackingid=${trackingId}`;
    }

    if (!window.location.pathname.endsWith(slug)) {
      if (window.location.hash) {
        newUrl += window.location.hash;
      }
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }

  checkAuth();

  document.body.style.overflow = "auto";
  document.documentElement.style.overflow = "auto";

  loadArticle(slug);

  const loginBtn = document.getElementById("google-login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const origin = window.location.origin;
      let redirectUrl = `${origin}/pulse/index.html?slug=${encodeURIComponent(slug)}`;

      localStorage.setItem("pending_auth_slug", slug);

      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        alert("Sign-in failed: " + error.message);
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.supabaseClient.auth.signOut();
      checkAuth();

      document.body.style.overflow = "auto";
    });
  }

  const commentForm = document.getElementById("comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmit);
  }

  const copyBtn = document.getElementById("btn-copy-link");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
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
      const title =
        document.getElementById("article-title")?.textContent.trim() ||
        document.title;
      const excerpt =
        document.querySelector('meta[name="description"]')?.content || "";

      const articleBodyText =
        document.getElementById("article-body")?.innerText || "";
      const contentSnippet = articleBodyText.substring(0, 300) + "...";

      const origin = window.location.origin;
      const shareUrl = `${origin}/pulse/?slug=${slug}&trackingid=${generateTrackingId()}`;

      const text = `I just read this post by Khushaank Gupta: "${title}"\n\n${contentSnippet}\n\nRead on the link: ${shareUrl}`;

      const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
        text,
      )}`;

      window.open(linkedinUrl, "_blank");
    });
  }

  const embedBtn = document.getElementById("btn-embed");
  if (embedBtn) {
    embedBtn.addEventListener("click", () => {
      const title = document
        .getElementById("article-title")
        ?.textContent.trim();
      const excerpt =
        document.querySelector('meta[name="description"]')?.content || "";
      const origin = window.location.origin;
      const shareUrl = `${origin}/pulse/?slug=${slug}&trackingid=${generateTrackingId()}`;

      const embedHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 600px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); color: #1e293b;">
  <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase;">Khushaank Gupta Insights</div>
  <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">${title}</h3>
  <p style="margin: 0 0 20px 0; color: #475569; line-height: 1.6; font-size: 16px;">${excerpt}</p>
  <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
    <a href="${shareUrl}" target="_blank" style="display: inline-flex; align-items: center; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; font-size: 14px; transition: background 0.2s;">
      Read Full Article
      <span style="display: inline-block; margin-left: 6px;">→</span>
    </a>
  </div>
</div>`;

      navigator.clipboard.writeText(embedHtml).then(() => {
        const originalText = embedBtn.innerHTML;
        embedBtn.innerHTML = `<i data-lucide="check" size="16"></i> Copied Code`;
        lucide.createIcons();
        setTimeout(() => {
          embedBtn.innerHTML = originalText;
          lucide.createIcons();
        }, 2000);
      });
    });
  }
}

function initInteractions(data) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    image: [
      data.image_url || "https://khushaankgupta.qzz.io/assets/images/hero.png",
    ],
    datePublished: data.created_at,
    dateModified: data.created_at,
    author: [
      {
        "@type": "Person",
        name: "Khushaank Gupta",
        url: "https://khushaankgupta.qzz.io",
      },
    ],
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);

  const clapBtn = document.getElementById("clap-btn");
  const clapCount = document.getElementById("clap-count");
  let claps = data.claps || 0;

  if (clapCount) clapCount.textContent = claps;

  if (clapBtn) {
    const clapKey = `clapped_${data.id}`;
    const hasClapped = localStorage.getItem(clapKey);

    if (hasClapped) {
      clapBtn.classList.add("clapped");
      clapBtn.disabled = true;
      clapBtn.title = "You've already liked this article";
    }

    clapBtn.addEventListener("click", async () => {
      const {
        data: { session },
      } = await window.supabaseClient.auth.getSession();

      if (!session) {
        alert("Please sign in to like this article");
        const loginBtn = document.getElementById("google-login-btn");
        if (loginBtn) {
          loginBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          loginBtn.focus();
        }
        return;
      }

      if (hasClapped) {
        return;
      }

      claps++;
      clapCount.textContent = claps;
      clapBtn.classList.add("clapped");
      clapBtn.disabled = true;
      clapBtn.title = "You've already liked this article";

      localStorage.setItem(clapKey, "true");

      try {
        await window.supabaseClient.rpc("increment_claps", {
          post_id: data.id,
        });
      } catch (err) {
        console.error("Error clapping:", err);

        claps--;
        clapCount.textContent = claps;
        clapBtn.classList.remove("clapped");
        clapBtn.disabled = false;
        localStorage.removeItem(clapKey);
      }
    });
  }

  const scrollTopBtn = document.getElementById("scroll-top-btn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 500) {
        scrollTopBtn.classList.add("visible");
      } else {
        scrollTopBtn.classList.remove("visible");
      }
    });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const NEWSLETTER_KEY = "newsletter_interacted";
  const CONSENT_KEY = "cookie_consent_accepted";
  const nlSlidein = document.getElementById("newsletter-slidein");
  const nlClose = document.getElementById("nl-close");
  const linkedinBtn = document.getElementById("linkedin-follow-btn");

  const hasConsented = localStorage.getItem(CONSENT_KEY);
  const hasInteracted = localStorage.getItem(NEWSLETTER_KEY);

  if (nlSlidein && hasConsented && !hasInteracted) {
    let hasShown = false;

    window.addEventListener("scroll", () => {
      if (hasShown) return;

      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      if (scrollPercent > 50 && !nlSlidein.classList.contains("active")) {
        nlSlidein.classList.add("active");
        hasShown = true;
      }
    });

    if (nlClose) {
      nlClose.addEventListener("click", () => {
        nlSlidein.classList.remove("active");
        localStorage.setItem(NEWSLETTER_KEY, "dismissed");
      });
    }

    if (linkedinBtn) {
      linkedinBtn.addEventListener("click", async () => {
        localStorage.setItem(NEWSLETTER_KEY, "followed");
        nlSlidein.classList.remove("active");

        if ("Notification" in window && Notification.permission === "default") {
          try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              new Notification("Thanks for following! 🎉", {
                body: "You'll get notified about new insights and articles.",
                icon: "/assets/images/logo.png",
                badge: "/assets/images/logo.png",
              });
            }
          } catch (err) {
            console.log("Notification permission:", err);
          }
        }
      });
    }
  }
}

async function loadArticle(slug) {
  if (!window.supabaseClient) return;

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
    document.getElementById("article-loading").style.display = "none";
    document.getElementById("article-display").style.display = "block";

    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    currentPostId = data.id;

    document.title = `${data.title} - Khushaank Gupta`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = data.excerpt || data.title;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = data.title;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = data.excerpt || "";

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = window.location.href;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && data.image_url) ogImage.content = data.image_url;

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
    const bodyContainer = document.getElementById("article-body");
    bodyContainer.innerHTML = data.content;

    const allLinks = bodyContainer.querySelectorAll("a");
    allLinks.forEach((link) => {
      let href = link.getAttribute("href");
      if (
        href &&
        !href.startsWith("/") &&
        !href.match(/^(https?:\/\/|mailto:|tel:|#)/)
      ) {
        if (href.indexOf(".") > -1 && href.indexOf(" ") === -1) {
          link.setAttribute("href", "https://" + href);
        }
      }

      if (link.parentNode.tagName === "CODE") {
        const codeTag = link.parentNode;

        codeTag.parentNode.insertBefore(link, codeTag);

        if (!codeTag.textContent.trim()) {
          codeTag.remove();
        }
      }
    });

    window.supabaseClient.rpc("increment_post_view", { p_id: data.id });

    calculateReadingTime(data.content);
    calculateReadingTime(data.content);

    initInteractions(data);
    initArticleSearch();
    initArticleNavigation(data);
    initImageLightbox();
    initLinkPreview();
    initFocusMode();
    loadRelatedPosts(data);

    lucide.createIcons();

    loadComments(data.id);
  }
}

function calculateReadingTime(contentHTML) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = contentHTML;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const timeElement = document.getElementById("reading-time");
  if (timeElement) {
    timeElement.textContent = `${readingTime} min read`;
  }
}

function generateTOC() {
  const articleBody = document.getElementById("article-body");
  const tocList = document.getElementById("floating-toc-list");
  const tocContainer = document.getElementById("floating-toc");

  if (!articleBody || !tocList || !tocContainer) return;

  tocList.innerHTML = "";

  const headers = articleBody.querySelectorAll("h2, h3");

  if (headers.length < 2) {
    tocContainer.style.display = "none";
    return;
  }

  tocContainer.style.display = "block";

  headers.forEach((header, index) => {
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
    a.className = `floating-toc-link floating-toc-${header.tagName.toLowerCase()}`;

    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(header.id).scrollIntoView({
        behavior: "smooth",
      });

      history.pushState(null, null, `#${header.id}`);
    });

    li.appendChild(a);
    tocList.appendChild(li);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          document.querySelectorAll(".floating-toc-link").forEach((link) => {
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

  const updateProgress = () => {
    const relatedSection = document.getElementById("related-reading");
    let totalHeight;

    if (
      relatedSection &&
      relatedSection.offsetParent !== null &&
      relatedSection.offsetTop > 0
    ) {
      totalHeight = relatedSection.offsetTop - window.innerHeight;
    } else {
      totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    }
  };
}

function initNewsletter() {
  const forms = [
    document.getElementById("newsletter-form"),
    document.getElementById("newsletter-slidein-form"),
  ];

  forms.forEach((form) => {
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type='submit']");
      const input = form.querySelector("input[type='email']");
      const originalText = btn ? btn.innerHTML : "Subscribe";

      if (!input.value) return;

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>...`;
      }

      try {
        if (!window.supabaseClient)
          throw new Error("Supabase client not initialized");

        const { error } = await window.supabaseClient
          .from("subscribers")
          .insert([{ email: input.value }]);

        if (error) {
          if (error.code === "23505") {
            alert("You are already subscribed!");
          } else {
            throw error;
          }
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
        } else {
          if (form.id === "newsletter-slidein-form") {
            form.innerHTML = `
              <div style="text-align: center; color: #16a34a; font-weight: 600; padding: 0.5rem;">
                <i data-lucide="check" style="vertical-align: middle; margin-right: 4px;"></i> Subscribed!
              </div>
             `;
            lucide.createIcons();

            localStorage.setItem("newsletter_interacted", "subscribed");
            setTimeout(() => {
              const slidein = document.getElementById("newsletter-slidein");
              if (slidein) slidein.classList.remove("active");
            }, 2000);
          } else {
            const parent = form.parentElement;
            parent.innerHTML = `
              <div style="text-align: center; padding: 1rem; color: #16a34a; background: #dcfce7; border-radius: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <strong>Subscribed!</strong>
                </div>
                <p style="margin: 0; font-size: 0.9rem;">Check your inbox soon.</p>
              </div>
            `;
          }
        }
      } catch (err) {
        console.error("Newsletter error:", err);
        alert("Something went wrong. Please try again.");
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
    });
  });
}

function initContactForm() {
  const form = document.querySelector(
    'form[action="https://api.web3forms.com/submit"]',
  );
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : "Send Message";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="loading-spinner"></span> Sending...`;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const web3Promise = fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      let supabasePromise = Promise.resolve();
      if (window.supabaseClient) {
        supabasePromise = window.supabaseClient.from("messages").insert([
          {
            name: data.name,
            email: data.email,
            subject: data.subject || "Contact Form Submission",
            message: data.message,
          },
        ]);
      }

      const [response, supabaseResult] = await Promise.all([
        web3Promise,
        supabasePromise,
      ]);

      if (response.ok) {
        const card = form.closest(".contact-form-card");
        if (card) {
          card.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; animation: fadeIn 0.5s ease;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; margin-bottom: 1.5rem;">
                <i data-lucide="check" size="32"></i>
              </div>
              <h3 style="margin-bottom: 0.5rem;">Message Sent!</h3>
              <p style="color: var(--text-muted);">Thanks for reaching out. I'll get back to you shortly.</p>
              <button class="btn btn-outline" style="margin-top: 1.5rem;" onclick="location.reload()">Send Another</button>
            </div>
          `;
          if (typeof lucide !== "undefined") lucide.createIcons();
        } else {
          alert("Message sent successfully!");
          form.reset();
        }
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again later.");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
      }
    }
  });
}

async function loadComments(postId, retries = 0) {
  const list = document.getElementById("comments-list");
  if (!list) return;

  if (!window.supabaseClient) {
    if (retries < 10) {
      setTimeout(() => loadComments(postId, retries + 1), 300);
    } else {
      list.innerHTML =
        '<p style="color: var(--text-muted);">Could not load comments.</p>';
    }
    return;
  }

  const { data: comments, error } = await window.supabaseClient
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading comments:", error);
    list.innerHTML = "<p>Could not load comments.</p>";
    return;
  }

  if (!comments || comments.length === 0) {
    list.innerHTML =
      '<p style="color: var(--text-muted); font-style: italic;">No comments yet. Be the first to say something!</p>';
  } else {
    list.innerHTML = comments
      .map((c) => {
        const isAuthor =
          c.user_name === "Khushaank Gupta" || c.user_name === "Khushaank";
        const authorClass = isAuthor ? " author-comment" : "";
        const badge = isAuthor
          ? '<span class="author-badge">Author</span>'
          : "";
        const dateStr = new Date(c.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `
          <div class="comment-card${authorClass}">
            <div class="comment-header">
              <span class="comment-author">${c.user_name}${badge}</span>
              <span class="comment-date">${dateStr}</span>
            </div>
            <div class="comment-body">${c.content}</div>
          </div>
        `;
      })
      .join("");
  }
}

async function checkAuth(retries = 0) {
  if (!window.supabaseClient) {
    if (retries < 10) {
      setTimeout(() => checkAuth(retries + 1), 300);
    } else {
      const loginSection = document.getElementById("auth-comment");
      if (loginSection) loginSection.style.display = "block";
      console.warn("Supabase client not available after retries");
    }
    return;
  }

  const updateUI = (session) => {
    const loginSection = document.getElementById("auth-comment");
    const formSection = document.getElementById("comment-form");
    const userDisplay = document.getElementById("user-display-name");

    if (session && session.user) {
      if (loginSection) loginSection.style.display = "none";
      if (formSection) formSection.style.display = "block";
      if (userDisplay) {
        let name = session.user.email;
        if (
          session.user.user_metadata &&
          session.user.user_metadata.full_name
        ) {
          name = session.user.user_metadata.full_name;
        }
        userDisplay.textContent = `Posting as ${name}`;
      }
    } else {
      if (loginSection) loginSection.style.display = "block";
      if (formSection) formSection.style.display = "none";
    }
  };

  try {
    const {
      data: { session },
    } = await window.supabaseClient.auth.getSession();

    updateUI(session);

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      updateUI(session);
    });
  } catch (err) {
    console.error("checkAuth error:", err);

    const loginSection = document.getElementById("auth-comment");
    if (loginSection) loginSection.style.display = "block";
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

function initArticleSearch() {
  const searchBar = document.getElementById("article-search-bar");
  const input = document.getElementById("article-search-input");
  const closeBtn = document.getElementById("search-close");
  const prevBtn = document.getElementById("search-prev");
  const nextBtn = document.getElementById("search-next");
  const countDisplay = document.getElementById("search-results-count");
  const articleBody = document.getElementById("article-body");

  if (!searchBar || !input || !articleBody) return;

  let currentMatch = -1;
  let matches = [];
  let isSearching = false;

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      articleOpenSearch();
    }
    if (e.key === "Escape" && searchBar.classList.contains("active")) {
      articleCloseSearch();
    }
  });

  function articleOpenSearch() {
    searchBar.classList.add("active");
    setTimeout(() => {
      input.focus();
      if (input.value) input.select();
    }, 100);
    isSearching = true;
  }

  function articleCloseSearch() {
    searchBar.classList.remove("active");
    clearHighlights();
    input.value = "";
    countDisplay.textContent = "0/0";
    isSearching = false;
  }

  closeBtn.addEventListener("click", articleCloseSearch);

  input.addEventListener("input", () => {
    articlePerformSearch(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) prevMatch();
      else nextMatch();
    }
  });

  if (prevBtn) prevBtn.addEventListener("click", prevMatch);
  if (nextBtn) nextBtn.addEventListener("click", nextMatch);

  function articlePerformSearch(query) {
    clearHighlights();
    matches = [];
    currentMatch = -1;

    if (!query || query.trim().length < 2) {
      countDisplay.textContent = "0/0";
      return;
    }

    highlightMatches(articleBody, query.trim());
    matches = Array.from(articleBody.querySelectorAll("mark.search-highlight"));

    if (matches.length > 0) {
      currentMatch = 0;
      updateStatus();
      scrollToMatch();
    } else {
      countDisplay.textContent = "0/0";
    }
  }

  function highlightMatches(root, query) {
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    const walk = (node) => {
      if (node.nodeType === 3) {
        const val = node.nodeValue;
        const queryMatches = val.match(regex);
        if (queryMatches) {
          const frag = document.createDocumentFragment();
          let lastIdx = 0;
          regex.lastIndex = 0;
          val.replace(regex, (match, p1, offset) => {
            frag.appendChild(
              document.createTextNode(val.slice(lastIdx, offset)),
            );

            const mark = document.createElement("mark");
            mark.className = "search-highlight";
            mark.textContent = match;
            frag.appendChild(mark);
            lastIdx = offset + match.length;
            return match;
          });

          frag.appendChild(document.createTextNode(val.slice(lastIdx)));
          node.parentNode.replaceChild(frag, node);
        }
      } else if (
        node.nodeType === 1 &&
        node.childNodes &&
        !/(script|style|mark|header|footer)/i.test(node.tagName)
      ) {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    walk(root);
  }

  function clearHighlights() {
    const marks = articleBody.querySelectorAll("mark.search-highlight");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  function nextMatch() {
    if (matches.length === 0) return;
    currentMatch = (currentMatch + 1) % matches.length;
    updateStatus();
    scrollToMatch();
  }

  function prevMatch() {
    if (matches.length === 0) return;
    currentMatch = (currentMatch - 1 + matches.length) % matches.length;
    updateStatus();
    scrollToMatch();
  }

  function updateStatus() {
    countDisplay.textContent = `${currentMatch + 1}/${matches.length}`;
    matches.forEach((el, i) =>
      el.classList.toggle("current", i === currentMatch),
    );
  }

  function scrollToMatch() {
    if (matches[currentMatch]) {
      const el = matches[currentMatch];
      const navHeight = 80;
      const y =
        el.getBoundingClientRect().top + window.pageYOffset - navHeight - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }
}

async function initArticleNavigation(currentPost) {
  if (!window.supabaseClient) return;

  const { data: posts, error } = await window.supabaseClient
    .from("posts")
    .select("slug, id, title")
    .order("created_at", { ascending: false });

  if (error || !posts) return;

  const currentIndex = posts.findIndex((p) => p.id === currentPost.id);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (nextPost) {
          window.location.href = `/pulse/?slug=${nextPost.slug || nextPost.id}`;
        } else {
          console.log("Already at the latest article.");
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (prevPost) {
          window.location.href = `/pulse/?slug=${prevPost.slug || prevPost.id}`;
        } else {
          console.log("Already at the first article.");
        }
      }
    }
  });
}

function initImageLightbox() {
  const articleBody = document.getElementById("article-body");
  if (!articleBody) return;

  let lightbox = document.querySelector(".article-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "article-lightbox";
    lightbox.innerHTML = `<img src="" alt="Lightbox">`;
    document.body.appendChild(lightbox);
  }

  const lightboxImg = lightbox.querySelector("img");

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => {
      lightboxImg.src = "";
    }, 300);
  }

  articleBody.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") {
      openLightbox(e.target.src);
    }
  });

  lightbox.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
}

async function loadRelatedPosts(currentPost) {
  if (!window.supabaseClient) return;

  const section = document.getElementById("related-reading");
  const grid = document.getElementById("related-posts-grid");
  if (!section || !grid) return;

  let { data: related, error } = await window.supabaseClient
    .from("posts")
    .select("*")
    .eq("category", currentPost.category)
    .neq("id", currentPost.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !related || related.length === 0) {
    const { data: fallback } = await window.supabaseClient
      .from("posts")
      .select("*")
      .neq("id", currentPost.id)
      .order("created_at", { ascending: false })
      .limit(3);
    related = fallback || [];
  }

  if (related.length > 0) {
    section.style.display = "block";
    grid.innerHTML = related
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
            <h3 class="post-title" style="font-size: 1.1rem;">${post.title}</h3>
            <p class="post-excerpt" style="font-size: 0.9rem; -webkit-line-clamp: 2;">${post.excerpt || ""}</p>
            <span class="read-more">Read Article <i data-lucide="arrow-right" size="16"></i></span>
          </div>
        </a>
      `,
      )
      .join("");

    if (typeof lucide !== "undefined") lucide.createIcons();

    grid.querySelectorAll(".fade-in").forEach((el) => {
      if (typeof observer !== "undefined") observer.observe(el);
      else el.classList.add("visible");
    });
  }
}

function initFocusMode() {
  const indicator = document.createElement("div");
  indicator.className = "focus-mode-indicator";
  indicator.textContent = "Focus Mode Active — Shift + F to exit";
  document.body.appendChild(indicator);

  function toggleFocusMode() {
    const isActive = document.body.classList.toggle("focus-mode");
    if (isActive) {
      indicator.textContent = "Focus Mode Active — Shift + F to exit";
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "f") {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      )
        return;

      e.preventDefault();
      toggleFocusMode();
    }

    if (e.key === "Escape" && document.body.classList.contains("focus-mode")) {
      document.body.classList.remove("focus-mode");
    }
  });
}

function initLinkPreview() {
  const mainContent = document.querySelector("main");
  if (!mainContent) return;

  let previewCard = document.querySelector(".link-preview-card");
  if (!previewCard) {
    previewCard = document.createElement("div");
    previewCard.className = "link-preview-card";
    document.body.appendChild(previewCard);
  }

  const cache = new Map();
  let showTimeout;
  let hideTimeout;

  const showPreview = async (link, identifier, type) => {
    clearTimeout(hideTimeout);
    const rect = link.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    previewCard.style.left = `${rect.left + window.scrollX}px`;
    previewCard.style.top = `${rect.top + scrollTop - 10}px`;
    previewCard.innerHTML = `
      <div class="preview-card-loader">
        <div class="preview-loader-pulse"></div>
        <div style="font-size: 0.75rem; color: var(--text-muted)">Loading preview...</div>
      </div>
    `;
    previewCard.classList.add("active");

    const cardRect = previewCard.getBoundingClientRect();
    let top = rect.top + scrollTop - cardRect.height - 15;
    if (top < scrollTop + 10) {
      top = rect.bottom + scrollTop + 15;
    }
    previewCard.style.top = `${top}px`;

    if (type === "internal") {
      let postData = cache.get(identifier);
      if (!postData) {
        const { data, error } = await window.supabaseClient
          .from("posts")
          .select("title, excerpt, image_url")
          .eq("slug", identifier)
          .maybeSingle();

        if (!error && data) {
          postData = data;
          cache.set(identifier, data);
        } else {
          const { data: idData } = await window.supabaseClient
            .from("posts")
            .select("title, excerpt, image_url")
            .eq("id", identifier)
            .maybeSingle();
          postData = idData;
          if (idData) cache.set(identifier, idData);
        }
      }

      if (postData) {
        previewCard.innerHTML = `
            ${
              postData.image_url
                ? `<div class="preview-card-image" style="background-image: url('${postData.image_url}')"></div>`
                : '<div class="preview-card-image" style="background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)"></div>'
            }
            <div class="preview-card-content">
            <div class="preview-card-title">${postData.title}</div>
            <div class="preview-card-excerpt">${postData.excerpt || "No summary available."}</div>
            </div>
        `;
      } else {
        previewCard.classList.remove("active");
      }
    } else {
      try {
        const urlObj = new URL(identifier);
        const domain = urlObj.hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        previewCard.innerHTML = `
                <div class="preview-card-content" style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <img src="${favicon}" alt="Favicon" style="width: 24px; height: 24px; border-radius: 4px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${domain}</span>
                    </div>
                    <div class="preview-card-title" style="font-size: 0.95rem; margin-bottom: 0.25rem; word-break: break-all;">${identifier}</div>
                    <div class="preview-card-excerpt">Click to visit external site <i data-lucide="external-link" size="12" style="display: inline; vertical-align: middle;"></i></div>
                </div>
            `;
        lucide.createIcons();
      } catch (e) {
        previewCard.classList.remove("active");
      }
    }
  };

  const hidePreview = () => {
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(() => {
      previewCard.classList.remove("active");
    }, 300);
  };

  const links = mainContent.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      link.closest(".nav-links") ||
      link.closest(".footer-links")
    )
      return;

    try {
      const url = new URL(href, window.location.origin);

      if (
        url.origin === window.location.origin &&
        (href.includes("/pulse/") || href.match(/\/pulse\/[^\/]+$/))
      ) {
        let slug = null;
        if (href.includes("slug=")) {
          const params = new URLSearchParams(url.search);
          slug = params.get("slug");
        } else {
          const parts = url.pathname.split("/");
          if (parts.length >= 3 && parts[1] === "pulse") {
            slug = parts[2];
          }
        }

        if (slug) {
          link.addEventListener("mouseenter", () => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(
              () => showPreview(link, slug, "internal"),
              300,
            );
          });
          link.addEventListener("mouseleave", hidePreview);
        }
      } else if (
        url.protocol.startsWith("http") &&
        url.origin !== window.location.origin
      ) {
        link.addEventListener("mouseenter", () => {
          clearTimeout(hideTimeout);
          showTimeout = setTimeout(
            () => showPreview(link, href, "external"),
            300,
          );
        });
        link.addEventListener("mouseleave", hidePreview);
      }
    } catch (e) {}
  });

  previewCard.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
  previewCard.addEventListener("mouseleave", hidePreview);
}

function initAICardEffects() {
  const cards = document.querySelectorAll(".ai-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

const navScript = document.createElement("script");
navScript.src = "/assets/js/nav-algorithm.js";
document.body.appendChild(navScript);

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initIcons();
  initObservers();

  const articleBody = document.getElementById("article-body");
  if (articleBody) {
    initViewerPage();
    initArticleSearch();
    initLinkPreview();
    initFocusMode();

    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get("trackingid");
  }

  if (document.querySelector(".ai-card")) {
    initAICardEffects();
  }

  const yearSpan = document.getElementById("current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});

async function trackPageView() {
  if (!window.supabaseClient) return;

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )
    return;

  let trackingId = localStorage.getItem("tracking_id");
  if (!trackingId) {
    trackingId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
    localStorage.setItem("tracking_id", trackingId);
  }

  const payload = {
    page_path: window.location.pathname + window.location.search,
    referrer: document.referrer || "Direct",
    user_agent: navigator.userAgent,
    tracking_id: trackingId,
  };

  try {
    window.supabaseClient
      .from("page_views")
      .insert([payload])
      .then(() => {});
  } catch (err) {}
}

function openSearch() {
  const overlay = document.querySelector(".search-overlay");
  if (overlay) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    const input = overlay.querySelector(".search-input");
    if (input) setTimeout(() => input.focus(), 50);
  }
}

function closeSearch() {
  const overlay = document.querySelector(".search-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function performSearch(query) {
  if (!query) return;

  window.location.href = `/blog?q=${encodeURIComponent(query)}`;
}

window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.performSearch = performSearch;

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".close-search");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeSearch);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });
});
