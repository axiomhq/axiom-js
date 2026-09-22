import { describe, expect, it, vi } from 'vitest';

import { AxiomClientWithoutBatching } from '../../src/client';
import { dashboards } from '../../src/dashboards';

const baseUrl = 'http://axiom-js-generated.dev.local';
const client = new AxiomClientWithoutBatching({ url: baseUrl, token: 'test-token' });

interface ServiceCase {
  name: string;
  call: () => Promise<unknown>;
  method: string;
  path: string;
  body?: unknown;
  status?: number;
}

const dashboardRequest = {
  dashboard: { name: 'Runtime overview' },
  overwrite: true,
} as unknown as dashboards.UpsertRequest;

const savedQueryRequest = {
  kind: 'apl' as const,
  metadata: {},
  name: 'Errors',
  query: { apl: "['logs'] | where level == 'error'" },
  who: 'user-id',
};

const cases: ServiceCase[] = [
  {
    name: 'creates dashboards',
    call: () => client.dashboards.create(dashboardRequest),
    method: 'POST',
    path: '/v2/dashboards',
    body: dashboardRequest,
  },
  {
    name: 'updates dashboards',
    call: () => client.dashboards.update('folder/dashboard', dashboardRequest),
    method: 'PUT',
    path: '/v2/dashboards/uid/folder%2Fdashboard',
    body: dashboardRequest,
  },
  {
    name: 'patches dashboard charts',
    call: () => client.dashboards.patchChart('folder/dashboard', 'chart/id', { chart: { name: 'p95' } }),
    method: 'PATCH',
    path: '/v2/dashboards/uid/folder%2Fdashboard/charts/chart%2Fid',
    body: { chart: { name: 'p95' } },
  },
  {
    name: 'deletes dashboards',
    call: () => client.dashboards.delete('folder/dashboard'),
    method: 'DELETE',
    path: '/v2/dashboards/uid/folder%2Fdashboard',
    status: 204,
  },
  {
    name: 'vacuums datasets',
    call: () => client.datasets.vacuum('dataset/name'),
    method: 'POST',
    path: '/v2/datasets/dataset%2Fname/vacuum',
    status: 204,
  },
  {
    name: 'gets dataset fields',
    call: () => client.datasets.field('dataset/name', 'field/name'),
    method: 'GET',
    path: '/v2/datasets/dataset%2Fname/fields/field%2Fname',
  },
  {
    name: 'updates dataset fields',
    call: () => client.datasets.updateField('dataset/name', 'field/name', { name: 'field/name', type: 'string' }),
    method: 'PUT',
    path: '/v2/datasets/dataset%2Fname/fields/field%2Fname',
    body: { name: 'field/name', type: 'string' },
  },
  {
    name: 'updates dataset map fields',
    call: () => client.datasets.updateMapFields('dataset/name', ['attributes']),
    method: 'PUT',
    path: '/v2/datasets/dataset%2Fname/mapfields',
    body: ['attributes'],
  },
  {
    name: 'creates dataset map fields',
    call: () => client.datasets.createMapField('dataset/name', { name: 'attributes' }),
    method: 'POST',
    path: '/v2/datasets/dataset%2Fname/mapfields',
    body: { name: 'attributes' },
  },
  {
    name: 'deletes dataset map fields',
    call: () => client.datasets.deleteMapField('dataset/name', 'field/name'),
    method: 'DELETE',
    path: '/v2/datasets/dataset%2Fname/mapfields/field%2Fname',
    status: 204,
  },
  {
    name: 'gets monitor history',
    call: () =>
      client.monitors.history('monitor/id', {
        startTime: '2026-09-01T00:00:00Z',
        endTime: '2026-09-02T00:00:00Z',
      }),
    method: 'GET',
    path: '/v2/monitors/monitor%2Fid/history?startTime=2026-09-01T00%3A00%3A00Z&endTime=2026-09-02T00%3A00%3A00Z',
  },
  {
    name: 'creates saved queries',
    call: () => client.savedQueries.create(savedQueryRequest),
    method: 'POST',
    path: '/v2/apl-starred-queries',
    body: savedQueryRequest,
  },
  {
    name: 'updates saved queries',
    call: () => client.savedQueries.update('query/id', savedQueryRequest),
    method: 'PUT',
    path: '/v2/apl-starred-queries/query%2Fid',
    body: savedQueryRequest,
  },
  {
    name: 'deletes saved queries',
    call: () => client.savedQueries.delete('query/id'),
    method: 'DELETE',
    path: '/v2/apl-starred-queries/query%2Fid',
    status: 204,
  },
  {
    name: 'updates the current user',
    call: () => client.users.updateCurrent({ name: 'New Name' }),
    method: 'PUT',
    path: '/v2/user',
    body: { name: 'New Name' },
  },
  {
    name: 'creates users',
    call: () => client.users.create({ email: 'user@example.com', name: 'User', role: 'member' }),
    method: 'POST',
    path: '/v2/users',
    body: { email: 'user@example.com', name: 'User', role: 'member' },
  },
  {
    name: 'removes users',
    call: () => client.users.remove('user/id'),
    method: 'DELETE',
    path: '/v2/users/user%2Fid',
    status: 204,
  },
  {
    name: 'updates user roles',
    call: () => client.users.updateRole('user/id', { role: 'admin' }),
    method: 'PUT',
    path: '/v2/users/user%2Fid/role',
    body: { role: 'admin' },
  },
  {
    name: 'lists organizations',
    call: () => client.orgs.list(),
    method: 'GET',
    path: '/v2/orgs',
  },
  {
    name: 'gets organizations',
    call: () => client.orgs.get('org/id'),
    method: 'GET',
    path: '/v2/orgs/org%2Fid',
  },
  {
    name: 'creates organizations',
    call: () => client.orgs.create({ name: 'New Org' }),
    method: 'POST',
    path: '/v2/orgs',
    body: { name: 'New Org' },
  },
  {
    name: 'updates organizations',
    call: () => client.orgs.update('org/id', { name: 'Updated Org' }),
    method: 'PUT',
    path: '/v2/orgs/org%2Fid',
    body: { name: 'Updated Org' },
  },
  {
    name: 'provisions organizations',
    call: () => client.orgs.provision({ name: 'Agent Org' }),
    method: 'POST',
    path: '/v2/orgs/provision',
    body: { name: 'Agent Org' },
  },
  {
    name: 'lists roles',
    call: () => client.roles.list(),
    method: 'GET',
    path: '/v2/rbac/roles',
  },
  {
    name: 'gets roles',
    call: () => client.roles.get('role/id'),
    method: 'GET',
    path: '/v2/rbac/roles/role%2Fid',
  },
  {
    name: 'creates roles',
    call: () => client.roles.create({ name: 'Operator' }),
    method: 'POST',
    path: '/v2/rbac/roles',
    body: { name: 'Operator' },
  },
  {
    name: 'updates roles',
    call: () => client.roles.update('role/id', { name: 'Admin' }),
    method: 'PUT',
    path: '/v2/rbac/roles/role%2Fid',
    body: { name: 'Admin' },
  },
  {
    name: 'deletes roles',
    call: () => client.roles.delete('role/id'),
    method: 'DELETE',
    path: '/v2/rbac/roles/role%2Fid',
    status: 204,
  },
  {
    name: 'lists groups',
    call: () => client.groups.list(),
    method: 'GET',
    path: '/v2/rbac/groups',
  },
  {
    name: 'gets groups',
    call: () => client.groups.get('group/id'),
    method: 'GET',
    path: '/v2/rbac/groups/group%2Fid',
  },
  {
    name: 'creates groups',
    call: () => client.groups.create({ name: 'Platform' }),
    method: 'POST',
    path: '/v2/rbac/groups',
    body: { name: 'Platform' },
  },
  {
    name: 'updates groups',
    call: () => client.groups.update('group/id', { name: 'Runtime' }),
    method: 'PUT',
    path: '/v2/rbac/groups/group%2Fid',
    body: { name: 'Runtime' },
  },
  {
    name: 'deletes groups',
    call: () => client.groups.delete('group/id'),
    method: 'DELETE',
    path: '/v2/rbac/groups/group%2Fid',
    status: 204,
  },
  {
    name: 'lists notifiers',
    call: () => client.notifiers.list(),
    method: 'GET',
    path: '/v2/notifiers',
  },
  {
    name: 'gets notifiers',
    call: () => client.notifiers.get('notifier/id'),
    method: 'GET',
    path: '/v2/notifiers/notifier%2Fid',
  },
  {
    name: 'creates notifiers',
    call: () => client.notifiers.create({ name: 'Slack', properties: { slack: { slackUrl: 'https://example.com' } } }),
    method: 'POST',
    path: '/v2/notifiers',
    body: { name: 'Slack', properties: { slack: { slackUrl: 'https://example.com' } } },
  },
  {
    name: 'updates notifiers',
    call: () => client.notifiers.update('notifier/id', { name: 'Email', properties: { email: {} } }),
    method: 'PUT',
    path: '/v2/notifiers/notifier%2Fid',
    body: { name: 'Email', properties: { email: {} } },
  },
  {
    name: 'deletes notifiers',
    call: () => client.notifiers.delete('notifier/id'),
    method: 'DELETE',
    path: '/v2/notifiers/notifier%2Fid',
    status: 204,
  },
  {
    name: 'lists virtual fields',
    call: () => client.virtualFields.list({ dataset: 'dataset/name' }),
    method: 'GET',
    path: '/v2/vfields?dataset=dataset%2Fname',
  },
  {
    name: 'gets virtual fields',
    call: () => client.virtualFields.get('field/id'),
    method: 'GET',
    path: '/v2/vfields/field%2Fid',
  },
  {
    name: 'creates virtual fields',
    call: () => client.virtualFields.create({ dataset: 'logs', expression: 'status', name: 'status_text' }),
    method: 'POST',
    path: '/v2/vfields',
    body: { dataset: 'logs', expression: 'status', name: 'status_text' },
  },
  {
    name: 'updates virtual fields',
    call: () =>
      client.virtualFields.update('field/id', { dataset: 'logs', expression: 'status_code', name: 'status_text' }),
    method: 'PUT',
    path: '/v2/vfields/field%2Fid',
    body: { dataset: 'logs', expression: 'status_code', name: 'status_text' },
  },
  {
    name: 'deletes virtual fields',
    call: () => client.virtualFields.delete('field/id'),
    method: 'DELETE',
    path: '/v2/vfields/field%2Fid',
    status: 204,
  },
  {
    name: 'lists views',
    call: () => client.views.list(),
    method: 'GET',
    path: '/v2/views',
  },
  {
    name: 'gets views',
    call: () => client.views.get('view/id'),
    method: 'GET',
    path: '/v2/views/view%2Fid',
  },
  {
    name: 'creates views',
    call: () => client.views.create({ aplQuery: "['logs']", name: 'Logs' }),
    method: 'POST',
    path: '/v2/views',
    body: { aplQuery: "['logs']", name: 'Logs' },
  },
  {
    name: 'updates views',
    call: () => client.views.update('view/id', { aplQuery: "['logs'] | limit 10", name: 'Logs' }),
    method: 'PUT',
    path: '/v2/views/view%2Fid',
    body: { aplQuery: "['logs'] | limit 10", name: 'Logs' },
  },
  {
    name: 'deletes views',
    call: () => client.views.delete('view/id'),
    method: 'DELETE',
    path: '/v2/views/view%2Fid',
    status: 204,
  },
];

describe('generated v2 service wrappers', () => {
  it.each(cases)('$name', async ({ body, call, method, path, status = 200 }) => {
    vi.spyOn(global, 'fetch').mockImplementationOnce((url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toEqual(`${baseUrl}${path}`);
      expect(init?.method).toEqual(method);
      if (body === undefined) {
        expect(init?.body).toBeUndefined();
      } else {
        expect(init?.body).toEqual(JSON.stringify(body));
      }

      return Promise.resolve(
        status === 204 ? new Response(null, { status }) : new Response(JSON.stringify({}), { status }),
      );
    });

    if (status === 204) {
      await expect(call()).resolves.toBeUndefined();
    } else {
      await expect(call()).resolves.toBeDefined();
    }
  });
});
