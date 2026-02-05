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
  quill = new Quill("#editor-container", {
    theme: "snow",
    placeholder: "Write your article content here...",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
      ],
    },
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
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">/${post.slug || ""}</div>
            </td>
            <td>${new Date(post.created_at).toLocaleDateString()}</td>
            <td>${post.views || 0}</td>
            <td style="text-align: right;">
                <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="editPost('${post.id}')"><i data-lucide="pencil" size="14"></i> Edit</button>
                <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;" onclick="deletePost('${post.id}')"><i data-lucide="trash-2" size="14"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

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
