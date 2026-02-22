function initSearch() {
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
              `<div class="search-suggestion-item" data-title="${p.title}" data-slug="${p.slug || p.id}">${p.title}</div>`,
          )
          .join("");
        document.querySelectorAll(".search-suggestion-item").forEach((item) => {
          item.addEventListener("click", () => {
            const slug = item.getAttribute("data-slug");
            const tid = "tid_" + Math.random().toString(36).substr(2, 7);
            window.location.href = `/pulse/?slug=${slug}&trackingid=${tid}`;
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
    if (typeof navigateTo === "function") {
      navigateTo(`/blog?q=${encodeURIComponent(term)}`);
    } else {
      window.location.href = `/blog?q=${encodeURIComponent(term)}`;
    }
    return;
  }
  closeSearch();

  const allPosts = window.allSearchablePosts || [];
  const filtered = allPosts.filter((p) =>
    p.title.toLowerCase().includes(term.toLowerCase()),
  );

  if (filtered.length > 0) {
    if (typeof renderBlogGrid === "function") {
      renderBlogGrid(filtered.slice(0, 10), grid);
    }
  } else {
    const randomRelated = allPosts.sort(() => 0.5 - Math.random()).slice(0, 3);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; margin-bottom: 2rem;">
        <h3>No matches found for "${term}"</h3>
        <p style="color: var(--text-muted);">But you might find these interesting:</p>
      </div>
    `;
    if (typeof createPostCardHtml === "function") {
      const cardsHtml = randomRelated
        .map((post) => createPostCardHtml(post))
        .join("");
      grid.innerHTML += cardsHtml;
    }
    if (typeof initIcons === "function") initIcons();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "k" || e.key === "f")) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === "Escape") closeSearch();
});

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

window.addEventListener("DOMContentLoaded", () => {
  initSearch();
  initArticleSearch();
});
