uniform float seed;
uniform float time;
uniform float bottomClip;
uniform float height;
uniform float scale;

varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;


const float LOG2 = 1.442695;

#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )

#pragma glslify: spectrum = require(./lib/spectrum.glsl)
#pragma glslify: linearToScreen = require(./lib/gamma.glsl)


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

#define NUM_OCTAVES 2

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

#define NUM_OCTAVES2 5

float fbm2 ( in vec3 _st) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(20.0);
    // Rotate to reduce axial bias
    mat3 rot = mat3(cos(0.5), sin(0.5), 0,
                    -sin(0.5), cos(0.50), 0,
                    0, 0, 1
                );
    for (int i = 0; i < NUM_OCTAVES2; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.2 + shift;
        a *= 0.5;
    }
    return v;
}


vec4 map( vec3 st ) {

    st.x += seed * 100.;
    
    vec3 color = vec3(0.);
    vec3 a, b, c;
    
    a.x = fbm( st);
    a.y = fbm( st + vec3(1.0));
    a.z = fbm( st + vec3(2.0));

    b.x = fbm( st + 4. * a + time * .05);
    b.y = fbm( st + time * .2);
    b.z = fbm( st + 10. * a + time * .1);

    return vec4(normalize(b * 2. - 1.), fbm2(b) * 2. - 1.);
}


// --------------------------------------------------------
// Main
// --------------------------------------------------------

void main() {

    vec3 positon = vPosition;
    positon *= scale;
    positon.z += height * .5;

    vec4 m = map(positon);
    float e = m.w;

    vec3 normal = vNormal;
    float angleOfIncidence = acos(dot(normalize(normal + m.xyz * .25), normalize(vViewPosition)));

    angleOfIncidence = 1.75 - angleOfIncidence * .5;

    angleOfIncidence += e * 1.5;

    vec3 color = spectrum(angleOfIncidence);

    color = linearToScreen(color);

    if (vPosition.z < bottomClip) {
        discard;
    }

    gl_FragColor = vec4(color, 1);
}
