<script lang="ts">
    import { onMount } from "svelte";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        fadeZone?: number;
        children?: Snippet;
    }

    let { title, fadeZone, children }: Props = $props();

    const storageKey = `gui-pane:${title}`;

    let pos = $state<{ x: number; y: number } | null>(null);
    let collapsed = $state(false);
    let paneEl: HTMLElement;

    onMount(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const p = JSON.parse(saved);
                pos = { x: p.x ?? 16, y: p.y ?? 16 };
                collapsed = p.collapsed ?? false;
            } catch {}
        }

        if (fadeZone) {
            window.addEventListener("resize", computeFade, { passive: true });
            computeFade();
            return () => window.removeEventListener("resize", computeFade);
        }
    });

    function save() {
        if (!pos) return;
        localStorage.setItem(storageKey, JSON.stringify({ ...pos, collapsed }));
    }

    function computeFade() {
        if (!fadeZone || !paneEl) return;
        const rect = paneEl.getBoundingClientRect();
        const distance = window.innerHeight - rect.top;
        const opacity = Math.min(1, Math.max(0, distance / fadeZone));
        paneEl.style.opacity = String(opacity);
        paneEl.style.pointerEvents = opacity < 0.05 ? "none" : "";
    }

    let dragging = false;
    let startClient = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
        dragging = true;
        startClient = { x: e.clientX, y: e.clientY };
        if (!pos) {
            const rect = paneEl.getBoundingClientRect();
            pos = { x: rect.left, y: rect.top };
        }
        startPos = { ...pos };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        const dx = e.clientX - startClient.x;
        const dy = e.clientY - startClient.y;
        const w = paneEl.offsetWidth;
        const h = paneEl.offsetHeight;
        pos = {
            x: Math.max(0, Math.min(window.innerWidth - w, startPos.x + dx)),
            y: Math.max(0, Math.min(window.innerHeight - h, startPos.y + dy)),
        };
        if (fadeZone) computeFade();
    }

    function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        save();
    }

    function toggleCollapse() {
        collapsed = !collapsed;
        save();
    }

    const panelStyle = $derived(
        pos ? `left: ${pos.x}px; top: ${pos.y}px` : "right: 16px; top: 16px",
    );
</script>

<div bind:this={paneEl} class="pane" style={panelStyle}>
    <div
        class="title-bar"
        role="button"
        tabindex="0"
        aria-label="Drag {title} panel"
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
    >
        <span class="title">{title}</span>
        <button
            class="chevron-btn"
            type="button"
            aria-label={collapsed ? "Expand" : "Collapse"}
            onclick={toggleCollapse}
            onpointerdown={(e) => e.stopPropagation()}
        >
            <svg
                class="chevron"
                class:open={!collapsed}
                viewBox="0 0 10 6"
                width="10"
                height="6"
                aria-hidden="true"
            >
                <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </button>
    </div>
    {#if !collapsed}
        <div class="body">
            {@render children?.()}
        </div>
    {/if}
</div>

<style>
    .pane {
        position: fixed;
        z-index: 100;
        width: 220px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: 0 2px 12px rgb(0 0 0 / 0.12);
        font-family: var(--font-serif);
        font-variation-settings:
            "opsz" var(--font-opsz-body),
            "WONK" 0,
            "SOFT" 0;
        user-select: none;
        touch-action: none;
    }

    .title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: grab;
        border-bottom: 1px solid var(--color-border);
    }

    .title-bar:active {
        cursor: grabbing;
    }

    .title {
        font-size: var(--text-sm);
        font-weight: 300;
        color: var(--color-text);
        letter-spacing: 0.02em;
        padding: var(--space-2) var(--space-3);
    }

    .chevron-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-text-muted);
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        transition: color var(--duration-fast) var(--ease-out);
        height: 2rem;
        width: 2rem;
    }

    .chevron-btn:hover {
        color: var(--color-text);
    }

    .chevron {
        transition: transform var(--duration-fast) var(--ease-out);
        transform: rotate(-90deg);
    }

    .chevron.open {
        transform: rotate(0deg);
    }

    .body {
        padding: var(--space-2) var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
</style>
