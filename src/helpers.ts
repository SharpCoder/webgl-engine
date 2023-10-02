export function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
) {
    const shader = gl.createShader(type);
    if (shader) {
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    } else {
        console.error('WebGL may not be supported by this browser');
    }
}

export function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: string,
    fragmentShader: string
): WebGLProgram | null {
    const program = gl.createProgram();
    const compiledVertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShader
    );
    const compiledFragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShader
    );

    if (program && compiledVertexShader && compiledFragmentShader) {
        gl.attachShader(program, compiledVertexShader);
        gl.attachShader(program, compiledFragmentShader);
        gl.linkProgram(program);

        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    } else {
        console.error('WebGL may not be supported by this browser');
    }

    return null;
}

export function r(num: number) {
    return Math.round(num * 100) / 100;
}
