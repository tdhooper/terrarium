varying float edge;

void main() {
    vec3 color = vec3(1,0,0);
    float aa = smoothstep(0., 1., 1. - abs(edge));
    gl_FragColor = vec4(color, aa);
}
