import { describe, expect, it, vi } from 'vitest';

import { annotations } from '../../src/annotations';
import { AxiomClientWithoutBatching } from '../../src/client';
import { dashboards } from '../../src/dashboards';
import { datasets } from '../../src/datasets';
import { groups } from '../../src/groups';
import { monitors } from '../../src/monitors';
import { notifiers } from '../../src/notifiers';
import { orgs } from '../../src/orgs';
import { roles } from '../../src/roles';
import { savedQueries } from '../../src/savedQueries';
import { tokens } from '../../src/tokens';
import { users } from '../../src/users';
import { views } from '../../src/views';
import { virtualFields } from '../../src/virtualFields';

const clientURL = 'http://axiom-js-services.dev.local';

describe('AxiomClientWithoutBatching mounted services', () => {
  it('mounts every management service', () => {
    const client = new AxiomClientWithoutBatching({ url: clientURL, token: 'test-token' });

    expect(client.annotations).toBeInstanceOf(annotations.Service);
    expect(client.dashboards).toBeInstanceOf(dashboards.Service);
    expect(client.datasets).toBeInstanceOf(datasets.Service);
    expect(client.groups).toBeInstanceOf(groups.Service);
    expect(client.monitors).toBeInstanceOf(monitors.Service);
    expect(client.notifiers).toBeInstanceOf(notifiers.Service);
    expect(client.orgs).toBeInstanceOf(orgs.Service);
    expect(client.roles).toBeInstanceOf(roles.Service);
    expect(client.savedQueries).toBeInstanceOf(savedQueries.Service);
    expect(client.tokens).toBeInstanceOf(tokens.Service);
    expect(client.users).toBeInstanceOf(users.Service);
    expect(client.views).toBeInstanceOf(views.Service);
    expect(client.virtualFields).toBeInstanceOf(virtualFields.Service);
  });

  it('propagates client configuration to mounted services', async () => {
    const client = new AxiomClientWithoutBatching({
      url: clientURL,
      token: 'test-token',
      orgId: 'org-id',
    });
    client.appendAxiomClient('my-app/1.0');

    vi.spyOn(global, 'fetch').mockImplementationOnce((url: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);

      expect(String(url)).toEqual(`${clientURL}/v2/tokens`);
      expect(headers.get('Authorization')).toEqual('Bearer test-token');
      expect(headers.get('X-Axiom-Org-Id')).toEqual('org-id');
      expect(headers.get('X-Axiom-Client')).toEqual('axiom-js/AXIOM_VERSION my-app/1.0');

      return Promise.resolve(Response.json([]));
    });

    await expect(client.tokens.list()).resolves.toEqual([]);
  });
});
