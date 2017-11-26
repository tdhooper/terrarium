float hyperEasing(float x) {
    return x;
    return pow(x, 1.25);
}

const int NUM_WAVES = 9;

void calcWave(inout float value, float x, float offset) {
    float wavelengthStart = 3.;
    float wavelengthEnd = 3.;
    float wavePower = .75;

    if (offset > 0. && offset <= 1.) {
        offset = hyperEasing(offset);
        float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
        float waveX = x - offset + wavelength * (1. - offset);
        waveX = max(waveX / wavelength, 0.);
        waveX = waveX > 1. ? 0. : waveX;
        value += waveX * wavePower;
    }
}

float hyperValue(vec4 waves, float x) {

    float value = 0.;

    calcWave(value, x, waves.x);
    calcWave(value, x, waves.y);
    calcWave(value, x, waves.z);
    calcWave(value, x, waves.w);

    value = min(value, 1.);

    return value;
}

float waveShape(float x) {
    float blur = .2;
    x = x == 0. ? 1. : x;
    x = smoothstep(1., 1. - blur, x) - smoothstep(1. - blur, .0, x);
    return x;
}

void calcWaveSmooth(inout float value, float x, float offset) {
    float wavelengthStart = 3.;
    float wavelengthEnd = 3.;
    float wavePower = .75;

    if (offset > 0. && offset <= 1.) {
        offset = hyperEasing(offset);
        float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
        float waveX = x - offset + wavelength * (1. - offset);
        waveX = max(waveX / wavelength, 0.);
        waveX = waveX > 1. ? 0. : waveX;
        value += waveShape(waveX) * wavePower;
    }
}

// Blend the leading edge
float hyperValueSmooth(vec4 waves, float x) {

    x -= .5;

    float value = 0.;

    calcWaveSmooth(value, x, waves.x);
    calcWaveSmooth(value, x, waves.y);
    calcWaveSmooth(value, x, waves.z);
    calcWaveSmooth(value, x, waves.w);

    value = min(value, 1.);

    return value;
}
