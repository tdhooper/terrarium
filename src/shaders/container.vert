varying float vAngleOfIncidence;


void main() {
    vec3 sourceNormal = color;

    vec3 modelPosition = (modelMatrix * vec4(position, 1)).xyz;
    vec3 cameraRay = normalize(cameraPosition - modelPosition);
    vec3 modelNormal = normalize((modelMatrix * vec4(sourceNormal, 1)).xyz);

    vAngleOfIncidence = dot(cameraRay, modelNormal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
