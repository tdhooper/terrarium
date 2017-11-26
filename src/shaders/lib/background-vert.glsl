vec2 coords(vec3 pos, vec3 cam) {
    pos = normalize(pos);
    cam = normalize(cam);
    float radius = acos(dot(pos, -cam)) / PI * 4.;

    vec3 up = normalize(cross(-cam, vec3(0,1,0)));
    vec3 left = cross(cam, up);
    vec3 dir = normalize(cross(cam, cross(pos, cam)));
    float angle = acos(dot(dir, up)) * sign(dot(dir, left));

    vec2 polar = vec2(
        radius,
        angle
    );

    vec2 cartesian = vec2(
        radius * cos(angle),
        radius * sin(angle)
    );

    return cartesian;
}