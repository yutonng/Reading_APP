const app = document.querySelector("#app");

let books = [];
let route = { name: "list" };
let adminDraft = emptyDraft();
let adminMessage = "";
let previewBook = null;
let toastTimer = null;

async function loadBooks() {
  const response = await fetch("/books");
  const payload = await response.json();
  books = payload.books;
}

function setRoute(nextRoute) {
  route = nextRoute;
  render();
}

function icon(label) {
  return `<span aria-hidden="true">${label}</span>`;
}

function emptyDraft() {
  return {
    id: "",
    title: "",
    author: "",
    summary: "",
    content: ""
  };
}

function bookToDraft(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    summary: book.summary,
    content: book.sections.map((section) => section.text).join("\n\n")
  };
}

function countPages(content) {
  return content
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function parseDraftSections(content) {
  return content
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `s${index + 1}`,
      text
    }));
}

function formToDraft(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    id: adminDraft.id,
    title: String(data.title || "").trim(),
    author: String(data.author || "").trim(),
    summary: String(data.summary || "").trim(),
    content: String(data.content || "").trim()
  };
}

function draftToPreviewBook(draft) {
  return {
    id: draft.id || "preview",
    title: draft.title || "未命名书籍",
    author: draft.author || "未填写作者",
    summary: draft.summary || "",
    sections: parseDraftSections(draft.content),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem("reading-progress") || "{}");
  } catch {
    return {};
  }
}

