import { filePaths } from "./files";

export type Stage =
    | "retrieve"
    | "compress"
    | "formcode"
    | "formprops"
    | "formschema"
    | "formfill";

export type Files = keyof ReturnType<typeof filePaths>;
export type StageResult = Partial<{ [key in Files]: unknown }>;
export type StageMethod = (
    paths: ReturnType<typeof filePaths>
) => Promise<StageResult>;
