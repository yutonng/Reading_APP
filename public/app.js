const app = document.querySelector("#app");
const appInfo = {
  name: "轻轻读",
  englishName: "RelaxReading",
  version: "0.1.0",
  privacyUpdatedAt: "2026-06-05"
};

let books = [];
let drafts = [];
let route =
  window.location.pathname === "/admin"
    ? { name: "admin" }
    : window.location.pathname === "/privacy"
      ? { name: "privacy" }
      : { name: "list" };
let adminDraft = emptyDraft();
let adminMessage = "";
let previewBook = null;
let toastTimer = null;
let isAdminAuthenticated = false;
let isSearchOpen = false;
let searchQuery = "";

async function loadBooks() {
  const response = await fetch("/books");
  const payload = await response.json();
  books = payload.books;
}

async function loadDrafts() {
  if (!isAdminAuthenticated) {
    drafts = [];
    return;
  }

  const response = await fetch("/drafts");

  if (!response.ok) {
    drafts = [];
    return;
  }

  const payload = await response.json();
  drafts = payload.drafts || [];
}

async function loadSession() {
  const response = await fetch("/auth/session");
  const payload = await response.json();
  isAdminAuthenticated = Boolean(payload.authenticated);
}

function setRoute(nextRoute) {
  route = nextRoute;
  render();
}

function icon(name) {
  const icons = {
    search:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35"/><circle cx="11" cy="11" r="6"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7.5h.01"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    plus:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'
  };

  return icons[name] || "";
}

function emptyDraft() {
  return {
    id: "",
    source: "draft",
    title: "",
    author: "",
    summary: "",
    content: ""
  };
}

function bookToDraft(book, source = "book") {
  return {
    id: book.id,
    source,
    title: book.title,
    author: book.author,
    summary: book.summary,
    content: book.sections.map((section) => section.text).join("\n\n")
  };
}

function savedDraftToDraft(draft) {
  return {
    id: draft.id,
    source: "draft",
    title: draft.title,
    author: draft.author,
    summary: draft.summary,
    content: draft.content
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

function normalizeBookTitle(value) {
  const title = String(value || "").trim();

  if (!title) {
    return "";
  }

  const unwrapped = title.replace(/^《+/, "").replace(/》+$/, "").trim();
  return `《${unwrapped || title}》`;
}

function normalizeSoulSentence(value) {
  const sentence = String(value || "").trim();

  if (!sentence) {
    return "";
  }

  if (
    (sentence.startsWith("“") && sentence.endsWith("”")) ||
    (sentence.startsWith('"') && sentence.endsWith('"'))
  ) {
    return sentence;
  }

  const unwrapped = sentence.replace(/^[“"]+/, "").replace(/[”"]+$/, "").trim();
  return `“${unwrapped || sentence}”`;
}

function getComparableBookTitle(value) {
  return normalizeBookTitle(value).replace(/^《+/, "").replace(/》+$/, "").trim().toLowerCase();
}

function findPublishedDuplicate(draft) {
  const title = getComparableBookTitle(draft.title);
  return books.find((book) => getComparableBookTitle(book.title) === title);
}

function formToDraft(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    id: adminDraft.id,
    source: adminDraft.source || "draft",
    title: normalizeBookTitle(data.title),
    author: String(data.author || "").trim(),
    summary: normalizeSoulSentence(data.summary),
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

function getVisibleBooks() {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return books;
  }

  return books.filter((book) =>
    [book.title, book.author, book.summary].some((value) => value.toLowerCase().includes(query))
  );
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
  const visibleBooks = getVisibleBooks();
  const isSearching = Boolean(searchQuery.trim());

  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <span class="bar-spacer"></span>
        <h1>书库</h1>
        <div class="bar-actions">
          <button class="icon-btn" id="toggle-search" title="${isSearchOpen ? "关闭搜索" : "搜索"}">${icon(isSearchOpen ? "close" : "search")}</button>
          <a class="icon-btn" href="/privacy" title="隐私政策">${icon("info")}</a>
        </div>
      </header>
      ${
        isSearchOpen
          ? `
            <div class="search-panel">
              ${icon("search")}
              <input id="search-input" placeholder="搜索书名、作者或灵魂句" value="${escapeAttribute(searchQuery)}" />
              ${
                searchQuery
                  ? `<button class="search-clear" id="clear-search" title="清空搜索" type="button">${icon("close")}</button>`
                  : ""
              }
            </div>
          `
          : ""
      }
      ${
        lastRead && !isSearching
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
          visibleBooks.length
            ? visibleBooks
                .map(
                  (book) => {
                    const progress = getBookProgress(book);
                    const progressPercent = progress.isStarted
                      ? Math.round(((progress.page + 1) / book.sections.length) * 100)
                      : 0;
                    return `
                    <button class="book" data-book-id="${book.id}">
                      <span>
                        <h2>${escapeHtml(book.title)}</h2>
                        <p class="meta">${escapeHtml(book.author)} · ${book.sections.length} 页</p>
                        <p>${escapeHtml(book.summary)}</p>
                      </span>
                      <span aria-hidden="true">›</span>
                      <span class="book-progress" aria-hidden="true"><span style="width: ${progressPercent}%"></span></span>
                    </button>
                  `;
                  }
                )
                .join("")
            : `<p class="empty">${isSearching ? "没有找到匹配的书。" : "还没有书。"}</p>`
        }
      </div>
    </section>
  `;

  document.querySelector("#toggle-search")?.addEventListener("click", () => {
    isSearchOpen = !isSearchOpen;
    if (!isSearchOpen) {
      searchQuery = "";
    }
    renderList();
  });
  document.querySelector("#search-input")?.addEventListener("input", (event) => {
    searchQuery = event.currentTarget.value;
    renderList();
  });
  document.querySelector("#search-input")?.focus();
  document.querySelector("#clear-search")?.addEventListener("click", () => {
    searchQuery = "";
    renderList();
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

function renderPrivacy() {
  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <button class="icon-btn" id="privacy-back" title="返回">${icon("back")}</button>
        <h1>隐私政策</h1>
        <span class="bar-spacer"></span>
      </header>
      <article class="policy">
        <h2>${appInfo.name} 隐私政策</h2>
        <p class="policy-date">${appInfo.englishName}</p>
        <p class="policy-date">更新日期：${appInfo.privacyUpdatedAt}</p>

        <h3>我们收集的信息</h3>
        <p>用户侧阅读 App 不要求注册账号。阅读进度保存在设备本地，用于继续阅读，不会主动上传到服务器。</p>

        <h3>书籍内容</h3>
        <p>App 会从云端接口获取书籍列表和正文内容。书籍内容由管理员通过后台维护，并存储在 Vercel Blob。</p>

        <h3>后台管理</h3>
        <p>后台仅供管理员使用。后台登录使用账号和密码，并通过登录 Cookie 维持会话。</p>

        <h3>服务日志</h3>
        <p>当你访问在线服务时，托管服务提供商可能会记录必要的请求日志，用于服务运行、安全排查和故障定位。</p>

        <h3>第三方服务</h3>
        <p>本项目当前使用 Vercel 托管网页、接口和云端书籍存储。</p>

        <h3>联系我们</h3>
        <p>如需删除或更正书籍内容，请联系应用开发者。</p>
      </article>
    </section>
  `;

  document.querySelector("#privacy-back").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  });
}

