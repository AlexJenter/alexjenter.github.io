// Sphere-traced scene: a rounded box and a sphere, smooth-unioned, on a floor.
// Soft shadow + ambient occlusion, shaded onto the theme's ink/paper by
// luminance (so it reads in either theme). Debug = heat map of march steps.
//
// uResolution / uTime are supplied automatically by FullscreenShader.svelte.

precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uYaw;
uniform float uPitch;
uniform float uBlend; // smooth-union radius
uniform float uRound; // bar edge radius, 0..0.05
uniform float uOutline; // outline width in pixels, 0 = off
uniform float uGrain; // grain strength, 0 = off
uniform float uDarkness; // exponent on the light value: higher = darker
uniform float uGrainSize; // grain size on screen, in pixels
uniform float uSteps; // march step budget (<= MAX_STEPS)
uniform float uDebug; // 0 or 1: show steps taken instead of shading
uniform vec3 uInk;
uniform vec3 uPaper;

const int MAX_STEPS = 128;
const float MAX_DIST = 30.0;
const float FOG = 0.1; // exponential fog density: exp(-FOG * distance)
const float OUTLINE_GAP = 0.02; // a near miss must be this much nearer than the hit

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// Polynomial smooth minimum (iq).
float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

// The whole scene is this one function: distance to the nearest surface.
// Exact distance to an infinite bar with a square cross-section (half-width 0.05).
// Edges rounded by r (<= 0.05): shrink by r, subtract r; the outline is unchanged.
float bar(vec2 q, float r) {
    vec2 d = abs(q) - (0.04 - r);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

float map(vec3 p) {
    vec3 p1 = mod(p + 1.0, 2.0) - 1.0; // repeat every 2, cell centred on the origin
    float r = clamp(uBlend, 0.0, 0.05);
    float d = smin(bar(p1.yz, r), bar(p1.xz, r), uBlend);
    d = smin(d, bar(p1.xy, r), uBlend);
    d = smin(d, sdRoundBox(p1, vec3(0.15), uBlend), uBlend);
    return d;
}

// Gradient of the field = surface normal (central differences).
vec3 normalAt(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
        ));
}

// Soft shadow (iq): march toward the light, darken by how closely we graze a
// surface. The previous distance lets us estimate the closest approach
// *between* samples, which removes the banding of the plain min(k*h/t).
float shadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.02;
    float ph = 1e10; // previous h
    for (int i = 0; i < 64; i++) {
        float h = map(ro + rd * t);
        float y = h * h / (2.0 * ph);
        float d = sqrt(max(h * h - y * y, 0.0));
        res = min(res, 10.0 * d / max(t - y, 0.001));
        ph = h;
        t += clamp(h, 0.005, 0.4);
        if (res < 0.001 || t > 8.0) break;
    }
    return clamp(res, 0.0, 1.0);
}

// Ambient occlusion: how much of the nearby space is filled.
float occlusion(vec3 p, vec3 n) {
    float occ = 0.0;
    float w = 1.0;
    for (int i = 1; i <= 5; i++) {
        float h = 0.03 + 0.12 * float(i);
        occ += (h - map(p + n * h)) * w;
        w *= 0.7;
    }
    return clamp(1.0 - 2.0 * occ, 0.0, 1.0);
}

// Hash-based 3D value noise (0..1), tied to the world position.
float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
            mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
            mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
        f.z);
}

