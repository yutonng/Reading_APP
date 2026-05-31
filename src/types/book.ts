export type BookSection = {
  id: string;
  text: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  summary: string;
  sections: BookSection[];
  createdAt: string;
  updatedAt: string;
};

export type BooksPayload = {
  books: Book[];
};
