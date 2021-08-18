import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Vector2 } from "./vector.js";


export const enum TransitionEffectType {

    None = 0,
    Fade = 1,
    CirleIn = 2,
    BoxVertical = 3,
    BoxHorizontal = 4,
}


export class TransitionEffectManager {


    private timer : number;
    private fadeIn : boolean;
    private effectType : TransitionEffectType;
    private color : [number, number, number];
    private active : boolean;
    private center : Vector2;
    private speed : number;
    private param : number;
    
    private callback : ((event : CoreEvent) => void);


    constructor() {

        this.timer = 0;
        this.fadeIn = false;
        this.effectType = TransitionEffectType.None;
        this.color = [0, 0, 0];
        this.active = false;
        this.center = new Vector2(80, 72);
        this.speed = 1;
        this.param = null;

        this.callback = event => {};
    }


    public activate(fadeIn : boolean, type : TransitionEffectType, speed : number, 
        callback : (event : CoreEvent) => any, 
        color = <[number, number, number]> [0, 0, 0], specialParam = 0) : TransitionEffectManager {

        this.fadeIn = fadeIn;
        this.speed = speed;
        this.timer = 1.0;
        this.callback = callback;
        this.effectType = type;
        this.color = color;

        this.param = specialParam;

        this.active = true;

        return this;
    }


    public setCenter(pos : Vector2) : TransitionEffectManager {

        this.center = pos.clone();
        return this;
    }


    public update(event : CoreEvent) {

        if (!this.active) return;

        if ((this.timer -= this.speed * event.step) <= 0) {

            this.fadeIn = !this.fadeIn;
            if (!this.fadeIn) {

                this.timer += 1.0;
                this.callback(event);
            }
            else {

                this.active = false;
                this.timer = 0;
            }
        }
    }


    public draw(canvas : Canvas) {

        if (!this.active || this.effectType == TransitionEffectType.None)
            return;

        canvas.moveTo();

        let t = this.timer;
        if (this.fadeIn)
            t = 1.0 - t;

        let maxRadius : number;
        let radius : number;

        canvas.setFillColor(this.color[0], this.color[1], this.color[2]);

        switch (this.effectType) {

        case TransitionEffectType.Fade:

            if (this.param > 0) {

                t = Math.round(t * this.param) / this.param;
            }

            canvas.setGlobalAlpha(t);
            canvas.fillRect(0, 0, canvas.width, canvas.height);
            canvas.setGlobalAlpha();

            break;

        case TransitionEffectType.CirleIn:

            maxRadius = Math.max(
                Math.hypot(this.center.x, this.center.y),
                Math.hypot(canvas.width - this.center.x, this.center.y),
                Math.hypot(canvas.width - this.center.x, canvas.height - this.center.y),
                Math.hypot(this.center.x, canvas.height - this.center.y)
            );

            radius = (1 - t) * maxRadius;
            canvas.fillCircleOutside(radius, this.center.x, this.center.y);

            break;

        case TransitionEffectType.BoxVertical:

            radius = Math.round(t * canvas.height / 2);
            
            canvas.fillRect(0, 0, canvas.width, radius);
            canvas.fillRect(0, canvas.height - radius, canvas.width, radius);

            break;

        default:
            break;
        }
    }


    public isActive = () : boolean => this.active;

    
    public deactivate() {

        this.active = false;
    }
}
