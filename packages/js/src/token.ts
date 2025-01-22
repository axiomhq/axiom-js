export function isAxiomPersonalToken(token: string): boolean {
  if (token.startsWith("xapt")) {
    return true;
  }

  return false;
}