function renderLogin() {
  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <button class="icon-btn" id="back" title="返回">${icon("back")}</button>
        <h1>后台登录</h1>
        <span class="bar-spacer"></span>
      </header>
      <form class="login-panel" id="login-form">
        <div class="field">
          <label for="username">账号</label>
          <input id="username" name="username" autocomplete="username" placeholder="输入账号" required />
        </div>
        <div class="field">
          <label for="password">密码</label>
          <input id="password" name="password" autocomplete="current-password" type="password" placeholder="输入密码" required />
        </div>
        <button class="save" type="submit">登录</button>
        <p class="message error" id="login-message"></p>
      </form>
    </section>
  `;

  document.querySelector("#back").addEventListener("click", () => {
    window.location.href = "/";
  });

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const message = document.querySelector("#login-message");
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      message.textContent = payload.error || "登录失败。";
      return;
    }

    isAdminAuthenticated = true;
    adminMessage = "";
    await loadDrafts();
    renderAdmin();
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
        <button class="icon-btn" id="back" title="返回">${icon("back")}</button>
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
  if (!isAdminAuthenticated) {
    renderLogin();
    return;
  }

  const isEditingPublished = Boolean(adminDraft.id && adminDraft.source === "book");
  const isEditingDraft = Boolean(adminDraft.id && adminDraft.source === "draft");
  const pageCount = countPages(adminDraft.content);

  app.innerHTML = `
    <section class="shell">
      <header class="bar">
        <button class="icon-btn" id="back" title="返回">${icon("back")}</button>
        <h1>${isEditingPublished ? "编辑书籍" : isEditingDraft ? "编辑草稿" : "后台上传"}</h1>
        <button class="icon-btn" id="new-book" title="新建">${icon("plus")}</button>
      </header>
      <section class="manager">
        <div class="library-panel">
          <div class="panel-title">
            <h2>待审核草稿</h2>
            <span>${drafts.length} 份</span>
          </div>
          <div class="admin-list">
            ${
              drafts.length
                ? drafts
                    .map(
                      (draft) => `
                        <article class="admin-book">
                          <div>
                            <h3>${escapeHtml(draft.title)}</h3>
                            <p>${escapeHtml(draft.author)} · ${countPages(draft.content)} 页</p>
                          </div>
                          <div class="row-actions">
                            <button class="small-btn" data-draft-edit-id="${draft.id}" type="button">编辑</button>
                            <button class="small-btn" data-draft-preview-id="${draft.id}" type="button">预览</button>
                            <button class="small-btn primary" data-draft-publish-id="${draft.id}" type="button">发布</button>
                            <button class="small-btn danger" data-draft-delete-id="${draft.id}" type="button">删除</button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : `<p class="empty compact">还没有待审核草稿。</p>`
            }
          </div>
        </div>
        <div class="library-panel">
          <div class="panel-title">
            <h2>已发布书籍</h2>
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
        <button class="save" type="submit">${
          isEditingPublished ? "保存正式书籍" : isEditingDraft ? "保存草稿" : "保存到待审核"
        }</button>
        <button class="secondary-action" id="preview-reading" type="button">预览阅读</button>
        <p class="message" id="message">${escapeHtml(adminMessage)}</p>
      </form>
      </section>
      <div class="toast" id="toast"></div>
    </section>
  `;

  const form = document.querySelector("#book-form");
  const title = document.querySelector("#title");
  const summary = document.querySelector("#summary");
  const content = document.querySelector("#content");
  const pageCountNode = document.querySelector("#page-count");

  document.querySelector("#back").addEventListener("click", () => {
    window.location.href = "/";
  });
  document.querySelector("#new-book").addEventListener("click", () => {
    adminDraft = emptyDraft();
    adminMessage = "";
    renderAdmin();
  });
  document.querySelectorAll("[data-draft-edit-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const draft = drafts.find((item) => item.id === node.getAttribute("data-draft-edit-id"));
      if (draft) {
        adminDraft = savedDraftToDraft(draft);
        adminMessage = "";
        renderAdmin();
      }
    });
  });
  document.querySelectorAll("[data-draft-preview-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const draft = drafts.find((item) => item.id === node.getAttribute("data-draft-preview-id"));
      if (draft) {
        adminDraft = savedDraftToDraft(draft);
        previewBook = draftToPreviewBook(adminDraft);
        setRoute({ name: "reader", id: previewBook.id, page: 0, preview: true });
      }
    });
  });
  document.querySelectorAll("[data-draft-publish-id]").forEach((node) => {
    node.addEventListener("click", async () => {
      const draft = drafts.find((item) => item.id === node.getAttribute("data-draft-publish-id"));
      if (!draft || !confirm(`发布${normalizeBookTitle(draft.title)}？发布后用户侧即可阅读。`)) {
        return;
      }

      const duplicate = findPublishedDuplicate(draft);
      let publishMode = "new";

      if (duplicate) {
        const useDraft = confirm(
          `已发布书库里已经有${normalizeBookTitle(draft.title)}。\n\n点击“确定”：保留待审核草稿，用它替换已发布版本。\n点击“取消”：保留已发布版本。`
        );

        if (useDraft) {
          publishMode = "replace";
        } else if (
          confirm(`保留已发布版本，并删除这份待审核草稿${normalizeBookTitle(draft.title)}？\n\n点击“取消”则不做任何操作。`)
        ) {
          publishMode = "discard";
        } else {
          return;
        }
      }

      node.disabled = true;
      node.textContent = publishMode === "discard" ? "处理中" : "发布中";

      try {
        const response =
          publishMode === "replace"
            ? await fetch(`/drafts/${encodeURIComponent(draft.id)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  replaceBookId: duplicate.id
                })
              })
            : publishMode === "discard"
              ? await fetch(`/drafts/${encodeURIComponent(draft.id)}`, {
                  method: "DELETE"
                })
              : await fetch(`/drafts/${encodeURIComponent(draft.id)}`, {
                  method: "POST"
                });

        if (!response.ok) {
          if (response.status === 401) {
            isAdminAuthenticated = false;
            renderLogin();
            return;
          }

          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "发布失败。");
        }

        const savedBook = publishMode === "discard" ? null : await response.json().catch(() => null);

        if (adminDraft.id === draft.id && adminDraft.source === "draft") {
          adminDraft = emptyDraft();
        }
        adminMessage =
          publishMode === "replace"
            ? `${normalizeBookTitle(draft.title)}已用待审核草稿替换。`
            : publishMode === "discard"
              ? `已保留已发布版本，并删除待审核草稿。`
              : `${normalizeBookTitle(draft.title)}发布成功，用户侧现在可以阅读。`;
        await Promise.all([loadBooks(), loadDrafts()]);
        drafts = drafts.filter((item) => item.id !== draft.id);
        if (savedBook && publishMode === "new" && !books.some((book) => book.id === savedBook.id)) {
          books = [savedBook, ...books];
        }
        if (savedBook && publishMode === "replace") {
          books = books.map((book) => (book.id === savedBook.id ? savedBook : book));
        }
        renderAdmin();
        showToast(publishMode === "discard" ? "草稿已删除。" : "发布成功。");
      } catch (error) {
        adminMessage = error.message || "发布失败。";
        renderAdmin();
        showToast(adminMessage);
      }
    });
  });
  document.querySelectorAll("[data-draft-delete-id]").forEach((node) => {
    node.addEventListener("click", async () => {
      const draft = drafts.find((item) => item.id === node.getAttribute("data-draft-delete-id"));
      if (!draft || !confirm(`删除草稿《${draft.title}》？`)) {
        return;
      }

      const previousDrafts = drafts;
      const previousAdminDraft = { ...adminDraft };
      node.disabled = true;
      node.textContent = "删除中";
      drafts = drafts.filter((item) => item.id !== draft.id);
      if (adminDraft.id === draft.id && adminDraft.source === "draft") {
        adminDraft = emptyDraft();
      }
      adminMessage = "正在删除草稿...";
      renderAdmin();

      try {
        const response = await fetch(`/drafts/${encodeURIComponent(draft.id)}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          if (response.status === 401) {
            isAdminAuthenticated = false;
            renderLogin();
            return;
          }

          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "删除草稿失败。");
        }

        adminMessage = "草稿已删除。";
        await loadDrafts();
        renderAdmin();
        showToast("草稿已删除。");
      } catch (error) {
        drafts = previousDrafts;
        adminDraft = previousAdminDraft;
        adminMessage = error.message || "删除草稿失败。";
        renderAdmin();
        showToast(adminMessage);
      }
    });
  });
  document.querySelectorAll("[data-edit-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const book = books.find((item) => item.id === node.getAttribute("data-edit-id"));
      if (book) {
        adminDraft = bookToDraft(book, "book");
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

      const previousBooks = books;
      const previousAdminDraft = { ...adminDraft };
      node.disabled = true;
      node.textContent = "删除中";
      books = books.filter((item) => item.id !== book.id);
      if (adminDraft.id === book.id && adminDraft.source === "book") {
        adminDraft = emptyDraft();
      }
      adminMessage = `正在删除${normalizeBookTitle(book.title)}...`;
      renderAdmin();

      try {
        const response = await fetch(`/books/${encodeURIComponent(book.id)}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          if (response.status === 401) {
            isAdminAuthenticated = false;
            renderLogin();
            return;
          }

          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "删除失败。");
        }

        adminMessage = `${normalizeBookTitle(book.title)}已删除。`;
        await loadBooks();
        renderAdmin();
        showToast("已删除。");
      } catch (error) {
        books = previousBooks;
        adminDraft = previousAdminDraft;
        adminMessage = error.message || "删除失败。";
        renderAdmin();
        showToast(adminMessage);
      }
    });
  });
  content.addEventListener("input", () => {
    adminDraft.content = content.value;
    pageCountNode.textContent = `${countPages(content.value)} 页`;
  });
  title.addEventListener("blur", () => {
    title.value = normalizeBookTitle(title.value);
  });
  summary.addEventListener("blur", () => {
    summary.value = normalizeSoulSentence(summary.value);
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
    const wasEditingPublished = Boolean(adminDraft.id && adminDraft.source === "book");
    const wasEditingDraft = Boolean(adminDraft.id && adminDraft.source === "draft");
    const message = document.querySelector("#message");
    const endpoint = wasEditingPublished
      ? `/books/${encodeURIComponent(adminDraft.id)}`
      : wasEditingDraft
        ? `/drafts/${encodeURIComponent(adminDraft.id)}`
        : "/drafts";
    const response = await fetch(endpoint, {
      method: wasEditingPublished || wasEditingDraft ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const payload = await response.json();
      if (response.status === 401) {
        isAdminAuthenticated = false;
        renderLogin();
        return;
      }
      message.textContent = payload.error || "保存失败。";
      return;
    }

    await Promise.all([loadBooks(), loadDrafts()]);
    const saved = await response.json().catch(() => null);
    adminDraft = saved
      ? wasEditingPublished
        ? bookToDraft(saved, "book")
        : savedDraftToDraft(saved)
      : emptyDraft();
    adminMessage = wasEditingPublished
      ? "正式书籍已保存。"
      : wasEditingDraft
        ? "草稿已保存，发布后用户侧可见。"
        : "已保存到待审核，发布后用户侧可见。";
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
  if (route.name === "privacy") {
    renderPrivacy();
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

async function boot() {
  if (route.name === "privacy") {
    render();
    return;
  }

  await Promise.all([loadBooks(), loadSession()]);
  await loadDrafts();
  render();
}

boot();
