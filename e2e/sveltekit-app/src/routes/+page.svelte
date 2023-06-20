<script>
    import { Axiom } from '@axiomhq/js'

    const axiom = new Axiom()
    axiom.ingest('test', { message: 'Hello World!' })

    axiom.flush()
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
