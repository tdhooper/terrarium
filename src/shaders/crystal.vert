#ifdef USE_FOG
    varying float fogDepth;
#endif

varying vec3 vPosition;
varying vec3 vNormal;
varying float vAngleOfIncidence;


void main() {

    vec3 modelPosition = (modelMatrix * vec4(position, 1)).xyz;
    vec3 cameraRay = normalize(cameraPosition - modelPosition);
    vec3 modelNormal = normalize((modelMatrix * vec4(normal, 1)).xyz);

    vAngleOfIncidence = acos(dot(cameraRay, modelNormal));

    vPosition = position;
    vNormal = normal;

    #ifdef USE_FOG
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        fogDepth = -mvPosition.z;
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}
