import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import type { Question, QuestionInput, QuestionListResponse } from "@shared/types/question";
import type { QuestionFilters, QuestionRepository } from "./question-repository";

interface DatabaseQuestion extends RowDataPacket {
  id: number;
  subject: string;
  content: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswer: Question["correctAnswer"];
  updateAt: string;
  note: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const url = new URL(process.env.DATABASE_URL ?? "mysql://app:app@localhost:3306/exam_bank");
  if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
    throw new Error("DATABASE_URL must use the mysql:// scheme.");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!database) throw new Error("DATABASE_URL must include a database name.");

  pool = mysql.createPool({
    host: url.hostname || "localhost",
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    dateStrings: true,
    enableKeepAlive: true,
  });
  return pool;
}

function toQuestion(row: DatabaseQuestion): Question {
  return {
    id: Number(row.id),
    subject: row.subject,
    content: row.content,
    answerA: row.answerA,
    answerB: row.answerB,
    answerC: row.answerC,
    answerD: row.answerD,
    correctAnswer: row.correctAnswer,
    updateAt: row.updateAt,
    note: row.note,
  };
}

const SELECT_COLUMNS = `
  id, subject, content, answer_a AS answerA, answer_b AS answerB,
  answer_c AS answerC, answer_d AS answerD, correct_answer AS correctAnswer,
  DATE_FORMAT(update_at, '%Y-%m-%d %H:%i') AS updateAt, note
`;

export class MySqlQuestionRepository implements QuestionRepository {
  async list(filters: QuestionFilters): Promise<QuestionListResponse> {
    const where: string[] = [];
    const values: Array<string | number> = [];
    if (filters.subject) {
      where.push("subject = ?");
      values.push(filters.subject);
    }
    if (filters.search) {
      const query = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
      where.push("(content LIKE ? ESCAPE '\\\\' OR subject LIKE ? ESCAPE '\\\\' OR note LIKE ? ESCAPE '\\\\' OR answer_a LIKE ? ESCAPE '\\\\' OR answer_b LIKE ? ESCAPE '\\\\' OR answer_c LIKE ? ESCAPE '\\\\' OR answer_d LIKE ? ESCAPE '\\\\')");
      values.push(query, query, query, query, query, query, query);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const connection = getPool();
    const [countRows] = await connection.query<CountRow[]>(`SELECT COUNT(*) AS total FROM questions ${clause}`, values);
    const offset = (filters.page - 1) * filters.pageSize;
    const [rows] = await connection.query<DatabaseQuestion[]>(
      `SELECT ${SELECT_COLUMNS} FROM questions ${clause} ORDER BY update_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...values, filters.pageSize, offset],
    );
    return {
      items: rows.map(toQuestion),
      total: Number(countRows[0]?.total ?? 0),
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async getById(id: number): Promise<Question | null> {
    const [rows] = await getPool().query<DatabaseQuestion[]>(
      `SELECT ${SELECT_COLUMNS} FROM questions WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? toQuestion(rows[0]) : null;
  }

  async create(input: QuestionInput): Promise<Question> {
    const [result] = await getPool().execute<mysql.ResultSetHeader>(
      `INSERT INTO questions (subject, content, answer_a, answer_b, answer_c, answer_d, correct_answer, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.subject, input.content, input.answerA, input.answerB, input.answerC, input.answerD, input.correctAnswer, input.note],
    );
    const question = await this.getById(result.insertId);
    if (!question) throw new Error("The new question could not be read after insert.");
    return question;
  }

  async update(id: number, input: QuestionInput): Promise<Question | null> {
    await getPool().execute<mysql.ResultSetHeader>(
      `UPDATE questions
       SET subject = ?, content = ?, answer_a = ?, answer_b = ?, answer_c = ?, answer_d = ?, correct_answer = ?, note = ?
       WHERE id = ?`,
      [input.subject, input.content, input.answerA, input.answerB, input.answerC, input.answerD, input.correctAnswer, input.note, id],
    );
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await getPool().execute<mysql.ResultSetHeader>("DELETE FROM questions WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async healthCheck(): Promise<void> {
    await getPool().query("SELECT 1");
  }
}
