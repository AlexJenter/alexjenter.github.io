<script lang="ts">
	import { onMount } from 'svelte';

	type SetupFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void | Promise<void>;
	type UpdateFn = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => boolean | void;

	interface Props {
		setup?: SetupFn;
		update?: UpdateFn;
		label?: string;
	}

	let { setup, update, label }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let pw = $state(0);
	let ph = $state(0);

	onMount(() => {
		const ctx = canvas!.getContext('2d')!;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		let ready = false;
		const ro = new ResizeObserver(async ([entry]) => {
			const dpr = window.devicePixelRatio;
			const { width: w, height: h } = entry.contentRect;
			pw = Math.round(w * dpr);
			ph = Math.round(h * dpr);
			canvas!.width = pw;
			canvas!.height = ph;
			if (!ready) {
				ready = true;
				await setup?.(ctx, pw, ph);
				if (reducedMotion) update?.(ctx, pw, ph, 0);
			}
		});

		ro.observe(canvas!.parentElement!);

		let rafId: number;
		if (!reducedMotion) {
			let last = performance.now();
			const loop = (now: number) => {
				const dt = now - last;
				last = now;
				const cont = update?.(ctx, pw, ph, dt);
				if (cont !== false) rafId = requestAnimationFrame(loop);
			};
			rafId = requestAnimationFrame(loop);
		}

		return () => {
			ro.disconnect();
			cancelAnimationFrame(rafId);
		};
	});
</script>

<canvas bind:this={canvas} role={label ? 'img' : undefined} aria-label={label}></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
