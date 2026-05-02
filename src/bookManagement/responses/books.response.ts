export class BookResponse {
  id!: string;
  title!: string;
  author!: string;
  description!: string;
  filetype?: string;
  category!: string;
  createdAt?: Date;
  updatedAt?: Date;
  sendFile?: string;
  readUrl?: string;
  downloadUrl?: string;
  coverPath?: string;
  coverType?: string;
}
export class CategoryResponse {
  id!: string
  name!: string;
  description!: string
  updatedAt?: Date;
}