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

float hyperValue(mat3 waves, float x) {

    float value = 0.;

    calcWave(value, x, waves[2][2]);
    calcWave(value, x, waves[1][2]);
    calcWave(value, x, waves[0][2]);
    calcWave(value, x, waves[2][1]);
    calcWave(value, x, waves[1][1]);
    calcWave(value, x, waves[0][1]);
    calcWave(value, x, waves[2][0]);
    calcWave(value, x, waves[1][0]);
    calcWave(value, x, waves[0][0]);

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
float hyperValueSmooth(mat3 waves, float x) {

    x -= .5;

    float value = 0.;

    calcWaveSmooth(value, x, waves[2][2]);
    calcWaveSmooth(value, x, waves[1][2]);
    calcWaveSmooth(value, x, waves[0][2]);
    calcWaveSmooth(value, x, waves[2][1]);
    calcWaveSmooth(value, x, waves[1][1]);
    calcWaveSmooth(value, x, waves[0][1]);
    calcWaveSmooth(value, x, waves[2][0]);
    calcWaveSmooth(value, x, waves[1][0]);
    calcWaveSmooth(value, x, waves[0][0]);

    value = min(value, 1.);

    return value;
}
