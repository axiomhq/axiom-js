import type { FrameworkIdentifier } from '@axiomhq/logging';
import { Version } from './lib/runtime';

export const frameworkIdentifier = {
  name: 'next-axiom-version',
  version: Version ?? 'unknown',
} satisfies FrameworkIdentifier;
