import { IsDate, IsString } from "class-validator";

export class ReportResponse{
  userId?:string
  bookId?:string
  action!:string
  date!:Date
}
 