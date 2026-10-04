import { Hono } from "hono";
import { listPackagesHandler, getPackageHandler } from "./packages.controller.js";

export const packagesRouter = new Hono();

packagesRouter.get("/", listPackagesHandler);
packagesRouter.get("/:id", getPackageHandler);
