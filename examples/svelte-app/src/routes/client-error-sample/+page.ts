import type { PageLoad } from "../$types";

export const load: PageLoad = async () => {
    throw new Error(" Example Page Load Error");
};