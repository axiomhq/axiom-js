import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
  url: process.env.AXIOM_URL || '',
});

async function inspectUsers() {
  const currentUser = await axiom.users.current();

  console.log(`current user: ${currentUser.name}`);
  console.log(`id: ${currentUser.id}`);
  console.log(`email: ${currentUser.email ?? currentUser.emails?.[0] ?? 'unknown'}`);
  console.log(`role: ${currentUser.role?.name ?? currentUser.role?.id ?? 'none'}`);

  const users = await axiom.users.list();
  console.log(`\nusers: ${users.length}`);
  for (const user of users.slice(0, 10)) {
    console.log(`- ${user.name} (${user.id})`);
  }

  const userId = process.env.AXIOM_USER_ID || users[0]?.id || currentUser.id;
  const user = await axiom.users.get(userId);
  console.log(`\nselected user: ${user.name}`);
  console.log(`id: ${user.id}`);
  console.log(`email: ${user.email ?? user.emails?.[0] ?? 'unknown'}`);
}

inspectUsers().catch(console.error);
