#define PI 3.14159265359

// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
    float angle = 2.*PI/repetitions;
    float a = atan(p.y, p.x) + angle/2.;
    float r = length(p);
    float c = floor(a/angle);
    a = mod(a,angle) - angle/2.;
    p = vec2(cos(a), sin(a))*r;
    // For an odd number of repetitions, fix cell index of the cell in -x direction
    // (cell index would be e.g. -5 and 5 in the two halves of the cell):
    if (abs(c) >= (repetitions/2.)) c = abs(c);
    return c;
}

// Repeat space along one axis. Use like this to repeat along the x axis:
// <float cell = pMod1(p.x,5);> - using the return value is optional.
float pMod1(inout float p, float size) {
    float halfsize = size*0.5;
    float c = floor((p + halfsize)/size);
    p = mod(p + halfsize, size) - halfsize;
    return c;
}

// Repeat in two dimensions
vec2 pMod2(inout vec2 p, vec2 size) {
    vec2 c = floor((p + size*0.5)/size);
    p = mod(p + size*0.5,size) - size*0.5;
    return c;
}

// Rotate around a coordinate axis (i.e. in a plane perpendicular to that axis) by angle <a>.
// Read like this: R(p.xz, a) rotates "x towards z".
// This is fast if <a> is a compile-time constant and slower (but still practical) if not.
void pR(inout vec2 p, float a) {
    p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

vec4 coords(vec3 pos, vec3 cam) {
    pos = normalize(pos);
    cam = normalize(cam);
    float radius = acos(dot(pos, -cam)) / PI * 4.;

    vec3 up = normalize(cross(-cam, vec3(0,1,0)));
    vec3 left = cross(cam, up);
    vec3 dir = normalize(cross(cam, cross(pos, cam)));
    float angle = acos(dot(dir, up)) * sign(dot(dir, left));

    vec2 polar = vec2(
        radius,
        angle
    );

    vec2 cartesian = vec2(
        radius * cos(angle),
        radius * sin(angle)
    );

    return vec4(cartesian, polar);
}

vec4 bgPattern(vec3 pos, vec3 cam) {

    vec4 c = coords(pos, cam);
    vec2 p = c.xy;
    vec2 r = c.zw;

    float crop = .25;
    float hp = max(0., (calcHyperPowerRadial() - crop) * (1./(1.-crop)));
    // float hp = calcHyperPowerRadial();

    // 0 -> 0
    // 1 -> 0
    // .9 -> 1
    // .8 -> 0

    // float ss = .1;

    // hp = hp == 0. ? 1. : hp;
    // hp = smoothstep(1., 1. - ss, hp) - smoothstep(1. - ss, .5, hp);

    // hp = (hp - .9) * 10.;

    // vec3 ee = spectrum(hp);
    // ee = hp <= 0. || hp >= 1. ? vec3(0.) : ee;
    // return vec4(vec3(hp), 1);

    r.x = pow(r.x * 5., 1./2.);

    // r.x += mix(-.5, 0., hp);

    r *= 1.5;

    r.x -= time * .0001;

    pR(r, PI / 4.);

    float rep = 11.;
    pMod2(r, vec2(2.2222 / rep));

    float d = 1e12;
    float part;

    float o = c.w * 2.;
    o = 0.5;
    float w = (sin(c.z * 12. + time * .001 - o) * .5 + .5) * .05;
    float ww = (sin(c.z * 12. + time * .001 - o) * .5 + .3) * .05;
    float w3 = (sin(c.z * 12. + time * .001 - o) * .5 + .8) * .08;

    float partA = abs(dot(r, vec2(1,0)));
    float partB = abs(dot(r, vec2(0,1)));
    d = min(partA, partB);

    // w *= 1. - c.z * .5;
    // ww *= 1. - c.z * .5;

    float po = sin(time * .005) * .5 + .5;
    po = hp;

    float pat = smoothstep(0., .005, d - w - .1 * (1. - po));
    float pat2 = smoothstep(0., .005 * po, d - ww * po);
    float pat3 = smoothstep(0., .005, d - w3 - .075 * (1. - po));

    float fill = mix(0., mix(1., .5, hp), pat2);
    fill = mix(fill, .2, pat);
    fill = mix(fill, .0, pat3);

    // fill = 1.-pat3;

    // fill = pat;
    // return vec4(vec3(fill), 1.);

    float alpha = 1. - fill;
    alpha = alpha * hp;
    vec3 color = mix(vec3(.3,.19,.5) * 2., vec3(.3,.19,.5) * .1, clamp(hp * 1.5 - .5, 0., 1.));

    return vec4(color, alpha);
}
