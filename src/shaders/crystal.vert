varying vec3 vNormal;
varying float vAngleOfIncidence;

void main() {

    vec3 modelPosition = (modelMatrix * vec4(position, 1)).xyz;
    vec3 cameraRay = normalize(cameraPosition - modelPosition);
    vec3 modelNormal = normalize((modelMatrix * vec4(normal, 1)).xyz);

    vAngleOfIncidence = acos(dot(cameraRay, modelNormal));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
