const SUPABASE_URL = "https://hzxwqxmldlncrhqxlnlq.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eHdxeG1sZGxuY3JocXhsbmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODIwMDEsImV4cCI6MjA4NTc1ODAwMX0.pP3i8KquZmqhiUkaTw3ROi86mslTyzK5ysD2va1JI10";

// Check if window.supabaseClient is already defined (by script.js), otherwise create it
if (typeof window.supabaseClient === "undefined") {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
  );
}
const supabaseClient = window.supabaseClient;

// --- Quill Editor Init ---
let quill;
document.addEventListener("DOMContentLoaded", () => {
  // Override Link Sanitization to enforce https
  const Link = Quill.import("formats/link");
  const originalSanitize = Link.sanitize;
  Link.sanitize = function (url) {
    if (!url) return "";
    let value = url.trim();
    // If it starts with a known protocol, anchor, or relative path, it's fine
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/.test(value)) {
      // pass through
    } else if (value.indexOf(".") > -1 && value.indexOf(" ") === -1) {
      // Likely a domain -> prepend https://
      value = "https://" + value;
    }
    // Use original sanitizer if available
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

  // --- Image Handling (Upload to Supabase) ---
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

  // Handle Pasted Images
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

    // Show placeholder
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

      // Replace placeholder with image
      quill.deleteText(range.index, "Uploading image...".length);
      quill.insertEmbed(range.index, "image", publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      quill.deleteText(range.index, "Uploading image...".length);
      alert("Image upload failed: " + error.message);
    }
  }

  // --- Magic URL (Auto-link) ---
  const urlRegex =
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;

  quill.on("text-change", function (delta, oldDelta, source) {
    if (source !== "user") return;

    const range = quill.getSelection();
    if (!range) return;

    const leaf = quill.getLeaf(range.index - 1)[0];
    if (!leaf || !leaf.text) return;

    // Check if we just typed a space or enter
    const lastChar = leaf.text.slice(-1);
    if (!/\s/.test(lastChar)) return;

    // Get current line text
    const [line, offset] = quill.getLine(range.index);
    const text = line.domNode.textContent;
    // Find words
    const words = text.split(/\s+/);

    // Very simple check for the last word typed
    const lastWord = words[words.length - 2]; // -2 because the last one is empty string after space

    if (lastWord && urlRegex.test(lastWord)) {
      // Just verify it's not already linked
      // We'd need to find the exact index of this word.
      // This is complex to get imperfectly right.
      // Simpler approach: If the user just typed a URL and hit space, linkify it.

      let urlToCheck = lastWord;
      if (!urlToCheck.match(/^https?:\/\//)) {
        if (urlToCheck.match(/^www\./) || urlToCheck.indexOf(".") > -1) {
          urlToCheck = "https://" + urlToCheck;
        }
      }

      // Find format at position
      const index = range.index - lastWord.length - 1;
      const format = quill.getFormat(index, lastWord.length);

      if (!format.link) {
        quill.formatText(index, lastWord.length, "link", urlToCheck, "api");
      }
    }
  });
});

// --- State ---
let allPosts = []; // Store posts locally for filtering

// --- Auth State Listener ---
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

// --- Login ---
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

// --- Sign Out ---
async function signOut() {
  await supabaseClient.auth.signOut();
}

// --- Data Operations ---

async function fetchPosts() {
  const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return;
  }

  allPosts = posts; // cache
  updateStats(posts);
  renderTable(posts);
  fetchVisitorStats();
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

function updateStats(posts) {
  document.getElementById("total-posts").textContent = posts.length;
  document.getElementById("total-views").textContent = posts.reduce(
    (sum, p) => sum + (p.views || 0),
    0,
  );
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
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">/pulse/?slug=${post.slug || ""}</div>
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

// --- Stats Modal Logic ---
let statsChart = null;

async function openStatsModal(slug, title, totalViews) {
  const modal = document.getElementById("stats-modal");
  document.getElementById("stats-modal-title").textContent = title;
  document.getElementById("stats-total-views").textContent = totalViews;
  document.getElementById("stats-unique-visitors").textContent = "Loading...";
  modal.classList.add("active");

  // Fetch Stats
  // 1. Get Page Views for this slug
  const pagePath = `/pulse/?slug=${slug}`;
  const { data: views, error } = await supabaseClient
    .from("page_views")
    .select("created_at, tracking_id")
    .ilike("page_path", `${pagePath}%`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching stats:", error);
    document.getElementById("stats-unique-visitors").textContent = "N/A";
    return;
  }

  // Calculate Unique Visitors
  const uniqueVisitors = new Set(views.map((v) => v.tracking_id)).size;
  document.getElementById("stats-unique-visitors").textContent = uniqueVisitors;

  // Prepare Chart Data (Group by Date)
  const grouped = {};
  views.forEach((v) => {
    const date = new Date(v.created_at).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const dataPoints = Object.values(grouped);

  // Render Chart
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

// --- Search ---
document.getElementById("search-input").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter((p) => p.title.toLowerCase().includes(term));
  renderTable(filtered);
});

// --- Modal & Forms ---
const modal = document.getElementById("post-modal");
const form = document.getElementById("post-form");
const imageInput = document.getElementById("p-image");
const imagePreview = document.getElementById("image-preview");

// Image Preview Logic
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
    quill.root.innerHTML = ""; // Clear editor
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
}

function closeModal() {
  modal.classList.remove("active");
  // Don't fully reset form here to prevent flickering if closing accidentally,
  // but standard practice is to reset. We handled reset in openModal for new items.
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}

// Save Post
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("post-id").value;
  const title = document.getElementById("p-title").value;
  const excerpt = document.getElementById("p-excerpt").value;

  // Get content from Quill
  const content = quill.root.innerHTML;

  const image_url = document.getElementById("p-image").value;
  const btn = document.getElementById("save-btn");

  // Get current user to ensure we are authenticated
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("You must be logged in to save posts.");
    return;
  }

  // Loading state
  const originalText = btn.textContent;
  btn.textContent = "Saving...";
  btn.disabled = true;

  const postData = { title, excerpt, content, image_url };

  let error = null;

  if (id) {
    // Update existing: Do not change slug to preserve links
    const { error: err } = await supabaseClient
      .from("posts")
      .update(postData)
      .eq("id", id);
    error = err;
  } else {
    // Create new: Generate slug
    postData.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { error: err } = await supabaseClient
      .from("posts")
      .insert([postData]);
    error = err;
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

// Edit
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

    // Set Quill content
    quill.root.innerHTML = data.content || "";

    // Handle Image Preview
    if (data.image_url) {
      imagePreview.src = data.image_url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }

    openModal(true);
  }
}

// Delete
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

// --- View Switching ---
window.switchView = function (viewName) {
  const dashboardView = document.getElementById("view-dashboard");
  const settingsView = document.getElementById("view-settings");
  const navDashboard = document.getElementById("nav-dashboard");
  const navSettings = document.getElementById("nav-settings");

  if (viewName === "dashboard") {
    dashboardView.classList.remove("hidden");
    settingsView.classList.add("hidden");
    navDashboard.classList.add("active");
    navSettings.classList.remove("active");
  } else if (viewName === "settings") {
    dashboardView.classList.add("hidden");
    settingsView.classList.remove("hidden");
    navDashboard.classList.remove("active");
    navSettings.classList.add("active");
  }
};

// --- Settings Logic ---
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

  // Populate fields if elements exist
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

  // Apply immediate effects
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

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
});
