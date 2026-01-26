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
 * // Using an edge domain for lower latency ingestion
 * const axiom = new Axiom({
 *     token: "my-token",
 *     edge: "eu-central-1.aws.edge.axiom.co",
 * })
 * ```
 *
 * @example
 * ```
 * // Using both url (for API operations) and edge (for ingest/query)
 * const axiom = new Axiom({
 *     token: "my-token",
 *     url: "https://api.eu.axiom.co",
 *     edge: "eu-central-1.aws.edge.axiom.co",
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
   * When edge options are set, this is used for non-ingest/query operations only.
   *
   * @example "https://api.eu.axiom.co"
   */
  url?: string;
  /**
   * The Axiom edge domain for ingestion and query operations.
   * Specify just the domain without scheme (https:// is added automatically).
   * When set, ingest and query operations are routed to this edge endpoint.
   * Can be used together with `url` - in that case, `url` handles API operations
   * while `edge` handles ingest/query.
   *
   * @example "eu-central-1.aws.edge.axiom.co"
   */
  edge?: string;
  /**
   * The Axiom edge URL for ingestion and query operations.
   * Specify the full URL with scheme.
   * Takes precedence over `edge` if both are set.
   * If the URL has a custom path, it is used as-is.
   * If the URL has no path, the edge path format is used.
   *
   * @example "https://eu-central-1.aws.edge.axiom.co"
   * @example "http://localhost:3400/ingest"
   */
  edgeUrl?: string;
  onError?: (error: Error) => void;
}

/**
 * Builds an ingest URL using edge path format: /v1/ingest/{dataset}
 */
function buildEdgeIngestUrl(baseUrl: string, dataset: string): string {
  try {
    const parsed = new URL(baseUrl);
    const path = parsed.pathname;

    if (path === '' || path === '/') {
      // Use edge path format
      parsed.pathname = `/v1/ingest/${dataset}`;
      return parsed.toString();
    }

    // URL has a custom path, use as-is (trim trailing slashes)
    parsed.pathname = path.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    // If URL parsing fails, do simple string concatenation as fallback
    const trimmed = baseUrl.replace(/\/+$/, '');
    return `${trimmed}/v1/ingest/${dataset}`;
  }
}

/**
 * Builds an ingest URL using legacy path format: /v1/datasets/{dataset}/ingest
 */
function buildLegacyIngestUrl(baseUrl: string, dataset: string): string {
  try {
    const parsed = new URL(baseUrl);
    const path = parsed.pathname;

    if (path === '' || path === '/') {
      // Use legacy path format
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
 * Resolves the ingest endpoint URL based on the client options.
 *
 * Priority: edgeUrl > edge > url > default cloud endpoint
 *
 * Edge endpoints use: /v1/ingest/{dataset}
 * Legacy endpoints use: /v1/datasets/{dataset}/ingest
 *
 * @param options - The client options
 * @param dataset - The dataset name to ingest into
 * @returns The full URL to use for ingestion
 */
export function resolveIngestUrl(options: Pick<ClientOptions, 'url' | 'edge' | 'edgeUrl'>, dataset: string): string {
  // If edgeUrl is set, use it (takes precedence over edge)
  if (options.edgeUrl) {
    return buildEdgeIngestUrl(options.edgeUrl, dataset);
  }

  // If edge domain is set, build edge URL
  if (options.edge) {
    return `https://${options.edge}/v1/ingest/${dataset}`;
  }

  // If url is set, use legacy path format
  if (options.url) {
    return buildLegacyIngestUrl(options.url, dataset);
  }

  // Default: use cloud endpoint with legacy path format
  return `${AxiomURL}/v1/datasets/${dataset}/ingest`;
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;
  protected readonly clientOptions: ClientOptions;

  constructor({ orgId = "", token, url, edge, edgeUrl, onError }: ClientOptions) {
    if (!token) {
      console.warn("Missing Axiom token");
    }

    // Store options for use in ingest URL resolution
    this.clientOptions = { orgId, token, url, edge, edgeUrl, onError };

    // For the main API client, always use url or default (never edge options)
    // edge/edgeUrl only affects ingest endpoints, not other API calls
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
