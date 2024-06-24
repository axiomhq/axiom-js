<script lang="ts">
  async function failure() {
    const res = await fetch('/api/error');
    if (!res.ok) {
      throw new Error('Example Frontend Error');
    }
  }
</script>

<div>
  <main>
      <button type="button" on:click|preventDefault={failure}> Throw error! </button>
  </main>
</div>
