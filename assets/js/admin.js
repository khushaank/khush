const SUPABASE_URL = "https://hzxwqxmldlncrhqxlnlq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eHdxeG1sZGxuY3JocXhsbmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODIwMDEsImV4cCI6MjA4NTc1ODAwMX0.pP3i8KquZmqhiUkaTw3ROi86mslTyzK5ysD2va1JI10";

if (typeof window.supabaseClient === "undefined") {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
}
const supabaseClient = window.supabaseClient;

let quill;
document.addEventListener("DOMContentLoaded", () => {
  const Link = Quill.import("formats/link");
  const originalSanitize = Link.sanitize;
  Link.sanitize = function (url) {
    if (!url) return "";
    let value = url.trim();

    if (/^(https?:\/\/|mailto:|tel:|#|\/)/.test(value)) {
    } else if (value.indexOf(".") > -1 && value.indexOf(" ") === -1) {
      value = "https://" + value;
    }

    return originalSanitize ? originalSanitize(value) : value;
  };

  quill = new Quill("#editor-container", {
    theme: "snow",
    placeholder: "Write your article content here...",
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    },
  });

  function imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        await uploadAndInsertImage(file);
      }
    };
  }

  quill.root.addEventListener("paste", async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (
      clipboardData &&
      clipboardData.files &&
      clipboardData.files.length > 0
    ) {
      e.preventDefault();
      const file = clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        await uploadAndInsertImage(file);
      }
    }
  });

  async function uploadAndInsertImage(file) {
    const range = quill.getSelection(true);

    quill.insertText(range.index, "Uploading image...", "bold", true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from("blog-images")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("blog-images").getPublicUrl(filePath);

      quill.deleteText(range.index, "Uploading image...".length);
      quill.insertEmbed(range.index, "image", publicUrl);
    } catch (error) {
      // console.error("Upload failed:", error);
      quill.deleteText(range.index, "Uploading image...".length);
      alert("Image upload failed: " + error.message);
    }
  }

  const urlRegex =
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;

  quill.on("text-change", function (delta, oldDelta, source) {
    if (source !== "user") return;

    const range = quill.getSelection();
    if (!range) return;

    const leaf = quill.getLeaf(range.index - 1)[0];
    if (!leaf || !leaf.text) return;

    const lastChar = leaf.text.slice(-1);
    if (!/\s/.test(lastChar)) return;

    const [line, offset] = quill.getLine(range.index);
    const text = line.domNode.textContent;

    const words = text.split(/\s+/);

    const lastWord = words[words.length - 2];

    if (lastWord && urlRegex.test(lastWord)) {
      let urlToCheck = lastWord;
      if (!urlToCheck.match(/^https?:\/\//i)) {
        if (urlToCheck.match(/^www\./) || urlToCheck.indexOf(".") > -1) {
          urlToCheck = "https://" + urlToCheck;
        }
      }

      const index = range.index - lastWord.length - 1;
      const format = quill.getFormat(index, lastWord.length);

      if (!format.link) {
        quill.formatText(index, lastWord.length, "link", urlToCheck, "api");
      }
    }
  });
});

let allPosts = [];

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    fetchPosts();
  } else {
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Signing in...";
  btn.disabled = true;

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("auth-error");
  errorMsg.textContent = "";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorMsg.textContent = error.message;
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

async function signOut() {
  await supabaseClient.auth.signOut();
}

async function fetchPosts() {
  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // console.error("Error fetching posts:", error);
    return;
  }

  allPosts = posts;
  updateStats(posts);
  renderTable(posts);
  fetchVisitorStats();
  if (!document.getElementById("view-analytics").classList.contains("hidden")) {
    fetchAnalytics();
  }
}

