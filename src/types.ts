
export class KeyValuePair<T> {

    
    public readonly key : string;
    public value : T;


    constructor(key : string, value : T) {

        this.key = key;
        this.value = value;
    }
}


export type Bitmap = HTMLImageElement | HTMLCanvasElement;


export class ExistingObject {


    protected exist : boolean;


    constructor(exist = false) { this.exist = exist; }


    public doesExist = () : boolean => this.exist;
}


export function nextObject<T extends ExistingObject> (arr : Array<T>, type : Function) {

    let o : T;

    o = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            o = a;
            break;
        }
    }

    if (o == null) {

        o = new type.prototype.constructor();
        arr.push(o);
    }

    return o;
}
