// Threshold a photo against 4-channel blue noise -> one bit per pixel.
// Aspect-correct 'cover' fit; tone mapped onto the theme's ink/paper by
// luminance (so it reads naturally in either theme), Invert = negative.
//
// uResolution / uImageRes are supplied automatically by FullscreenShader.svelte.

precision highp float;

uniform vec2  uResolution;
uniform vec2  uImageRes;
uniform float uDitherScale;
uniform float uInvert;      // 0 or 1
uniform vec3  uInk;
uniform vec3  uPaper;
uniform sampler2D uImage;
uniform sampler2D uNoise;

float lum(vec3 c) { return 0.21 * c.r + 0.71 * c.g + 0.07 * c.b; }

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    float rs = uResolution.x / uResolution.y;
    float ri = uImageRes.x / uImageRes.y;
    vec2 cover = rs < ri
        ? vec2(uImageRes.x * uResolution.y / uImageRes.y, uResolution.y)
        : vec2(uResolution.x, uImageRes.y * uResolution.x / uImageRes.x);
    vec2 imgUv = uv * uResolution / cover + (cover - uResolution) * 0.5 / cover;
    vec3 image = texture2D(uImage, imgUv).rgb;

    // Tile the noise in *image* space (not output space) so the grain
    // is locked to the photo — identical in the live preview and the
    // full-resolution export, whatever the viewport size/aspect. Scale
    // x by the image aspect so the tiles stay square, and offset by the
    // image centre so the grain scales about the middle, not a corner.
    vec2 nuv = vec2(imgUv.x * uImageRes.x / uImageRes.y, imgUv.y);
    vec2 nc  = vec2(0.5 * uImageRes.x / uImageRes.y, 0.5);
    vec3 noise = texture2D(uNoise, (nuv - nc) * uDitherScale).rgb;

    float on = step(lum(noise), lum(image)); // 1 where image beats threshold

    vec3 lighter = lum(uPaper) >= lum(uInk) ? uPaper : uInk;
    vec3 darker  = lum(uPaper) >= lum(uInk) ? uInk : uPaper;
    vec3 bright = mix(lighter, darker, uInvert);
    vec3 dark   = mix(darker, lighter, uInvert);
    gl_FragColor = vec4(mix(dark, bright, on), 1.0);
}
