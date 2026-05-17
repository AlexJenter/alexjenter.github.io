<script lang="ts">
	interface Props {
		quote: string;
		author?: string;
		href?: string;
	}

	let { quote, author, href }: Props = $props();
</script>

<figure class="quote">
	<blockquote>
		<p>{quote}</p>
	</blockquote>
	{#if author}
		<figcaption>
			<cite>
				{#if href}
					<a {href}>{author}</a>
				{:else}
					{author}
				{/if}
			</cite>
		</figcaption>
	{/if}
</figure>

<style>
	.quote {
		margin: var(--space-8) 0;
		padding-inline-start: var(--space-6);
		border-inline-start: 3px solid var(--color-border);
	}

	blockquote p {
		font-size: var(--text-xl);
		font-style: italic;
		line-height: var(--leading-normal);
		margin: 0;
	}

	figcaption {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	figcaption a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
