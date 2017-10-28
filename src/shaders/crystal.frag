varying vec3 vNormal;
varying float vAngleOfIncidence;


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


// --------------------------------------------------------
// Main
// --------------------------------------------------------

void main() {
    float d = dot(vec3(0,0,1), normalize(vNormal));
    vec3 color = spectrum(vAngleOfIncidence * .5);
    color = linearToScreen(color);
    gl_FragColor = vec4(color, 1);
}
