import { Prisma } from "@prisma/client";

type PrismaErrorOpts = {
  logTag: string;
  failMessage: string;
};

/** 将 Prisma / 未知错误转为带 data.hint 的 H3 错误，避免生产环境只剩 internal server error */
export function throwFromPrismaError(error: unknown, opts: PrismaErrorOpts): never {
  const { logTag, failMessage } = opts;
  if (error && typeof error === "object" && "statusCode" in error) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw createError({
      statusCode: 400,
      statusMessage: "database constraint failed",
      data: { code: error.code, hint: error.message.slice(0, 200) },
    });
  }
  const errName = error && typeof error === "object" ? (error as { name?: string }).name : "";
  if (errName === "PrismaClientInitializationError") {
    const hint = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
    console.error(logTag, error);
    throw createError({
      statusCode: 503,
      statusMessage: "Database connection failed",
      data: { hint },
    });
  }
  if (errName === "PrismaClientUnknownRequestError") {
    const hint = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
    console.error(logTag, error);
    throw createError({
      statusCode: 500,
      statusMessage: `${failMessage}: ${hint}`,
      data: { hint },
    });
  }
  console.error(logTag, error);
  const hint = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
  throw createError({
    statusCode: 500,
    statusMessage: `${failMessage}: ${hint}`,
    data: { hint },
  });
}
