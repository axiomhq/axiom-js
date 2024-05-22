import { onLCP, onINP, onCLS, onFCP } from 'web-vitals';
import { reportWebVitalsWithPath } from './webVitals';
import { usePathname } from '../util';
export { AxiomWebVitals } from './components'

export function useReportWebVitals(path?: string) {
    const [pathName] = usePathname();

    onFCP((metric) => reportWebVitalsWithPath(metric, path || pathName));
    onLCP((metric) => reportWebVitalsWithPath(metric, path || pathName));
    onINP((metric) => reportWebVitalsWithPath(metric, path || pathName));
    onCLS((metric) => reportWebVitalsWithPath(metric, path || pathName));
}
