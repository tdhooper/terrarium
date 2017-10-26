varying vec2 vUv;

uniform float t1;
uniform float t2;

void main() {
    float fill1 = step(1.- vUv.y, t1);
    float fill2 = step(vUv.y, t2);
    vec3 colorA = vec3(0, .8, 1);
    vec3 colorB = vec3(0, 1, .2);
    vec3 colorC = vec3(1, 0, 1);
    vec3 color = mix(colorA, colorB, fill1);
    color = mix(color, colorC, fill2);
    gl_FragColor = vec4(color, 1);
}
