// Shared Zod schemas. Use on both server (validation) and client (forms).
import { z } from "zod";

export const LevelSchema = z.enum([
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
]);
export type LevelInput = z.infer<typeof LevelSchema>;

export const DayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const RoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);

// ---- Lead capture (landing page) ----
export const LeadSubmissionSchema = z.object({
  name: z.string().min(2, "Votre nom").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().min(6).max(30).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
  source: z.string().max(60).optional(),
});
export type LeadSubmissionInput = z.infer<typeof LeadSubmissionSchema>;

// ---- Student management ----
export const CreateStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  level: LevelSchema,
  subjectIds: z.array(z.string().min(1)).min(1, "Sélectionnez au moins une matière"),
  phone: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
});
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

// ---- Teacher management ----
export const CreateTeacherSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  subjectIds: z.array(z.string().min(1)).min(1),
  bio: z.string().max(500).optional(),
});

// ---- Mood check-in ----
export const MoodCheckInSchema = z.object({
  sessionId: z.string().optional(),
  type: z.enum([
    "PRE_SESSION",
    "POST_SESSION",
    "DAILY",
    "PRE_EXAM",
    "POST_EXAM",
  ]),
  score: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

// ---- Session ----
export const SessionTemplateSchema = z.object({
  subjectId: z.string(),
  teacherId: z.string(),
  roomId: z.string(),
  timeSlotId: z.string(),
  levels: z.array(LevelSchema).min(1),
  maxCapacity: z.number().int().min(1).max(30).default(10),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
});
