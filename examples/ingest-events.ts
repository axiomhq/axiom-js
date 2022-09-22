import Client, { datasets } from '@axiomhq/axiom-node';

const client = new Client();

async function ingest() {
    const events = [
        {
            foo: 'bar',
        },
        {
            x: 'y',
        },
    ];

    const res = await client.datasets.ingestEvents('test', events);
    console.log('Ingested %d events with %d failures', res.ingested, res.failed);
    // Ingested 2 events with 0 failures
}

ingest();
