attribute float seed;

varying vec3 vPosition;
varying vec3 vNormal;
varying float vAngleOfIncidence;
varying float vSeed;


void main() {

    vSeed = seed;
    
    vec3 modelPosition = (modelMatrix * vec4(position, 1)).xyz;
    vec3 cameraRay = normalize(cameraPosition - modelPosition);
    vec3 modelNormal = normalize((modelMatrix * vec4(normal, 1)).xyz);

    vAngleOfIncidence = acos(dot(cameraRay, modelNormal));

    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
