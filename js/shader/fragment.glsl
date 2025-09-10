uniform float time;
uniform float progress;
uniform float rotationSpeed;
uniform float scaleIntensity;
uniform float sphereSize;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
uniform vec2 mouse;
uniform vec3 sphereColor;
varying vec2 vUv;
varying vec4 vPosition;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}

float sphere(vec3 p) {
    return length(p) - sphereSize;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float SineCrazy(vec3 p) {
    return 1. - (sin(p.x) + sin(p.y) + sin(p.z)) / 1.5;
}

// Keep the original scene function unchanged
float scene(vec3 p) {
    float defaultRotation = time * 0.07;
    float totalRotation = defaultRotation + rotationSpeed * 1.4;
    
    vec3 p1 = rotate(p, vec3(1., 1., 0.), totalRotation);
    
    float scale = scaleIntensity + rotationSpeed * sin(time / 1.);
    return max(sphere(p1), (0.9 - SineCrazy(p1 * scale)) / scale);
}

vec3 getNormal(vec3 p) {
    vec2 o = vec2(0.001, 0.);
    
    return normalize(vec3(
        scene(p + o.xyy) - scene(p - o.xyy),
        scene(p + o.yxy) - scene(p - o.yxy),
        scene(p + o.yyx) - scene(p - o.yyx)
    ));
}

vec3 getColor(float amount) {
    vec3 col = 0.5 + 0.5 * cos(6.28319 * (vec3(0.2, 0.0, 0.0) + amount * sphereColor));
    return col * amount;
}

vec3 getColorAmount(vec3 p) {
    float amount = clamp((1.14 - length(p)) / 1., 0.1, 1.);
    vec3 col = 0.0 + 0.8 * cos(6.28319 * (vec3(0.1, 0.0, 0.0) + amount * sphereColor));
    return col * amount;
}

vec3 addOrbitalDots(vec2 screenPos, vec3 baseColor) {
    vec3 finalColor = baseColor;
    vec2 center = vec2(0.5);
    vec2 fromCenter = screenPos - center;
    
    for(int ring = 0; ring < 3; ring++) {
        float ringRadius = 0.3 + float(ring) * 0.08;
        float ringSpeed = 0.4 + float(ring) * 0.01;
        int numDots = 10 + ring * 3;
        
        for(int i = 0; i < 15; i++) {
            if(i >= numDots) break;
            
            float angle = float(i) * 6.28319 / float(numDots);
            float orbitTime = time * ringSpeed * 0.1;
            
            vec2 dotPos = center + vec2(
                cos(angle + orbitTime) * ringRadius,
                sin(angle + orbitTime) * ringRadius * 0.6  // Slightly elliptical
            );
            
            dotPos.x += mouse.x * 0.01;
            dotPos.y += mouse.y * 0.01;
            
            // Calculate distance from current pixel to dot
            float dist = distance(screenPos, dotPos);
            float dotSize = 0.0015 + sin(time * 0.05 + float(i)) * 0.001; // Twinkling
            
            // Create soft dot with falloff
            float dotIntensity = smoothstep(dotSize * 0.9, dotSize * 0.01, dist);
            
            if(dotIntensity > 0.0) {
                vec3 dotColor = 0.4 + 0.6 * cos(6.28319 * (vec3(0.1, 0.2, 0.0) + float(ring) * 0.1));

                float sparkle = sin(time * 4.0 + float(i) * 2.0) * 0.1 + 0.7;
                dotColor *= sparkle;

                finalColor += dotColor * dotIntensity * 0.8;
            }
        }
    }
    
    return finalColor;
}

void main() {
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);
    
    vec2 p = newUV - vec2(0.5);
    
    p.x += mouse.x * 0.015;
    p.y += mouse.y * 0.015;
    
    float bw = step(newUV.y, 0.5);
    
    vec3 camPos = vec3(0., 0., 2. + 0.0 * sin(time / 4.));
    vec3 ray = normalize(vec3(p, -1.));
    vec3 rayPos = camPos;
    
    float curDist = 0.;
    float rayLen = 0.;
    
    vec3 light = vec3(-1.0, 1., 1.);
    vec3 color = vec3(0.0);
    
    // Original raymarching loop - unchanged
    for(int i = 0; i <= 64; i++) {
        curDist = scene(rayPos);
        rayLen += 1. * curDist;
        
        rayPos = camPos + ray * rayLen;
        
        if(abs(curDist) < 0.001 || rayLen > 10.) {
            vec3 n = getNormal(rayPos);
            float diff = dot(n, light);
            break;
        }
        color += 0.045 * getColorAmount(rayPos);
    }
    
    // Add orbital dots as a post-effect
    color = addOrbitalDots(newUV, color);
    
    gl_FragColor = vec4(color, 1.);
    gl_FragColor.rg -= abs(mouse.x) * 0.08;
}