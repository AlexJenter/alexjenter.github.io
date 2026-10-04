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
			if (rafId || stopped || reducedMotion) return;
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
