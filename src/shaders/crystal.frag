varying vec3 vPosition;
varying vec3 vNormal;
varying float vAngleOfIncidence;
varying float vSeed;


// --------------------------------------------------------
// IQ
// https://www.shadertoy.com/view/ll2GD3
// --------------------------------------------------------

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 spectrum(float n) {
    return pal(
        n,
        vec3(0.5,0.5,0.5),
        vec3(0.5,0.5,0.5),
        vec3(1.0,1.0,1.0),
        vec3(0.0,0.33,0.67)
    );
}

// --------------------------------------------------------
// Gamma
// https://www.shadertoy.com/view/Xds3zN
// --------------------------------------------------------

const float GAMMA = 2.2;

vec3 gamma(vec3 color, float g) {
    return pow(color, vec3(g));
}

vec3 linearToScreen(vec3 linearRGB) {
    return gamma(linearRGB, 1.0 / GAMMA);
}






// Author: blackpolygon 
// Title: Turbulence
// Date: December 2016

// Based on the example from @patriciogv for Fractal Brownian Motion
// https://thebookofshaders.com/13/


#define PI 3.14159265359
#define TWO_PI 6.28318530718

float random (in vec2 _st) { 
    return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.54531237);
}

// https://www.shadertoy.com/view/4djSRW

#define HASHSCALE1 .1031

//----------------------------------------------------------------------------------------
//  1 out, 1 in...
float hash(float p)
{
    vec3 p3  = fract(vec3(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}


// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);

    vec3 i = floor(x);
    vec3 f = fract(x);
 
    // For performance, compute the base input to a 1D hash from the integer part of the argument and the 
    // incremental change to the 1D based on the 3D -> 1D wrapping
    float n = dot(i, step);

    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}

#define NUM_OCTAVES 5

float fbm ( in vec3 _st) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(20.0);
    // Rotate to reduce axial bias
    mat3 rot = mat3(cos(0.5), sin(0.5), 0,
                    -sin(0.5), cos(0.50), 0,
                    0, 0, 1
                );
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.2 + shift;
        a *= 0.5;
    }
    return v;
}



float pattern( vec3 st ) {
    // st *= 3.5;

    st.x += vSeed * 100.;
    
    vec3 color = vec3(0.);
    vec3 a, b, c;
    
    a.x = fbm( st);
    a.y = fbm( st + vec3(1.0));
    a.z = fbm( st + vec3(2.0));
    
    b.x = fbm( st + 4.*a);
    b.y = fbm( st);
    b.z = fbm( st + 10. * a);

    c.x = fbm( st + 7.0*b + vec3(10.7,.2,0)+ 0.215 );
    c.y = fbm( st + 3.944*b + vec3(.3,12.8,0)+ 0.16);
    c.z = fbm( st + 1.8*b + vec3(8.3,1.8,0)+ 0.16);

    float f = fbm(st+b+c);

    // f -= c.x;
    // f += c.y;

    f -= (c.x / b.y) * .25;
    f += (c.y / b.x) * .25;

    // f /= a.y * 1.55;

    float o = .2;
    float s = .3;
    float g = f;

    float gg = smoothstep(o, o + s, g) - smoothstep(o + s, o + s * 2., g);

    f = mix(f, c.x, gg);

    f = pow(c.x*2., 2.);

    return clamp(f, 0., 1.);
}




// --------------------------------------------------------
// Main
// --------------------------------------------------------

void main() {
    float d = dot(vec3(0,0,1), normalize(vNormal));
    float e = pattern(vPosition) * .5;
    // e = step(e, .5);
    // e = e * 2. - 1.;
    // e = 0.;
    float angle = vAngleOfIncidence + e;
    vec3 color = spectrum(angle * 1.);
    color = linearToScreen(color);
    // color = vec3(e);
    // color = mod(vPosition * 10., 1.);
    gl_FragColor = vec4(color, 1);
}
