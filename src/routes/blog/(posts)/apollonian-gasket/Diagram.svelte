<script>
    let count = $state(0);
    let arr = $derived(Array.from({ length: count + 1 }, (_, i) => i));
    function handleClick() {
        count += 1;
    }
    function reset() {
        count = 0;
    }
</script>

<h2>Diagram</h2>

<button onclick={handleClick}>
    clicks: {count}
</button>

<button onclick={reset}> &CircleTimes; </button>

<div>
    <hr />
    {#each arr as i}
        {i} hello<br />
    {/each}
    <hr />
</div>
