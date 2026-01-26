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
 * // Using an edge endpoint for lower latency ingestion
 * const axiom = new Axiom({
 *     token: "my-token",
 *     edgeUrl: "https://eu-central-1.aws.edge.axiom.co",
 * })
 * ```
 *
 * @example
 * ```
 * // Using both url (for API operations) and edgeUrl (for ingest/query)
 * const axiom = new Axiom({
 *     token: "my-token",
 *     url: "https://api.eu.axiom.co",
 *     edgeUrl: "https://eu-central-1.aws.edge.axiom.co",
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
   * URI of the Axiom API endpoint. Used for all API operations (datasets, users, etc.).
   * When `edgeUrl` is also set, this is used for non-ingest/query operations only.
   *
   * @example "https://api.eu.axiom.co"
   */
  url?: string;
  /**
   * The Axiom edge URL to use for ingestion and query operations.
   * Specify the full URL with scheme (https://).
   * When set, ingest and query operations are sent to this endpoint for lower latency.
   * Can be used together with `url` - in that case, `url` handles API operations
   * while `edgeUrl` handles ingest/query.
   *
   * @example "https://eu-central-1.aws.edge.axiom.co"
   */
  edgeUrl?: string;
  onError?: (error: Error) => void;
}

/**
 * Helper to build an ingest URL from a base URL string.
 * Uses the URL API to properly handle query params and fragments.
 */
function buildIngestUrl(baseUrl: string, dataset: string): string {
  try {
    const parsed = new URL(baseUrl);
    const path = parsed.pathname;

    if (path === '' || path === '/') {
      // Append legacy path format, preserving query/hash
      parsed.pathname = `/v1/datasets/${dataset}/ingest`;
      return parsed.toString();
    }

    // URL has a custom path, use as-is (trim trailing slashes)
    parsed.pathname = path.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    // If URL parsing fails, do simple string concatenation as fallback
    const trimmed = baseUrl.replace(/\/+$/, '');
    return `${trimmed}/v1/datasets/${dataset}/ingest`;
  }
}

/**
 * Resolves the ingest/query endpoint URL based on the client options.
 *
 * Priority: edgeUrl > url > default cloud endpoint
 *
 * @param options - The client options
 * @param dataset - The dataset name to ingest into
 * @returns The full URL to use for ingestion
 */
export function resolveIngestUrl(options: Pick<ClientOptions, 'url' | 'edgeUrl'>, dataset: string): string {
  // If edgeUrl is set, use it for ingest/query (takes precedence)
  if (options.edgeUrl) {
    return buildIngestUrl(options.edgeUrl, dataset);
  }

  // If url is set, use it
  if (options.url) {
    return buildIngestUrl(options.url, dataset);
  }

  // Default: use cloud endpoint with legacy path format
  return `${AxiomURL}/v1/datasets/${dataset}/ingest`;
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;
  protected readonly clientOptions: ClientOptions;

  constructor({ orgId = "", token, url, edgeUrl, onError }: ClientOptions) {
    if (!token) {
      console.warn("Missing Axiom token");
    }

    // Store options for use in ingest URL resolution
    this.clientOptions = { orgId, token, url, edgeUrl, onError };

    // For the main API client, always use url or default (never edgeUrl)
    // edgeUrl only affects ingest endpoints, not other API calls
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
