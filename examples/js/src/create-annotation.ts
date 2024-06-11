import { annotations } from '@axiomhq/js';


async function main() {
    const client = new annotations.Service({ token: 'token' });
    await client.create({
        type: 'deployment',
        datasets: ['dataset_name'],
        title: 'New deployment',
        description: 'Deployed version 1.0.0 with fixes for ...',
    })
}

main();