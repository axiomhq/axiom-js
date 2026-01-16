import { FetchClient } from "./fetchClient.js";

const Version = "AXIOM_VERSION";
const AxiomURL = "https://api.axiom.co";

/**
 * ClientOptions is used to configure the HTTPClient and provide the necessary
 * authentication information.
 *
 * @example
 * ```
 * const axiom = new Axiom({
 *     token: "my-token",
 *     orgId: "my-org-id",
 * })
 * ```
 *
 * @example
 * ```
 * // Using a regional edge endpoint for lower latency ingestion
 * const axiom = new Axiom({
 *     token: "my-token",
 *     region: "eu-central-1.aws.edge.axiom.co",
 * })
 * ```
 */
export interface ClientOptions {
  /**
   * an API or personal token to use for authentication, you can get one
   * from @{link: Axiom settings | https://app.axiom.co/api-tokens}.
   */
  token: string;
  /**
   * the ID of the organization to use, you can get this from Axiom settings page of your
   * organization. This is only needed if you are using a personal token.
   */
  orgId?: string;
  /**
   * the URL of the Axiom API, defaults to https://api.axiom.co. You should not
   * need to change this unless your organization uses a specific region or a self-hosted version of Axiom.
   *
   * If a path is provided, the URL is used as-is for ingest.
   * If no path (or only `/`) is provided, `/v1/datasets/{dataset}/ingest` is appended for backwards compatibility.
   * Cannot be used together with `region`.
   */
  url?: string;
  /**
   * The Axiom regional edge domain to use for ingestion.
   *
   * Specify the domain name only (no scheme, no path).
   * When set, data is sent to `https://{region}/v1/ingest/{dataset}`.
   * Cannot be used together with `url`.
   *
   * @example "mumbai.axiom.co"
   * @example "eu-central-1.aws.edge.axiom.co"
   */
  region?: string;
  /**
   * The full URL of the Axiom edge ingest endpoint.
   *
   * When set, this URL is used directly for ingestion (with `/{dataset}` appended).
   * Use this for explicit control over the edge endpoint.
   * Cannot be used together with `url` or `region`.
   *
   * @example "https://eu-central-1.aws.edge.axiom.co/v1/ingest"
   */
  ingestUrl?: string;
  onError?: (error: Error) => void;
}

/**
 * Resolves the ingest endpoint URL based on the client options.
 *
 * Priority: ingestUrl > url > region > default cloud endpoint
 *
 * @param options - The client options
 * @param dataset - The dataset name to ingest into
 * @returns The full URL to use for ingestion
 */
export function resolveIngestUrl(options: Pick<ClientOptions, 'url' | 'region' | 'ingestUrl'>, dataset: string): string {
  // If ingestUrl is set, use it directly with dataset appended
  if (options.ingestUrl) {
    const ingestUrl = options.ingestUrl.replace(/\/+$/, ''); // trim trailing slashes
    return `${ingestUrl}/${dataset}`;
  }

  // If url is set, check if it has a path
  if (options.url) {
    const url = options.url.replace(/\/+$/, ''); // trim trailing slashes

    // Parse URL to check if path is provided
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;

      if (path === '' || path === '/') {
        // Backwards compatibility: append legacy path format
        return `${url}/v1/datasets/${dataset}/ingest`;
      }

      // URL has a custom path, use as-is
      return url;
    } catch {
      // If URL parsing fails, append legacy path format
      return `${url}/v1/datasets/${dataset}/ingest`;
    }
  }

  // If region is set, build the regional edge endpoint
  if (options.region) {
    const region = options.region.replace(/\/+$/, ''); // trim trailing slashes
    return `https://${region}/v1/ingest/${dataset}`;
  }

  // Default: use cloud endpoint with legacy path format
  return `${AxiomURL}/v1/datasets/${dataset}/ingest`;
}

/**
 * Validates that only one of url, region, or ingestUrl is set.
 * @throws Error if multiple endpoint options are set
 */
export function validateUrlOrRegion(options: Pick<ClientOptions, 'url' | 'region' | 'ingestUrl'>): void {
  const setOptions = [
    options.url && 'url',
    options.region && 'region',
    options.ingestUrl && 'ingestUrl',
  ].filter(Boolean);

  if (setOptions.length > 1) {
    throw new Error(`Cannot set multiple endpoint options (${setOptions.join(', ')}). Please use only one.`);
  }
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;
  protected readonly clientOptions: ClientOptions;

  constructor(options: ClientOptions) {
    const { orgId = "", token, url, region, ingestUrl } = options;

    if (!token) {
      console.warn("Missing Axiom token");
    }

    // Validate that only one endpoint option is set
    validateUrlOrRegion({ url, region, ingestUrl });

    // Store options for use in ingest URL resolution
    this.clientOptions = options;

    // For the main API client, always use url or default (never region)
    // Region only affects ingest endpoints, not other API calls
    const baseUrl = url ? url.replace(/\/+$/, '') : AxiomURL;

    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };
    if (typeof window === "undefined") {
      headers["User-Agent"] = "axiom-js/" + Version;
    }
    if (orgId) {
      headers["X-Axiom-Org-Id"] = orgId;
    }

    this.client = new FetchClient({
      baseUrl,
      headers,
      timeout: 20_000,
    });
  }
}
