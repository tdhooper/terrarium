float hyperEasing(float x) {
    return x;
    return pow(x, 1.25);
}

const int NUM_WAVES = 9;

float hyperValue(mat4 waves, float x) {

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
