<script lang="ts">
	import { onMount } from 'svelte';

	type SetupFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void | Promise<void>;
	type UpdateFn = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void;

	interface Props {
		setup?: SetupFn;
		update?: UpdateFn;
	}

	let { setup, update }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let pw = $state(0);
	let ph = $state(0);

	onMount(() => {
		const ctx = canvas!.getContext('2d')!;

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
			}
		});

		ro.observe(canvas!.parentElement!);

		let rafId: number;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = now - last;
			last = now;
			update?.(ctx, pw, ph, dt);
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);

		return () => {
			ro.disconnect();
			cancelAnimationFrame(rafId);
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
