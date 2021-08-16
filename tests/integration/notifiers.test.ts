/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import NotifiersService, { Notifier, Type } from '../../lib/notifiers';

const deploymentURL = process.env.AXIOM_URL || '';
const accessToken = process.env.AXIOM_TOKEN || '';

describe('NotifiersService', () => {
    const client = new NotifiersService(deploymentURL, accessToken);

    let notifier: Notifier;

    before(async () => {
        notifier = await client.create({
            name: 'Test Notifier',
            type: Type.Email,
            properties: {
                to: 'john@example.com',
            },
        });
    });

    after(async () => {
        await client.delete(notifier.id!);
    });

    describe('update', () => {
        it('should update a notifier', async () => {
            const updatedNotifier = await client.update(notifier.id!, {
                name: 'Updated Test Notifier',
                type: Type.Email,
                properties: {
                    to: 'fred@example.com',
                },
            });

            expect(updatedNotifier.name).to.equal('Updated Test Notifier');
            expect(updatedNotifier.type).to.equal(Type.Email);
            expect(updatedNotifier.properties.to).to.equal('fred@example.com');

            notifier = updatedNotifier;
        });
    });

    describe('get', () => {
        it('should get a notifier', async () => {
            const fetchedNotifier = await client.get(notifier.id!);

            expect(fetchedNotifier.name).to.equal(notifier.name);
            expect(fetchedNotifier.type).to.equal(notifier.type);
            expect(fetchedNotifier.properties.to).to.equal(notifier.properties.to);
        });
    });

    describe('list', () => {
        it('should list notifiers', async () => {
            const notifiers = await client.list();

            expect(notifiers.length).to.be.greaterThan(0);
        });
    });
});
