import { filePaths } from "./files";

export const stages = [
    "htmlretrieve",
    "htmlcompress",
    "formcode",
    "formprops",
    "formschema",
    "formfill",
] as const;

export type Stage = (typeof stages)[number];

export type Files = keyof ReturnType<typeof filePaths>;
export type StageResult = Partial<{ [key in Files]: unknown }>;
export type StageDependencies = Partial<
    Record<Stage, Partial<Record<Files, any>>>
>;
export type StageMethod = (
    dependencies: StageDependencies
) => Promise<StageResult>;
