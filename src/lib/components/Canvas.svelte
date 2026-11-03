<script lang="ts">
	import { onMount } from 'svelte';
	import { reducedMotion } from '$lib/motion';

	type SetupFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void | Promise<void>;
	type UpdateFn = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => boolean | void;

	interface Props {
		setup?: SetupFn;
		update?: UpdateFn;
		label?: string;
		/**
		 * Ticks per second. Unset: every animation frame. Set: a timer, meant
		 * for low rates (1-10). Above that, vsync alignment starts to matter.
		 */
		fps?: number;
	}

	let { setup, update, label, fps }: Props = $props();

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
		// With `fps` it ticks on a timer, not on animation frames: at a low rate
		// vsync alignment buys nothing, and the page isn't woken sixty times a
		// second just to skip frames.
		let handle = 0;
		let timer = false; // which kind `handle` is: `fps` may change between schedule and cancel
		let stopped = false;
		let last = 0;
		const loop = (now: number) => {
			const dt = now - last;
			last = now;
			if (update?.(ctx, pw, ph, dt) === false) {
				stopped = true;
				handle = 0;
				return;
			}
			schedule();
		};
		const schedule = () => {
			const interval = fps && fps > 0 ? 1000 / fps : 0;
			timer = interval > 0;
			handle = timer
				? window.setTimeout(() => loop(performance.now()), interval)
				: requestAnimationFrame(loop);
		};
		const start = () => {
			if (handle || stopped || reduced) return;
			last = performance.now(); // resume without one huge dt
			schedule();
		};
		const pause = () => {
			if (timer) clearTimeout(handle);
			else cancelAnimationFrame(handle);
			handle = 0;
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
