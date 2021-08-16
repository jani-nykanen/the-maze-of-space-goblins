import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { ExistingObject } from "./types.js";
import { Vector2 } from "./vector.js";


export class Dust extends ExistingObject {

    
    private pos : Vector2;
    private timer : number;
    private maxTime : number;
    private radius : number;


    constructor() {

        super();

        this.pos = new Vector2();
        this.timer = 0;
        this.maxTime = 1;
        this.radius = 0;

        this.exist = false;
    }


    public spawn(x : number, y : number, time : number, radius : number) {

        this.pos = new Vector2(x, y);
        this.maxTime = time;
        this.timer = 0;
        this.radius = radius;

        this.exist = true;
    }


    public update(event : CoreEvent) {

        if (!this.exist) return;

        if ((this.timer += event.step) >= this.maxTime) {

            this.exist = false;
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        let t = 1.0 - this.timer / this.maxTime;

        let r = Math.round(this.radius * t);

        canvas.setFillColor(255, 255, 255);
        canvas.fillCircle(r, this.pos.x, this.pos.y);
    }


    public kill() {

        this.exist = false;
    }
}
