import { FetchClient } from './fetchClient.js';

const Version = 'AXIOM_VERSION';
const AxiomURL = 'https://api.axiom.co';

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
   * need to change this unless you are using a self-hosted version of Axiom.
   */
  url?: string;
  onError?: (error: Error) => void;
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;

  constructor({ orgId = '', token, url }: ClientOptions) {
    if (!token) {
      console.warn('Missing Axiom token');
    }

    const baseUrl = url ?? AxiomURL;

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    };
    if (typeof window === 'undefined') {
      headers['User-Agent'] = 'axiom-js/' + Version;
    }
    if (orgId) {
      headers['X-Axiom-Org-Id'] = orgId;
    }

    this.client = new FetchClient({
      baseUrl,
      headers,
      timeout: 3000,
    });
  }
}
