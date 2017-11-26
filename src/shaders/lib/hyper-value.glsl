float hyperEasing(float x) {
    return x;
    return pow(x, 1.25);
}

const int NUM_WAVES = 9;

float hyperValue(mat3 waves, float x) {

    float wavelengthStart = 3.;
    float wavelengthEnd = 3.;
    float wavePower = .75;

    float value = 0.;

    for (int w = 0; w < NUM_WAVES; w++) {
        float offset = matrixLookup(waves, w);
        if (offset > 0. && offset <= 1.) {
            offset = hyperEasing(offset);
            float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
            float waveX = x - offset + wavelength * (1. - offset);
            waveX = max(waveX / wavelength, 0.);
            waveX = waveX > 1. ? 0. : waveX;
            value += waveX * wavePower;
        }
    }
    value = min(value, 1.);

    return value;
}

float waveShape(float x) {
    float blur = .2;
    x = x == 0. ? 1. : x;
    x = smoothstep(1., 1. - blur, x) - smoothstep(1. - blur, .0, x);
    return x;
}

// Blend the leading edge
float hyperValueSmooth(mat3 waves, float x) {

    x -= .5;

    float wavelengthStart = 3.;
    float wavelengthEnd = 3.;
    float wavePower = .75;

    float value = 0.;

    for (int w = 0; w < NUM_WAVES; w++) {
        float offset = matrixLookup(waves, w);
        if (offset > 0. && offset <= 1.) {
            offset = hyperEasing(offset);
            float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
            float waveX = x - offset + wavelength * (1. - offset);
            waveX = max(waveX / wavelength, 0.);
            waveX = waveX > 1. ? 0. : waveX;
            value += waveShape(waveX) * wavePower;
        }
    }
    value = min(value, 1.);

    return value;
}