// Three octaves of noise, about -0.5..0.5, with a constant grain size ON
// SCREEN: the noise stays on the surface, but its frequency follows the
// distance, so a grain is about uGrainSize pixels at any depth (like marks
// made with one pencil). The level k = log2(cycles per unit) is a real
// number. Each octave mixes the noise at floor(k) with the noise at floor(k)+1,
// the way a mipmap mixes two levels. The weights a and b keep the variance
// (a*a + b*b = 1), so the contrast does not change while you move.
float grain(vec3 p, float t) {
    float footprint = max(t, 0.01) / (1.8 * uResolution.y); // world size of one pixel
    float k = -log2(max(uGrainSize, 0.1) * footprint); // grain wavelength = uGrainSize px
    float lo = floor(k);
    float m = k - lo;
    float a = sqrt(1.0 - m);
    float b = sqrt(m);
    // Octave i is the noise at levels lo + i and lo + i + 1: 4 samples in all.
    float n0 = vnoise(p * exp2(lo)) - 0.5;
    float n1 = vnoise(p * exp2(lo + 1.0)) - 0.5;
    float n2 = vnoise(p * exp2(lo + 2.0)) - 0.5;
    float n3 = vnoise(p * exp2(lo + 3.0)) - 0.5;
    float sum = 0.5 * (a * n0 + b * n1) + 0.3 * (a * n1 + b * n2) + 0.18 * (a * n2 + b * n3);
    return sum / 0.78; // 0.5 + 0.3 + 0.18: keeps the total weight about 1
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

    // Orbit camera around the scene centre.
    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 ro = target + 5.0 * vec3(
                    cos(uPitch) * sin(uYaw),
                    sin(uPitch),
                    cos(uPitch) * cos(uYaw)
                );
    vec3 fw = normalize(target - ro);
    vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(rt, fw);
    float fl = 3.2;
    vec3 rd = normalize(uv.x * rt + uv.y * up + fl * fw);

    // Sphere tracing: the field value is a step that can't overshoot.
    // The same loop finds near misses for the outline. d / t is the angle
    // between the ray and the nearest surface, so one pixel is a fixed value of
    // it at any distance. A near miss is a local minimum of d: the distance
    // grows again after it. A ray that ends on a surface never grows again at
    // the end, so the final approach does not count.
    float t = 0.0;
    float ph = 1e10; // previous d
    float missAngle = 1e10; // smallest near-miss angle so far
    float missT = 0.0; // ray distance of that near miss
    int steps = 0;
    bool hit = false;
    for (int i = 0; i < MAX_STEPS; i++) {
        if (float(i) >= uSteps) break;
        float d = map(ro + rd * t);
        steps = i + 1;
        if (d < 0.0008 * t) {
            hit = true;
            break;
        }
        if (d > ph && d <= 2.0 * ph) {
            // Closest approach between the last two samples (iq's estimate):
            // where the two distance spheres meet, as in the soft shadow.
            float y = d * d / (2.0 * ph);
            float z = sqrt(max(d * d - y * y, 0.0));
            float tc = t - y;
            float angle = z / max(tc, 0.001);
            if (angle < missAngle) {
                missAngle = angle;
                missT = tc;
            }
        }
        ph = d;
        t += d;
        if (t > MAX_DIST) break;
    }

    vec3 lighter = dot(uPaper, vec3(0.2126, 0.7152, 0.0722)) >=
            dot(uInk, vec3(0.2126, 0.7152, 0.0722)) ? uPaper : uInk;
    vec3 darker = lighter == uPaper ? uInk : uPaper;

    if (uDebug > 0.5) {
        // Most rays finish in well under 32 steps; scale so that's the full ramp.
        gl_FragColor = vec4(mix(uPaper, uInk, clamp(float(steps) / 32.0, 0.0, 1.0)), 1.0);
        return;
    }

    vec3 col = uInk; // background: same as the fog
    if (hit) {
        vec3 p = ro + rd * t;
        vec3 n = normalAt(p);
        vec3 l = normalize(vec3(sin(uTime * 0.4) * 2.0, 3.0, 2.0));
        // Shadows are off for now: shadow() is kept, but the lattice never lets light in.
        float diff = clamp(dot(n, l), 0.0, 1.0);
        float sky = 0.5 + 0.5 * n.y;
        float lit = 0.1 + 0.2 * sky * occlusion(p, n) + 0.7 * diff;
        lit = pow(clamp(lit, 0.0, 1.0), uDarkness);
        lit *= 1.0 + uGrain * grain(p, t) * 2.0; // grain as albedo: dark faces show less
        col = mix(darker, lighter, clamp(lit, 0.0, 1.0));
        col = mix(uInk, col, exp(-FOG * t)); // fog into the ink: black in light mode, white in dark
    }

    // Outline: a near miss inside the width, and a ray that ended (hit or
    // escaped), with the near miss clearly in front of where the ray ended.
    // Smoothstep edges give about one pixel of anti-aliasing: the line is
    // full inside uOutline - 0.5 px and gone at uOutline + 0.5 px.
    bool ended = hit || t > MAX_DIST;
    if (ended && uOutline > 0.0) {
        float px = 1.0 / (1.8 * uResolution.y); // angle of one pixel
        float a = missAngle / px; // near miss, in pixels
        float cover = 1.0 - smoothstep(max(uOutline - 0.5, 0.0), uOutline + 0.5, a);
        cover *= min(uOutline, 1.0); // fade in below 1 px
        cover *= smoothstep(0.5 * OUTLINE_GAP, OUTLINE_GAP, t - missT);
        col = mix(col, uInk, cover);
    }
    gl_FragColor = vec4(col, 1.0);
}
