
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


vec4 map(float seed, float time, vec3 st) {

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

#pragma glslify: export(map)
