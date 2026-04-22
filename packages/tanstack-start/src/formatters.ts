import type { Formatter } from '@axiomhq/logging';
import { frameworkIdentifierFormatter } from './identifier';

export const tanStackStartClientFormatters: Formatter[] = [frameworkIdentifierFormatter];
