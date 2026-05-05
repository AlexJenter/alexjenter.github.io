<script lang="ts">
    let { src, alt, caption } = $props();
</script>

<figure>
    <enhanced:img {src} {alt} sizes="min(1280px, 100vw)" />
    {#if caption}
        <figcaption>{caption}</figcaption>
    {/if}
</figure>
