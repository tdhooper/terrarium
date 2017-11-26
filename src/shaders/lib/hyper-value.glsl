float hyperEasing(float x) {
    return x;
    return pow(x, 1.25);
}

const int NUM_WAVES = 9;

float hyperValue(vec2 wave, float x) {
    
    float backWl = 3.;

    float front = wave[0] * (1. + backWl);
    float back = wave[1];

    float a = 1. - (x - front) / 0.;
    float b = 1. - (x - back + backWl * (1. - back)) / backWl;
    float y = clamp(min(a, 1. - b) * .75, 0., 1.);

    return y;

    // float wavelengthStart = 3.;
    // float wavelengthEnd = 3.;
    // float wavePower = .75;

    // float value = 0.;

    // for (int w = 0; w < NUM_WAVES; w++) {
    //     float offset = matrixLookup(waves, w);
    //     if (offset > 0. && offset <= 1.) {
    //         offset = hyperEasing(offset);
    //         float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
    //         float waveX = x - offset + wavelength * (1. - offset);
    //         waveX = max(waveX / wavelength, 0.);
    //         waveX = waveX > 1. ? 0. : waveX;
    //         value += waveX * wavePower;
    //     }
    // }
    // value = min(value, 1.);

    // return value;
}

float waveShape(float x) {
    float blur = .2;
    x = x == 0. ? 1. : x;
    x = smoothstep(1., 1. - blur, x) - smoothstep(1. - blur, .0, x);
    return x;
}

// Blend the leading edge
float hyperValueSmooth(vec2 wave, float x) {
    // return 0.;
    x -= .5;

    
    float backWl = 3.;

    float front = wave[0] * (1. + backWl);
    float back = wave[1];

    float a = 1. - (x - front) / 0.;
    float b = 1. - (x - back + backWl * (1. - back)) / backWl;
    float y = clamp(min(a, 1. - b) * .75, 0., 1.);

    return y;

    // float frontWl = 0.;
    // float backWl = 3.;

    // // Front and back edge offsets
    // float front = wave[0] * (1. + backWl);
    // float back = wave[1];

    // // front = pow(front, 1.5);
    // // back = pow(back, .5);


    // float a = 1. - (x - front + frontWl * (1. - front)) / frontWl;
    // float b = 1. - (x - back + backWl * (1. - back)) / backWl;
    // float y = clamp(waveShape(min(a, 1. - b)) * .66, 0., 1.);

    // y = smoothstep(0., 1., y);

    // return y;

    // Front and back edge offsets
    // float front = wave[0];
    // float back = wave[1];

    // // Wavelengths
    // float frontWl = 3.;
    // float backWl = 3.;

    // float a = 1. - (x - front + frontWl * (1. - front)) / frontWl;
    // float b = 1. - (x - back + backWl * (1. - back)) / backWl;
    // float y = clamp(min(a, 1. - b), 0., 1.);

    // y = smoothstep(0., 1., y);

    // return y;

    // float m = 1. / (front - back);
    // float b = 0. - (m * back);
    // float y = m * x + b;

    // y = waveShape(y);

    // return y;
    // x -= .5;

    // float wavelengthStart = 3.;
    // float wavelengthEnd = 3.;
    // float wavePower = .75;

    // float value = 0.;

    // for (int w = 0; w < NUM_WAVES; w++) {
    //     float offset = matrixLookup(waves, w);
    //     if (w == 0) {
    //         if (offset > 0. && offset <= 1.) {
    //             offset = hyperEasing(offset);
    //             float wavelength = mix(wavelengthStart, wavelengthEnd, offset);
    //             float waveX = x - offset + wavelength * (1. - offset);
    //             waveX = max(waveX / wavelength, 0.);
    //             waveX = waveX > 1. ? 0. : waveX;
    //             value = waveShape(waveX) * wavePower;
    //         }
    //     } else if (value != 0.) {
    //         value += (sin(offset * PI * 2. - PI * .5) * .5 + .5) * wavePower;
    //     }
    // }
    // value = min(value, 1.);

    // return value;
}
