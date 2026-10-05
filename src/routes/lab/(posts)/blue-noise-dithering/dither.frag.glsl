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

float lum(vec3 c) { return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

void main() {
    vec2 outputUv = gl_FragCoord.xy / uResolution;

    float outputAspect = uResolution.x / uResolution.y;
    float imageAspect  = uImageRes.x / uImageRes.y;

    // 'cover' fit: the image scaled (in output px) to fill the output,
    // cropping whichever axis overflows.
    vec2 coverSize = outputAspect < imageAspect
        ? vec2(uImageRes.x * uResolution.y / uImageRes.y, uResolution.y)
        : vec2(uResolution.x, uImageRes.y * uResolution.x / uImageRes.x);
    vec2 imageUv = outputUv * uResolution / coverSize
                 + (coverSize - uResolution) * 0.5 / coverSize;
    vec4 image = texture2D(uImage, imageUv);

    // Tile the noise in *image* space (not output space) so the grain
    // is locked to the photo — identical in the live preview and the
    // full-resolution export, whatever the viewport size/aspect. Scale
    // x by the image aspect so the tiles stay square, and offset by the
    // image centre so the grain scales about the middle, not a corner.
    vec2 noiseUv     = vec2(imageUv.x * imageAspect, imageUv.y);
    vec2 noiseCenter = vec2(0.5 * imageAspect, 0.5);

    vec4  noise = texture2D(uNoise, (noiseUv - noiseCenter) * uDitherScale);
    float imageIsBrighter = step(noise.r, lum(image.rgb));
    // Cut-outs: alpha is dithered too (against another noise channel), so
    // transparent pixels show plain paper and soft edges stay one bit.
    float covered = step(noise.g, image.a);

    vec3 lighter = lum(uPaper) >= lum(uInk) ? uPaper : uInk;
    vec3 darker  = lum(uPaper) >= lum(uInk) ? uInk : uPaper;
    vec3 bright = mix(lighter, darker, uInvert);
    vec3 dark   = mix(darker, lighter, uInvert);
    gl_FragColor = vec4(mix(uPaper, mix(dark, bright, imageIsBrighter), covered), 1.0);
}
