import { prisma } from "../../../db.js";
import { receivableSystemUserEmail } from "../../../env.js";

export interface SystemAccount {
  id: string;
  email: string;
  name: string | null;
}

/** The configured wallet owner for "mua lượt hộ"; null when the env is unset or matches no user. */
export async function findSystemAccount(): Promise<SystemAccount | null> {
  const email = receivableSystemUserEmail();
  if (!email) return null;
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, name: true },
  });
}
