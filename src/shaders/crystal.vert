varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {

    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;

    vPosition = position;

    gl_Position = projectionMatrix * mvPosition;
}
