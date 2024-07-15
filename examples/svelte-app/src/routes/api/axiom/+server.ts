import type { RequestHandler } from '@sveltejs/kit';

import { AxiomWithoutBatching } from '@axiomhq/js'

import { AXIOM_TOKEN, AXIOM_DATASET, AXIOM_URL } from '$env/static/private';

const axiom = new AxiomWithoutBatching({ token: AXIOM_TOKEN, url: AXIOM_URL });

export const POST: RequestHandler = async ({ request }) => {
    
    const events = await request.json()
    axiom.ingest(AXIOM_DATASET, events)

    return new Response("OK");
}