async function fetchAnalytics() {
  const container = document.getElementById("analytics-dashboard");

  if (!container) return;

  const { data: rawViews, error: viewError } = await supabaseClient
    .from("page_views")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (viewError) {
    // console.error("Analytics fetch error:", viewError);
    container.innerHTML = `<div class="error-msg">Error loading analytics: ${viewError.message}</div>`;
    return;
  }

  const views = rawViews.filter((v) => {
    const isLocalPath =
      v.page_path &&
      (v.page_path.includes("127.0.0.1") || v.page_path.includes("localhost"));
    const isLocalRef =
      v.referrer &&
      (v.referrer.includes("127.0.0.1") || v.referrer.includes("localhost"));
    return !isLocalPath && !isLocalRef;
  });

  if (views.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; padding: 4rem; color: var(--text-muted);">No production traffic recorded yet.</div>';
    return;
  }

  const totalViews = views.length;
  const uniqueUsers = new Set(views.map((v) => v.tracking_id)).size;

  const today = new Date().toDateString();
  const viewsToday = views.filter(
    (v) => new Date(v.created_at).toDateString() === today,
  ).length;

  const pages = {};

  const referrers = {};

  const devices = { Desktop: 0, Mobile: 0 };

  views.forEach((v) => {
    const path = v.page_path || "/";
    if (!pages[path]) {
      pages[path] = {
        title: formatPathTitle(path),
        views: 0,
        visitors: new Set(),
      };
    }
    pages[path].views++;
    if (v.tracking_id) pages[path].visitors.add(v.tracking_id);

    let ref = v.referrer;
    if (!ref || ref === "Direct" || ref === "") {
      ref = "Direct / None";
    } else {
      try {
        const url = new URL(ref);
        ref = url.hostname.replace("www.", "");
      } catch (e) {
        ref = "Unknown";
      }
    }
    referrers[ref] = (referrers[ref] || 0) + 1;

    if (v.user_agent) {
      const ua = v.user_agent.toLowerCase();
      if (
        ua.includes("mobile") ||
        ua.includes("android") ||
        ua.includes("iphone")
      ) {
        devices.Mobile++;
      } else {
        devices.Desktop++;
      }
    } else {
      devices.Desktop++;
    }
  });

  const articleRows = [];
  const pageRows = [];

  Object.entries(pages).forEach(([path, stats]) => {
    const isArticle = path.includes("/pulse") || path.includes("?slug=");
    const data = {
      path,
      title: stats.title,
      views: stats.views,
      unique: stats.visitors.size,
    };
    if (isArticle) articleRows.push(data);
    else pageRows.push(data);
  });

  articleRows.sort((a, b) => b.views - a.views);
  pageRows.sort((a, b) => b.views - a.views);
  const topReferrers = Object.entries(referrers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  let html = "";

  html += `
      <div class="stats-container">
          <div class="stat-box">
             <div class="stat-icon"><i data-lucide="activity"></i></div>
             <div><div class="stat-value">${totalViews}</div><div class="stat-label">Real Views (Last 200)</div></div>
          </div>
          <div class="stat-box">
             <div class="stat-icon"><i data-lucide="users"></i></div>
             <div><div class="stat-value">${uniqueUsers}</div><div class="stat-label">Active Users</div></div>
          </div>
          <div class="stat-box">
             <div class="stat-icon" style="background:#dcfce7; color:#16a34a"><i data-lucide="calendar"></i></div>
             <div><div class="stat-value">${viewsToday}</div><div class="stat-label">Views Today</div></div>
          </div>
      </div>
    `;

  html += `<div class="analytics-section-title"><i data-lucide="file-text" size="20"></i> Top Articles</div>`;
  if (articleRows.length > 0) {
    html += `<div class="content-grid">`;
    articleRows.slice(0, 6).forEach((p) => {
      html += `
            <div class="article-tile">
                <div class="tile-header">${p.title}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom: auto;">${p.path}</div>
                <div class="tile-stats">
                    <div class="tile-stat-item"><span class="tile-stat-value">${p.views}</span> Views</div>
                    <div class="tile-stat-item"><span class="tile-stat-value">${p.unique}</span> Unique</div>
                </div>
            </div>
            `;
    });
    html += `</div>`;
  } else {
    html += `<p style="color:var(--text-muted); margin-bottom: 2rem;">No article data available.</p>`;
  }

  html += `
      <div class="split-grid" style="margin-top: 2rem;">
          <!-- Top Pages -->
          <div>
               <div class="analytics-section-title"><i data-lucide="layout" size="20"></i> Top Pages</div>
               <div class="list-group">
                  ${pageRows
                    .slice(0, 5)
                    .map(
                      (p) => `
                      <div class="list-item">
                          <div style="display:flex; flex-direction:column;">
                               <span style="font-weight:600">${p.title}</span>
                               <span style="font-size:0.8rem; color:var(--text-muted)">${p.path}</span>
                          </div>
                          <div style="text-align:right">
                               <div style="font-weight:700">${p.views}</div>
                               <div style="font-size:0.75rem; color:var(--text-muted)">views</div>
                          </div>
                      </div>
                  `,
                    )
                    .join("")}
                  ${pageRows.length === 0 ? '<div style="padding:1rem">No page data.</div>' : ""}
               </div>
          </div>
  
          <!-- Audience / Referrers -->
          <div>
               <div class="analytics-section-title"><i data-lucide="globe" size="20"></i> Top Sources</div>
               <div class="list-group">
                  ${topReferrers
                    .map(([ref, count]) => {
                      const percent = Math.round((count / totalViews) * 100);
                      return `
                      <div class="list-item">
                          <div class="progress-bg" style="width: ${percent}%"></div>
                          <div class="list-content">
                              <span>${ref}</span>
                              <span style="font-weight:600">${count}</span>
                          </div>
                      </div>
                      `;
                    })
                    .join("")}
                  ${topReferrers.length === 0 ? '<div style="padding:1rem">No referrer data.</div>' : ""}
               </div>
               
               <!-- Device Stats -->
               <div class="analytics-section-title" style="margin-top: 2rem;"><i data-lucide="smartphone" size="20"></i> Devices</div>
                <div class="list-group">
                   <div class="list-item"><span>Desktop</span> <span style="font-weight:600">${devices.Desktop}</span></div>
                   <div class="list-item"><span>Mobile</span> <span style="font-weight:600">${devices.Mobile}</span></div>
                </div>
          </div>
      </div>
    `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function formatPathTitle(path) {
  if (!path || path === "/" || path === "/index.html") return "Home";

  const urlObj = new URL(path, "https://example.com");
  const slug = urlObj.searchParams.get("slug");

  if (slug) {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  let p = urlObj.pathname.replace(".html", "").replace(/^\/+|\/+$/g, "");
  if (p === "") return "Home";

  return p
    .split("/")
    .map((w) => w.replace(/-/g, " "))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" › ");
}

async function fetchVisitorStats() {
  const { count, error } = await supabaseClient
    .from("visitors")
    .select("*", { count: "exact", head: true });

  if (!error) {
    const el = document.getElementById("total-visitors");
    if (el) el.textContent = count;
  }
}

async function updateStats(posts) {
  document.getElementById("total-posts").textContent = posts.length;
  document.getElementById("total-views").textContent = posts.reduce(
    (sum, p) => sum + (p.views || 0),
    0,
  );

  const { count: siteViews, error } = await supabaseClient
    .from("page_views")
    .select("*", { count: "exact", head: true });

  if (!error) {
    const siteViewsEl = document.getElementById("site-views");
    if (siteViewsEl) siteViewsEl.textContent = siteViews;
  }
}

function renderTable(posts) {
  const tbody = document.getElementById("posts-body");
  const emptyState = document.getElementById("empty-state");
  tbody.innerHTML = "";

  if (posts.length === 0) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  posts.forEach((post) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>
                <div style="font-weight: 600; font-size: 1rem;">${post.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">/pulse/${post.slug || ""}</div>
            </td>
            <td>${new Date(post.created_at).toLocaleDateString()}</td>
            <td>${post.views || 0}</td>
            <td style="text-align: right;">
                <button class="icon-btn" title="Stats" onclick="openStatsModal('${post.slug}', '${post.title.replace(/'/g, "\\'")}', ${post.views || 0})" style="margin-right: 0.5rem;"><i data-lucide="bar-chart-2" size="16"></i></button>
                <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="editPost('${post.id}')"><i data-lucide="pencil" size="14"></i> Edit</button>
                <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;" onclick="deletePost('${post.id}')"><i data-lucide="trash-2" size="14"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

let statsChart = null;

async function openStatsModal(slug, title, totalViews) {
  const modal = document.getElementById("stats-modal");
  document.getElementById("stats-modal-title").textContent = title;
  document.getElementById("stats-total-views").textContent = totalViews;
  document.getElementById("stats-unique-visitors").textContent = "Loading...";
  modal.classList.add("active");

  const pagePath = `/pulse/?slug=${slug}`;
  const { data: views, error } = await supabaseClient
    .from("page_views")
    .select("created_at, tracking_id")
    .ilike("page_path", `${pagePath}%`)
    .order("created_at", { ascending: true });

  if (error) {
    // console.error("Error fetching stats:", error);
    document.getElementById("stats-unique-visitors").textContent = "N/A";
    return;
  }

  const uniqueVisitors = new Set(views.map((v) => v.tracking_id)).size;
  document.getElementById("stats-unique-visitors").textContent = uniqueVisitors;

  const grouped = {};
  views.forEach((v) => {
    const date = new Date(v.created_at).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const dataPoints = Object.values(grouped);

  const ctx = document.getElementById("viewsChart").getContext("2d");
  if (statsChart) statsChart.destroy();

  statsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Views",
          data: dataPoints,
          backgroundColor: "#2563eb",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

window.closeStatsModal = function () {
  document.getElementById("stats-modal").classList.remove("active");
};

document.getElementById("search-input").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter((p) => p.title.toLowerCase().includes(term));
  renderTable(filtered);
});

const modal = document.getElementById("post-modal");
const form = document.getElementById("post-form");
const imageInput = document.getElementById("p-image");
const imagePreview = document.getElementById("image-preview");

imageInput.addEventListener("input", () => {
  const url = imageInput.value;
  if (url) {
    imagePreview.src = url;
    imagePreview.style.display = "block";
  } else {
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
});

function openModal(isEdit = false) {
  modal.classList.add("active");
  document.getElementById("modal-title").textContent = isEdit
    ? "Edit Article"
    : "Create Article";

  if (!isEdit) {
    form.reset();
    document.getElementById("post-id").value = "";
    quill.root.innerHTML = "";
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
}

function closeModal() {
  modal.classList.remove("active");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("post-id").value;
  const title = document.getElementById("p-title").value;
  const excerpt = document.getElementById("p-excerpt").value;

  const content = quill.root.innerHTML;

  const image_url = document.getElementById("p-image").value;
  const file_url = document.getElementById("p-file").value;
  const btn = document.getElementById("save-btn");

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("You must be logged in to save posts.");
    return;
  }

  const originalText = btn.textContent;
  btn.textContent = "Saving...";
  btn.disabled = true;

  const postData = { title, excerpt, content, image_url, file_url };

  let error = null;

  if (id) {
    const { error: err } = await supabaseClient
      .from("posts")
      .update(postData)
      .eq("id", id);
    error = err;
  } else {
    postData.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: newPost, error: err } = await supabaseClient
      .from("posts")
      .insert([postData])
      .select()
      .single();
    error = err;

    if (!err && newPost) {
      await supabaseClient.from("comments").insert([
        {
          post_id: newPost.id,
          user_name: "Khushaank Gupta",
          content:
            "Thank you for visiting this post and reading it! 🙏 Hope you enjoyed it. Follow for more insights and updates on finance, AI, and technology!",
        },
      ]);
    }
  }

  if (error) {
    alert(error.message);
  } else {
    showToast(
      id ? "Article updated successfully" : "Article published successfully",
    );
    closeModal();
    fetchPosts();
  }

  btn.textContent = originalText;
  btn.disabled = false;
});

async function editPost(id) {
  const { data } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (data) {
    document.getElementById("post-id").value = data.id;
    document.getElementById("p-title").value = data.title;
    document.getElementById("p-excerpt").value = data.excerpt;
    document.getElementById("p-image").value = data.image_url || "";

    quill.root.innerHTML = data.content || "";

    if (data.image_url) {
      imagePreview.src = data.image_url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }

    openModal(true);
  }
}

async function deletePost(id) {
  if (confirm("Delete this article? This cannot be undone.")) {
    const { error } = await supabaseClient.from("posts").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      showToast("Article deleted.");
      fetchPosts();
    }
  }
}

window.switchView = function (viewName) {
  const views = {
    dashboard: document.getElementById("view-dashboard"),
    analytics: document.getElementById("view-analytics"),
    subscribers: document.getElementById("view-subscribers"),
    messages: document.getElementById("view-messages"),
    comments: document.getElementById("view-comments"),
    files: document.getElementById("view-files"),
    settings: document.getElementById("view-settings"),
  };
  const navs = {
    dashboard: document.getElementById("nav-dashboard"),
    analytics: document.getElementById("nav-analytics"),
    subscribers: document.getElementById("nav-subscribers"),
    messages: document.getElementById("nav-messages"),
    comments: document.getElementById("nav-comments"),
    files: document.getElementById("nav-files"),
    settings: document.getElementById("nav-settings"),
  };

  Object.keys(views).forEach((v) => {
    if (v === viewName) {
      views[v].classList.remove("hidden");
      navs[v].classList.add("active");
    } else {
      views[v].classList.add("hidden");
      navs[v].classList.remove("active");
    }
  });

  if (viewName === "analytics") {
    fetchAnalytics();
  } else if (viewName === "subscribers") {
    fetchSubscribers();
  } else if (viewName === "messages") {
    fetchMessages();
  } else if (viewName === "comments") {
    fetchComments();
  } else if (viewName === "files") {
    fetchFiles();
  }
};

const defaultSettings = {
  blogTitle: "Khushaank's Blog",
  authorName: "Khushaank",
  tagline: "Thoughts on tech and design...",
  compactView: false,
  autosave: "60",
};

function loadSettings() {
  const saved =
    JSON.parse(localStorage.getItem("adminSettings")) || defaultSettings;

  if (document.getElementById("set-blog-title")) {
    document.getElementById("set-blog-title").value =
      saved.blogTitle || defaultSettings.blogTitle;
    document.getElementById("set-author-name").value =
      saved.authorName || defaultSettings.authorName;
    document.getElementById("set-tagline").value =
      saved.tagline || defaultSettings.tagline;
    document.getElementById("set-compact-view").checked =
      saved.compactView || false;
    document.getElementById("set-autosave").value = saved.autosave || "60";
  }

  applySettings(saved);
}

window.saveSettings = function () {
  const settings = {
    blogTitle: document.getElementById("set-blog-title").value,
    authorName: document.getElementById("set-author-name").value,
    tagline: document.getElementById("set-tagline").value,
    compactView: document.getElementById("set-compact-view").checked,
    autosave: document.getElementById("set-autosave").value,
  };

  localStorage.setItem("adminSettings", JSON.stringify(settings));
  applySettings(settings);
  showToast("Settings saved successfully!");
};

function applySettings(settings) {
  const tableTable = document.getElementById("posts-table");
  if (tableTable) {
    if (settings.compactView) {
      tableTable.classList.add("compact-view");
    } else {
      tableTable.classList.remove("compact-view");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
});

async function fetchSubscribers() {
  const tbody = document.getElementById("subscribers-body");
  const totalEl = document.getElementById("total-subscribers");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="3" style="text-align: center; padding: 2rem;">Loading...</td></tr>';

  const { data: subscribers, error } = await supabaseClient
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // console.error("Error fetching subscribers:", error);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
    return;
  }

  if (totalEl) totalEl.textContent = subscribers.length;

  if (subscribers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No subscribers yet.</td></tr>';
    return;
  }

  tbody.innerHTML = subscribers
    .map((sub) => {
      const date = new Date(sub.created_at).toLocaleDateString();
      return `
      <tr>
        <td>${sub.email}</td>
        <td>${date}</td>
        <td style="text-align: right;">
           <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteSubscriber('${sub.id}')">Remove</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteSubscriber = async function (id) {
  if (confirm("Are you sure you want to remove this subscriber?")) {
    const { error } = await supabaseClient
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      showToast("Subscriber removed.");
      fetchSubscribers();
    }
  }
};

window.exportSubscribers = async function () {
  const { data: subscribers, error } = await supabaseClient
    .from("subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error fetching data for export: " + error.message);
    return;
  }

  if (!subscribers || subscribers.length === 0) {
    alert("No subscribers to export.");
    return;
  }

  const headers = ["Email", "Joined Date"];
  const rows = subscribers.map((sub) => [
    sub.email,
    new Date(sub.created_at).toISOString(),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `subscribers_export_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

async function fetchMessages() {
  const tbody = document.getElementById("messages-body");
  const emptyDiv = document.getElementById("messages-empty");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (emptyDiv) emptyDiv.style.display = "none";

  const { data: messages, error } = await supabaseClient
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Error fetching messages: " + error.message, "error");
    return;
  }

  if (messages.length === 0) {
    if (emptyDiv) emptyDiv.style.display = "block";
    return;
  }

  tbody.innerHTML = messages
    .map((msg) => {
      const date = new Date(msg.created_at).toLocaleString();
      const unreadClass = msg.is_read
        ? ""
        : "font-weight: bold; color: var(--accent);";
      return `
      <tr>
        <td>
          <div style="${unreadClass}">${msg.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted)">${msg.email}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 2px;">${msg.subject}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${msg.message}</div>
        </td>
        <td style="font-size: 0.8rem;">${date}</td>
        <td style="text-align: right;">
          <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="toggleMessageRead('${msg.id}', ${msg.is_read})">
            ${msg.is_read ? "Mark Unread" : "Mark Read"}
          </button>
          <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteMessage('${msg.id}')">Delete</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteMessage = async function (id) {
  if (confirm("Delete this message?")) {
    const { error } = await supabaseClient
      .from("messages")
      .delete()
      .eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("Message deleted.");
      fetchMessages();
    }
  }
};

window.toggleMessageRead = async function (id, currentStatus) {
  const { error } = await supabaseClient
    .from("messages")
    .update({ is_read: !currentStatus })
    .eq("id", id);
  if (error) showToast("Error: " + error.message, "error");
  else fetchMessages();
};

async function fetchFiles() {
  const grid = document.getElementById("files-grid");
  const emptyDiv = document.getElementById("files-empty");
  if (!grid) return;

  grid.innerHTML = "";
  if (emptyDiv) emptyDiv.style.display = "none";

  const { data, error } = await supabaseClient.storage.from("assets").list("", {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    showToast("Error fetching files: " + error.message, "error");
    return;
  }

  if (!data || data.length === 0) {
    if (emptyDiv) emptyDiv.style.display = "block";
    grid.appendChild(emptyDiv);
    return;
  }

  data.forEach((file) => {
    const card = document.createElement("div");
    card.className = "table-card";
    card.style.padding = "1rem";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "0.75rem";

    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    const { data: urlData } = supabaseClient.storage
      .from("assets")
      .getPublicUrl(file.name);
    const publicUrl = urlData.publicUrl;

    card.innerHTML = `
      <div style="height: 120px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        ${isImage ? `<img src="${publicUrl}" style="max-width: 100%; max-height: 100%; object-fit: cover;">` : `<i data-lucide="file-text" size="48" style="color: #cbd5e1"></i>`}
      </div>
      <div style="overflow: hidden;">
        <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${file.name}">${file.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted)">${(file.metadata.size / 1024).toFixed(1)} KB</div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: auto;">
        <button class="btn btn-outline" style="flex: 1; padding: 0.4rem; font-size: 0.7rem;" onclick="copyToClipboard('${publicUrl}')">
          <i data-lucide="copy" size="12"></i> Link
        </button>
        <button class="btn btn-danger" style="padding: 0.4rem; font-size: 0.7rem;" onclick="deleteFile('${file.name}')">
          <i data-lucide="trash-2" size="12"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

window.handleFileUpload = async function (input) {
  const file = input.files[0];
  if (!file) return;

  showToast("Uploading " + file.name + "...");
  const { data, error } = await supabaseClient.storage
    .from("assets")
    .upload(file.name, file, { upsert: true });

  if (error) {
    showToast("Upload failed: " + error.message, "error");
  } else {
    showToast("File uploaded successfully!");
    fetchFiles();
  }
  input.value = "";
};

window.deleteFile = async function (name) {
  if (confirm("Delete this file?")) {
    const { error } = await supabaseClient.storage
      .from("assets")
      .remove([name]);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("File deleted.");
      fetchFiles();
    }
  }
};

window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link copied to clipboard!");
  });
};

window.handlePostFileUpload = async function (input) {
  const file = input.files[0];
  if (!file) return;

  showToast("Uploading attachment...");
  const fileName = `attachments/${Date.now()}_${file.name}`;
  const { data, error } = await supabaseClient.storage
    .from("assets")
    .upload(fileName, file);

  if (error) {
    showToast("Upload failed: " + error.message, "error");
  } else {
    const { data: urlData } = supabaseClient.storage
      .from("assets")
      .getPublicUrl(fileName);
    document.getElementById("p-file").value = urlData.publicUrl;
    showToast("Attachment uploaded!");
  }
  input.value = "";
};

async function fetchComments() {
  const tbody = document.getElementById("comments-body");
  const emptyDiv = document.getElementById("comments-empty");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (emptyDiv) emptyDiv.style.display = "none";

  const { data: comments, error } = await supabaseClient
    .from("comments")
    .select("*, posts(title)")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Error fetching comments: " + error.message, "error");
    return;
  }

  if (comments.length === 0) {
    if (emptyDiv) emptyDiv.style.display = "block";
    return;
  }

  tbody.innerHTML = comments
    .map((comment) => {
      const date = new Date(comment.created_at).toLocaleString();
      const postTitle = comment.posts?.title || "Unknown Post";
      return `
      <tr>
        <td>
          <div style="font-weight: 600;">${comment.user_name}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; max-width: 400px; word-wrap: break-word;">${comment.content}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--text-muted)">${postTitle}</div>
        </td>
        <td style="font-size: 0.8rem;">${date}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteComment('${comment.id}')">Delete</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteComment = async function (id) {
  if (confirm("Are you sure you want to delete this comment?")) {
    const { error } = await supabaseClient
      .from("comments")
      .delete()
      .eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("Comment deleted.");
      fetchComments();
    }
  }
};
