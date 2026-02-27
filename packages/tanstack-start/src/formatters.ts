import type { Formatter } from '@axiomhq/logging';
import { frameworkIdentifierFormatter } from './identifier';

export const tanStackRouterFormatters: Formatter[] = [frameworkIdentifierFormatter];
export const tanStackStartClientFormatters: Formatter[] = [frameworkIdentifierFormatter];
