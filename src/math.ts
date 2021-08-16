

export const negMod = (m : number, n : number) : number => {

    m |= 0;
    n |= 0;

    return ((m % n) + n) % n;
}


export const clamp = (x : number, min : number, max : number) : number => {

    return Math.max(min, Math.min(x, max));
}
