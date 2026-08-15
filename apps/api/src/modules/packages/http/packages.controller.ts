import { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import { listPackagesUseCase } from "../application/list-packages.usecase.js";
import { getPackageUseCase } from "../application/get-package.usecase.js";

// ---------------------------------------------------------------------------
// GET /api/packages — List service packages
// ---------------------------------------------------------------------------

export async function listPackagesHandler(c: Context) {
  try {
    const packages = await listPackagesUseCase();
    return c.json(packages);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function getPackageHandler(c: Context) {
  try {
    const { id } = c.req.param();
    const result = await getPackageUseCase(id);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}