function saveProgress(bookId, page) {
  const progress = getProgress();
  progress[bookId] = {
    page,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem("reading-progress", JSON.stringify(progress));
}

function getBookProgress(book) {
  const saved = getProgress()[book.id];
  const page = Math.min(Math.max(Number(saved?.page || 0), 0), book.sections.length - 1);
  return {
    page,
    isStarted: Boolean(saved),
    isFinished: page >= book.sections.length - 1
  };
}

function findLastReadBook() {
  const progress = getProgress();
  return books
    .map((book) => ({
      book,
      progress: getBookProgress(book),
      updatedAt: progress[book.id]?.updatedAt || ""
    }))
    .filter((item) => item.progress.isStarted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 1100);
}

function renderList() {
  const lastRead = findLastReadBook();

  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <button class="icon-btn" id="home-back" title="返回">${icon("‹")}</button>
        <h1>首页</h1>
        <button class="icon-btn" id="admin" title="后台上传">${icon("✎")}</button>
      </header>
      ${
        lastRead
          ? `
            <section class="continue">
              <div>
                <span class="eyebrow">继续阅读</span>
                <h2>${escapeHtml(lastRead.book.title)}</h2>
                <p>${escapeHtml(lastRead.book.author)} · ${lastRead.progress.page + 1} / ${lastRead.book.sections.length}</p>
              </div>
              <button class="primary-action" id="continue-reading">继续</button>
            </section>
          `
          : ""
      }
      <div class="list">
        ${
          books.length
            ? books
                .map(
                  (book) => {
                    const progress = getBookProgress(book);
                    return `
                    <button class="book" data-book-id="${book.id}">
                      <span>
                        <h2>${escapeHtml(book.title)}</h2>
                        <p class="meta">${escapeHtml(book.author)} · ${book.sections.length} 页${
                          progress.isStarted ? ` · 已读 ${progress.page + 1}` : ""
                        }</p>
                        <p>${escapeHtml(book.summary)}</p>
                      </span>
                      <span aria-hidden="true">›</span>
                    </button>
                  `;
                  }
                )
                .join("")
            : `<p class="empty">还没有书。</p>`
        }
      </div>
    </section>
  `;

  document.querySelector("#admin").addEventListener("click", () => setRoute({ name: "admin" }));
  document.querySelector("#home-back").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  });
  document.querySelector("#continue-reading")?.addEventListener("click", () =>
    setRoute({
      name: "reader",
      id: lastRead.book.id,
      page: lastRead.progress.page
    })
  );
  document.querySelectorAll("[data-book-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const book = books.find((item) => item.id === node.getAttribute("data-book-id"));
      const progress = book ? getBookProgress(book) : { page: 0 };
      setRoute({ name: "reader", id: node.getAttribute("data-book-id"), page: progress.page });
    });
  });
}

function renderReader() {
  const book = route.preview ? previewBook : books.find((item) => item.id === route.id);
  const page = route.page || 0;

  if (!book) {
    setRoute({ name: "list" });
    return;
  }

  const section = book.sections[page];
  const total = book.sections.length;
  const percent = Math.round(((page + 1) / total) * 100);

  if (!route.preview) {
    saveProgress(book.id, page);
  }

  app.innerHTML = `
    <section class="reader">
      <header class="bar">
        <button class="icon-btn" id="back" title="返回">${icon("‹")}</button>
        <h1>${escapeHtml(book.title)}</h1>
        <span class="bar-spacer"></span>
      </header>
      <div class="progress-track"><span style="width: ${percent}%"></span></div>
      <article class="page">
        <button class="tap tap-left" id="prev" title="上一页"></button>
        <div class="reader-progress">${page + 1} / ${total}</div>
        <p class="page-text">${escapeHtml(section.text)}</p>
        <button class="tap tap-right" id="next" title="下一页"></button>
      </article>
      ${
        page === total - 1
          ? `
            <div class="finish-panel">
              <div class="finish-state">已完结</div>
              <button class="finish-action" id="finish">继续阅读《${escapeHtml(book.title)}》</button>
            </div>
          `
          : ""
      }
      <div class="toast" id="toast"></div>
    </section>
  `;

  document.querySelector("#back").addEventListener("click", () =>
    setRoute(route.preview ? { name: "admin" } : { name: "list" })
  );
  document.querySelector("#prev").addEventListener("click", goPrevious);
  document.querySelector("#next").addEventListener("click", goNext);
  document
    .querySelector("#finish")
    ?.addEventListener("click", () => setRoute(route.preview ? { name: "admin" } : { name: "list" }));
  window.onkeydown = (event) => {
    if (route.name !== "reader") {
      return;
    }
    if (event.key === "ArrowLeft") {
      goPrevious();
    }
    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      goNext();
    }
    if (event.key === "Escape") {
      setRoute(route.preview ? { name: "admin" } : { name: "list" });
    }
  };

  function goPrevious() {
    if (page === 0) {
      showToast("已经是第一页");
      return;
    }
    setRoute({ ...route, page: page - 1 });
  }

  function goNext() {
    if (page === total - 1) {
      showToast("已经读完");
      return;
    }
    setRoute({ ...route, page: page + 1 });
  }
}

function renderAdmin() {
  const isEditing = Boolean(adminDraft.id);
  const pageCount = countPages(adminDraft.content);

  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <button class="icon-btn" id="back" title="返回">${icon("‹")}</button>
        <h1>${isEditing ? "编辑书籍" : "后台上传"}</h1>
        <button class="icon-btn" id="new-book" title="新建">${icon("+")}</button>
      </header>
      <section class="manager">
        <div class="library-panel">
          <div class="panel-title">
            <h2>已有书籍</h2>
            <span>${books.length} 本</span>
          </div>
          <div class="admin-list">
            ${
              books.length
                ? books
                    .map(
                      (book) => `
                        <article class="admin-book">
                          <div>
                            <h3>${escapeHtml(book.title)}</h3>
                            <p>${escapeHtml(book.author)} · ${book.sections.length} 页</p>
                          </div>
                          <div class="row-actions">
                            <button class="small-btn" data-edit-id="${book.id}" type="button">编辑</button>
                            <button class="small-btn danger" data-delete-id="${book.id}" type="button">删除</button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : `<p class="empty compact">还没有书。</p>`
            }
          </div>
        </div>
      <form class="form" id="book-form">
        <div class="field">
          <label for="title">书名</label>
          <input id="title" name="title" placeholder="输入书名" value="${escapeAttribute(adminDraft.title)}" required />
        </div>
        <div class="field">
          <label for="author">作者</label>
          <input id="author" name="author" placeholder="输入作者" value="${escapeAttribute(adminDraft.author)}" required />
        </div>
        <div class="field">
          <label for="summary">一句话简介</label>
          <input id="summary" name="summary" placeholder="用一句话说明这本书" value="${escapeAttribute(adminDraft.summary)}" required />
        </div>
        <div class="field">
          <div class="label-row">
            <label for="content">内容</label>
            <span id="page-count">${pageCount} 页</span>
          </div>
          <textarea id="content" name="content" placeholder="第一页内容&#10;&#10;第二页内容&#10;&#10;第三页内容" required>${escapeHtml(adminDraft.content)}</textarea>
        </div>
        <button class="save" type="submit">${isEditing ? "保存修改" : "保存"}</button>
        <button class="secondary-action" id="preview-reading" type="button">预览阅读</button>
        <p class="message" id="message">${escapeHtml(adminMessage)}</p>
      </form>
      </section>
    </section>
  `;

  const form = document.querySelector("#book-form");
  const content = document.querySelector("#content");
  const pageCountNode = document.querySelector("#page-count");

  document.querySelector("#back").addEventListener("click", () => setRoute({ name: "list" }));
  document.querySelector("#new-book").addEventListener("click", () => {
    adminDraft = emptyDraft();
    adminMessage = "";
    renderAdmin();
  });
  document.querySelectorAll("[data-edit-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const book = books.find((item) => item.id === node.getAttribute("data-edit-id"));
      if (book) {
        adminDraft = bookToDraft(book);
        adminMessage = "";
        renderAdmin();
      }
    });
  });
  document.querySelectorAll("[data-delete-id]").forEach((node) => {
    node.addEventListener("click", async () => {
      const bookId = node.getAttribute("data-delete-id");
      const book = books.find((item) => item.id === bookId);
      if (!book || !confirm(`删除《${book.title}》？`)) {
        return;
      }

      const response = await fetch(`/books/${encodeURIComponent(book.id)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        alert("删除失败。");
        return;
      }

      if (adminDraft.id === book.id) {
        adminDraft = emptyDraft();
      }
      adminMessage = "已删除。";
      await loadBooks();
      renderAdmin();
    });
  });
  content.addEventListener("input", () => {
    adminDraft.content = content.value;
    pageCountNode.textContent = `${countPages(content.value)} 页`;
  });
  document.querySelector("#preview-reading").addEventListener("click", () => {
    adminDraft = formToDraft(form);
    previewBook = draftToPreviewBook(adminDraft);

    if (!previewBook.sections.length) {
      adminMessage = "先填写内容，再预览阅读。";
      renderAdmin();
      return;
    }

    setRoute({ name: "reader", id: previewBook.id, page: 0, preview: true });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminDraft = formToDraft(form);
    const data = {
      title: adminDraft.title,
      author: adminDraft.author,
      summary: adminDraft.summary,
      content: adminDraft.content
    };
    const wasEditing = Boolean(adminDraft.id);
    const message = document.querySelector("#message");
    const endpoint = adminDraft.id ? `/books/${encodeURIComponent(adminDraft.id)}` : "/books";
    const response = await fetch(endpoint, {
      method: adminDraft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const payload = await response.json();
      message.textContent = payload.error || "保存失败。";
      return;
    }

    await loadBooks();
    const saved = await response.json().catch(() => null);
    adminDraft = saved ? bookToDraft(saved) : emptyDraft();
    adminMessage = wasEditing ? "已保存修改。回到选书页即可阅读。" : "已保存。回到选书页即可阅读。";
    renderAdmin();
  });
}

function render() {
  window.onkeydown = null;
  if (route.name === "reader") {
    renderReader();
    return;
  }
  if (route.name === "admin") {
    renderAdmin();
    return;
  }
  renderList();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

loadBooks().then(render);
