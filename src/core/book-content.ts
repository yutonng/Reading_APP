import type { Book } from "@/types/book";
import type { BookDraft } from "@/types/admin";

export function parseBookSections(content: string) {
  return content
    .split(/\n\s*\n/g)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `s${index + 1}`,
      text
    }));
}

export function countBookPages(content: string) {
  return parseBookSections(content).length;
}

export function bookToDraft(book: Book): BookDraft {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    summary: book.summary,
    content: book.sections.map((section) => section.text).join("\n\n")
  };
}

export function draftToPreviewBook(draft: BookDraft): Book {
  const now = new Date().toISOString();

  return {
    id: draft.id || "preview",
    title: draft.title || "未命名书籍",
    author: draft.author || "未填写作者",
    summary: draft.summary || "",
    sections: parseBookSections(draft.content),
    createdAt: now,
    updatedAt: now
  };
}
