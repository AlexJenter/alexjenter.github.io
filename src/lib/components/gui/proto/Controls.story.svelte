<script lang="ts" module>
    export const title = "Prototype · Controls";
    export const order = 5;
</script>

<script lang="ts">
    import Checkbox from "../Checkbox.svelte";
    import CurrentSlider from "../Slider.svelte";
    import CurrentSelect from "../Select.svelte";
    import CurrentRadio from "../Radio.svelte";
    import CurrentColor from "../Color.svelte";
    import CurrentFileInput from "../FileInput.svelte";
    import CurrentButton from "../Button.svelte";
    import Toggle from "./Toggle.svelte";
    import Slider from "./Slider.svelte";
    import RangeSlider from "./RangeSlider.svelte";
    import Select from "./Select.svelte";
    import Radio from "./Radio.svelte";
    import Color from "./Color.svelte";
    import FileInput from "./FileInput.svelte";
    import Button from "./Button.svelte";

    // One state for both columns, so a change on either side shows on the other.
    let invert = $state(true);
    let mirror = $state(false);
    let amount = $state(40);
    let scale = $state(7.99);
    let span = $state<[number, number]>([20, 65]);
    let mode = $state("add");
    let channel = $state("r");
    let tint = $state("#d9822b");
    let image = $state<string | undefined>(undefined);
    let presses = $state(0);

    const modes = [
        { value: "add", label: "Add" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
    ];
    const channels = [
        { value: "r", label: "R" },
        { value: "g", label: "G" },
        { value: "b", label: "B" },
    ];
</script>

<div class="compare">
    <section>
        <h3>current</h3>
        <div class="frame">
            <Checkbox bind:value={invert} label="Invert" />
            <Checkbox bind:value={mirror} label="Mirror" />
            <CurrentSlider bind:value={amount} min={0} max={100} label="Amount" />
            <CurrentSlider
                bind:value={scale}
                min={0.1}
                max={42}
                step={0.01}
                label="Noise scale"
            />
            <CurrentSelect bind:value={mode} options={modes} label="Blend" />
            <CurrentRadio bind:value={channel} options={channels} label="Channel" />
            <CurrentColor bind:value={tint} label="Tint" />
            <CurrentFileInput bind:value={image} label="Source" />
            <CurrentButton label="Reset ({presses})" onclick={() => presses++} />
        </div>
    </section>

    <section>
        <h3>prototype</h3>
        <div class="frame">
            <Toggle bind:value={invert} label="Invert" />
            <Toggle bind:value={mirror} label="Mirror" />
            <Slider bind:value={amount} min={0} max={100} label="Amount" />
            <Slider
                bind:value={scale}
                min={0.1}
                max={42}
                step={0.01}
                label="Noise scale"
            />
            <RangeSlider bind:value={span} min={0} max={100} label="Window" />
            <Select bind:value={mode} options={modes} label="Blend" />
            <Radio bind:value={channel} options={channels} label="Channel" />
            <Color bind:value={tint} label="Tint" />
            <FileInput bind:value={image} label="Source" />
            <Button label="Reset ({presses})" onclick={() => presses++} />
        </div>
    </section>
</div>

<p class="note">
    invert: {invert} · mirror: {mirror} · amount: {amount} · scale: {scale.toFixed(2)}
    · window: {span[0]}–{span[1]} · blend: {mode} · channel: {channel} · tint: {tint}
</p>

<style lang="scss">
    @use "$lib/styles/mixins" as m;

    .compare {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-12);
        align-items: flex-start;
    }

    h3 {
        @include m.meta-label;
        font-weight: 400;
        color: var(--color-text-muted);
        margin: 0 0 var(--space-3);
    }

    /* a drawer column: the controls' real width, mono voice, same surface */
    .frame {
        width: 15rem;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: rgb(from var(--color-bg) r g b / 0.9);
        border: 1px solid var(--color-border);
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
    }

    .note {
        @include m.meta-label;
        color: var(--color-text-muted);
        margin: var(--space-6) 0 0;
    }
</style>
