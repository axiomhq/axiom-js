import Client from '@axiomhq/axiom-node';

const client = new Client();

async function listDatasets() {
    const res = await client.datasets.list();
    for(let ds of res) {
        console.log(`found dataset: ${ds.name}`);
    }
}

listDatasets();
