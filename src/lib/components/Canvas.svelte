<script lang="ts">
	import { onMount } from 'svelte';
	import { reducedMotion } from '$lib/motion';

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

		const reduced = reducedMotion.current;

		let ready = false;
		let resizeId = 0;
		const ro = new ResizeObserver(async ([entry]) => {
			const dpr = window.devicePixelRatio;
			const { width: w, height: h } = entry.contentRect;
			pw = Math.round(w * dpr);
			ph = Math.round(h * dpr);
			canvas!.width = pw;
			canvas!.height = ph;
			// A newer resize makes this one stale. Setting the size cleared the canvas,
			// so only the latest call may paint.
			const id = ++resizeId;
			if (!ready) {
				ready = true;
				await setup?.(ctx, pw, ph);
			}
			if (id !== resizeId) return;
			// The new size cleared the canvas. Repaint now, because the loop may be
			// stopped, paused off screen, or off for reduced motion. dt is 0.
			update?.(ctx, pw, ph, 0);
		});

		ro.observe(canvas!.parentElement!);

		// The loop only runs while the canvas is on screen. `stopped` is set once
		// update() returns false, so a finished loop stays finished.
		let rafId = 0;
		let stopped = false;
		let last = 0;
		const loop = (now: number) => {
			const dt = now - last;
			last = now;
			if (update?.(ctx, pw, ph, dt) === false) {
				stopped = true;
				rafId = 0;
				return;
			}
			rafId = requestAnimationFrame(loop);
		};
		const start = () => {
			if (rafId || stopped || reduced) return;
			last = performance.now(); // resume without one huge dt
			rafId = requestAnimationFrame(loop);
		};
		const pause = () => {
			cancelAnimationFrame(rafId);
			rafId = 0;
		};

		const io = new IntersectionObserver(([entry]) =>
			entry.isIntersecting ? start() : pause()
		);
		io.observe(canvas!);

		return () => {
			ro.disconnect();
			io.disconnect();
			pause();
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
