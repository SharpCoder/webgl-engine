export const default3DVertexShader = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texcoord;

    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera;

    varying vec4 v_color;
    varying vec2 v_texcoord;

    void main() {
        gl_Position = u_projection * u_camera * u_worldView * a_position;

        v_color = a_color;
        v_texcoord = a_texcoord;
    }
`;

export const default3DFragmentShader = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_texcoord;

    // The texture
    uniform sampler2D u_texture;
    uniform bool u_showtex;
    
    void main() {
        if (u_showtex) {
            gl_FragColor = texture2D(u_texture, v_texcoord);
        } else {
            gl_FragColor = v_color;
        }
    }
`;

export const fogVertexShader = `
    attribute vec4 a_position;

    uniform mat4 u_worldView;
    uniform mat4 u_projection;
    uniform mat4 u_camera;

    varying vec3 v_position;

    void main() {
        gl_Position = u_projection * u_camera * u_worldView * a_position;
        v_position = (u_camera * u_worldView * a_position).xyz;
    }
`;

export const fogFragmentShader = `
    #define LOG2 1.442695
    
    precision mediump float;
    
    varying vec3 v_position;

    // Fog
    uniform vec4 u_fogColor;
    uniform float u_fogDensity;

    void main() {
        float fogDistance = length(v_position) / 100.0;
        float fogAmount = 1.0 - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
        fogAmount = clamp(fogAmount, 0.2, 1.0);
        gl_FragColor = mix(vec4(0, 0, 0, 0), u_fogColor, fogAmount);
    }
`;

export const defaultSkyboxVertexShader = `
    attribute vec4 a_position;
    varying vec4 v_position;

    void main() {
        v_position = a_position;
        gl_Position = a_position;
        gl_Position.z = 1.0;
    }
`;

export const defaultSkyboxFragmentShader = `
    #define LOG2 1.442695

    precision mediump float;
    
    uniform samplerCube u_skybox;
    uniform mat4 u_camera;
    
    varying vec4 v_position;
    uniform vec4 u_fogColor;
    uniform float u_fogDensity;

    void main() {
        vec4 t = u_camera * v_position;
        
        float fogDistance = (t.y-.90 ) * 50.0;
        float fogAmount = 1.0 - exp2(-u_fogDensity * u_fogDensity * fogDistance * fogDistance * LOG2);
        fogAmount = clamp(fogAmount, 0.0, 1.0);


        gl_FragColor = mix(
            textureCube(u_skybox, normalize(t.xyz / t.w)),
            u_fogColor,
            fogAmount
        );
    }
`;
