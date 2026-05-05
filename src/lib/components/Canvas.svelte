<script lang="ts">
	import { onMount } from 'svelte';

	type UpdateFn = (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void;

	interface Props {
		update?: UpdateFn;
		color?: string;
		background?: string;
	}

	let { update, color = '#333', background = '#fff' }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	// Physical pixel dimensions (CSS size × DPR)
	let pw = $state(0);
	let ph = $state(0);

	// Drawing tool state
	let isDrawing = false;
	let start = { x: 0, y: 0 };
	let bRect = { top: 0, left: 0 };

	onMount(() => {
		const ctx = canvas!.getContext('2d')!;
		ctx.lineWidth = 3;

		const ro = new ResizeObserver(([entry]) => {
			const dpr = window.devicePixelRatio;
			const { width: w, height: h } = entry.contentRect;
			pw = Math.round(w * dpr);
			ph = Math.round(h * dpr);
			canvas!.width = pw;
			canvas!.height = ph;
			bRect = canvas!.getBoundingClientRect();
		});

		ro.observe(canvas!.parentElement!);

		const cleanups: Array<() => void> = [() => ro.disconnect()];

		if (update) {
			let rafId: number;
			let last = performance.now();

			const loop = (now: number) => {
				const dt = now - last;
				last = now;
				update(ctx, pw, ph, dt);
				rafId = requestAnimationFrame(loop);
			};

			rafId = requestAnimationFrame(loop);
			cleanups.push(() => cancelAnimationFrame(rafId));
		}

		return () => cleanups.forEach((fn) => fn());
	});

	// Drawing tool — inactive when update loop is running
	const onDrawStart = ({ offsetX: x, offsetY: y }: MouseEvent) => {
		if (update) return;
		const ctx = canvas!.getContext('2d')!;
		if (color === background) {
			ctx.clearRect(0, 0, pw, ph);
		} else {
			isDrawing = true;
			start = { x, y };
		}
	};

	const onDrawEnd = () => { isDrawing = false; };

	const onDrawMove = ({ offsetX: x1, offsetY: y1 }: MouseEvent) => {
		if (!isDrawing) return;
		const ctx = canvas!.getContext('2d')!;
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.lineTo(x1, y1);
		ctx.closePath();
		ctx.stroke();
		start = { x: x1, y: y1 };
	};

	const touchOffset = (touch: Touch) => ({
		offsetX: touch.clientX - bRect.left,
		offsetY: touch.clientY - bRect.top
	});
</script>

<canvas
	bind:this={canvas}
	style:background
	onmousedown={onDrawStart}
	onmouseup={onDrawEnd}
	onmouseleave={onDrawEnd}
	onmousemove={onDrawMove}
	ontouchstart={(e) => onDrawStart(touchOffset(e.touches[0]) as MouseEvent)}
	ontouchend={onDrawEnd}
	ontouchmove={(e) => onDrawMove(touchOffset(e.touches[0]) as MouseEvent)}
></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
