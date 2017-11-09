varying float vAngleOfIncidence;

uniform vec3 frontColor;
uniform vec3 backColor;


void main() {

    vec3 color = mix(frontColor, backColor, smoothstep(.0, -.5, vAngleOfIncidence));
    gl_FragColor = vec4(color, 1);
}
