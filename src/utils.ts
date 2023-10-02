export function rads(degs: number) {
    return (degs / 180.0) * Math.PI;
}

export function degs(rads: number) {
    return (rads * 180) / Math.PI;
}

export function zeros(): number[] {
    return [0, 0, 0];
}
