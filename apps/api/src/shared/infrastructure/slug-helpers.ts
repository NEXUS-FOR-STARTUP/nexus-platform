export function generateRandomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function ensureUniqueSlug(
  baseSlug: string,
  isConflictFn: (candidate: string) => Promise<boolean>,
  maxLength = 160,
  suffixLength = 4
): Promise<string> {
  const trimmed = baseSlug.trim() || 'item';
  let candidate = trimmed;

  const hasInitialConflict = await isConflictFn(candidate);
  if (!hasInitialConflict) {
    return candidate;
  }

  // Ensure base slug doesn't overflow maxLength with "-xxxx" suffix
  const maxBaseLength = maxLength - (suffixLength + 1);
  const safeBase =
    trimmed.length > maxBaseLength
      ? trimmed.slice(0, maxBaseLength).replace(/-+$/, '')
      : trimmed;

  while (await isConflictFn(candidate)) {
    const suffix = generateRandomSuffix(suffixLength);
    candidate = `${safeBase}-${suffix}`;
  }

  return candidate;
}
