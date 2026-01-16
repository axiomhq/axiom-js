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
 *     edgeRegion: "eu-central-1.aws.edge.axiom.co",
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
   * URI of the Axiom endpoint to send data to.
   *
   * If a path is provided, the URL is used as-is.
   * If no path (or only `/`) is provided, `/v1/datasets/{dataset}/ingest` is appended for backwards compatibility.
   * This takes precedence over `edgeRegion` if both are set (but both should not be set).
   *
   * @example "https://api.eu.axiom.co"
   * @example "http://localhost:3400/ingest"
   */
  url?: string;
  /**
   * The Axiom regional edge domain to use for ingestion.
   *
   * Specify the domain name only (no scheme, no path).
   * When set, data is sent to `https://{edgeRegion}/v1/ingest/{dataset}`.
   * Cannot be used together with `url`.
   *
   * @example "mumbai.axiom.co"
   * @example "eu-central-1.aws.edge.axiom.co"
   */
  edgeRegion?: string;
  onError?: (error: Error) => void;
}

/**
 * Resolves the ingest endpoint URL based on the client options.
 *
 * Priority: url > edgeRegion > default cloud endpoint
 *
 * @param options - The client options
 * @param dataset - The dataset name to ingest into
 * @returns The full URL to use for ingestion
 */
export function resolveIngestUrl(options: Pick<ClientOptions, 'url' | 'edgeRegion'>, dataset: string): string {
  // If url is set, check if it has a path
  if (options.url) {
    const url = options.url.replace(/\/+$/, ''); // trim trailing slashes

    // Parse URL to check if path is provided
    // If path is empty or just "/", append the legacy format for backwards compatibility
    // Otherwise, use the URL as-is
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

  // If edgeRegion is set, build the regional edge endpoint
  if (options.edgeRegion) {
    const edgeRegion = options.edgeRegion.replace(/\/+$/, ''); // trim trailing slashes
    return `https://${edgeRegion}/v1/ingest/${dataset}`;
  }

  // Default: use cloud endpoint with legacy path format
  return `${AxiomURL}/v1/datasets/${dataset}/ingest`;
}

/**
 * Validates that url and edgeRegion are not both set.
 * @throws Error if both url and edgeRegion are set
 */
export function validateUrlOrRegion(options: Pick<ClientOptions, 'url' | 'edgeRegion'>): void {
  if (options.url && options.edgeRegion) {
    throw new Error('Cannot set both `url` and `edgeRegion`. Please use only one.');
  }
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;
  protected readonly clientOptions: ClientOptions;

  constructor(options: ClientOptions) {
    const { orgId = "", token, url, edgeRegion } = options;

    if (!token) {
      console.warn("Missing Axiom token");
    }

    // Validate that url and edgeRegion are not both set
    validateUrlOrRegion({ url, edgeRegion });

    // Store options for use in ingest URL resolution
    this.clientOptions = options;

    // For the main API client, always use url or default (never edgeRegion)
    // edgeRegion only affects ingest endpoints, not other API calls
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
