#define HASHSCALE1 .1031

//----------------------------------------------------------------------------------------
//  1 out, 1 in...
float hash11(float p)
{
    vec3 p3  = fract(vec3(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

#pragma glslify: export(hash11)
