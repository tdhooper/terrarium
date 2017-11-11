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

#pragma glslify: export(spectrum)
