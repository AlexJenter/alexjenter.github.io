<script lang="ts">
    import { onMount } from "svelte";
    import { PROFILES, SITE_NAME } from "$lib/site";

    // The address is only assembled in the browser, so it never appears in
    // the HTML (or whole in the JS) for scrapers. Until then the link has no
    // href; the element is server-rendered, so nothing shifts when it lands.
    let mailto = $state<string>();
    onMount(() => {
        mailto = "mailto:" + ["jenteralex", "gmail.com"].join("@");
    });
</script>

<footer>
    <span class="name">{SITE_NAME}</span>
    <ul>
        {#each PROFILES as { label, href }}
            <li><a {href}>{label}</a></li>
        {/each}
        <li><a href={mailto}>Email</a></li>
    </ul>
</footer>

<style>
    footer {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-2) var(--space-6);
        padding: var(--space-12) var(--space-8) var(--space-8);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }

    ul {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        list-style: none;
    }

    /* comfortable tap targets without looking like buttons */
    a {
        display: inline-block;
        padding-block: var(--space-1);
    }
</style>
