import { AXIOM_TOKEN, AXIOM_DATASET } from '$env/static/private';
import { AxiomWithoutBatching } from '@axiomhq/js'
import { PUBLIC_AXIOM_URL } from '$env/static/public';

const axiom = new AxiomWithoutBatching({ token: AXIOM_TOKEN, url: PUBLIC_AXIOM_URL });

/** @type {import('./$types').RequestHandler} */
export async function POST({ url, platform, request }) {
    console.log({ url, platform })
    const events = await request.json()
    axiom.ingest(AXIOM_DATASET, events)


    return new Response("OK");
}