import { FetchClient } from './fetchClient.js';

const Version = 'AXIOM_VERSION';
const AxiomURL = 'https://api.axiom.co';
const isBrowser = typeof window !== 'undefined';
/**
 * ClientOptions is used to configure the HTTPClient and provide the necessary
 * authentication information.
 * 
 * @remarks
 *
 * If no options are passed to the client, The options will fallback into read its values from environment variables: 
 * AXIOM_TOKEN and AXIOM_ORG_ID for token and orgId respectively.
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
   * from @{link: Axiom settings | https://app.axiom.co/profile}.
   * 
   * @defaultValue reads from the AXIOM_TOKEN environment variable
   */
  token?: string;
  /**
   * the URL of the Axiom API, defaults to https://api.axiom.co. You should not
   * need to change this unless you are using a self-hosted version of Axiom.
   * 
   * @defaultValue reads from the AXIOM_URL environment variable
   */
  url?: string;
  /**
   * the ID of the organization to use, you can get this from Axiom settings page of your
   * organization. This is only needed if you are using a personal token.
   * 
   * @defaultValue reads from the AXIOM_ORG_ID environment variable
   */
  orgId?: string;
}

export default abstract class HTTPClient {
  protected readonly client: FetchClient;

  constructor(options: ClientOptions = {}) {
    let token = options.token;
    if (!token && !isBrowser) {
      token = process.env.AXIOM_TOKEN || '';
    } else if (!token && isBrowser) {
      console.warn('must provide Axiom token')
    }
    let url = options.url;
    if (!url && !isBrowser) {
      url = process.env.AXIOM_URL || AxiomURL;
    } else if (!url && isBrowser) {
      url = AxiomURL;
    }

    let orgId = options.orgId;
    if (!orgId && !isBrowser) {
      orgId = process.env.AXIOM_ORG_ID || ''
    }

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
      headers,
      baseUrl: url,
      timeout: 3000,
    });
  }
}
