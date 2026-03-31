export type EditorialNote = {
  id: string;
  slug: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type EditorialNotesStore = {
  records: EditorialNote[];
};
