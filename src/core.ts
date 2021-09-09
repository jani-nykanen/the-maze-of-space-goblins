import { Canvas } from "./canvas.js";
import { DataGenerator } from "./datagen.js";
import { Keyboard } from "./keyboard.js";
import { Sound } from "./sound.js";
import { TransitionEffectManager } from "./transition.js";


export class CoreEvent {


    public readonly step : number;
    public readonly keyboard : Keyboard;
    public readonly data : DataGenerator;
    public readonly transition : TransitionEffectManager;
    public readonly sound : Sound;

    private readonly core : Core;


    constructor(step : number, core : Core, 
        keyboard : Keyboard, data : DataGenerator,
        tr : TransitionEffectManager, sound : Sound) {

        this.core = core;
        this.step = step;
        this.keyboard = keyboard;
        this.data = data;
        this.transition = tr;
        this.sound = sound;
    }


    public changeScene(newScene : Function) {

        this.core.changeScene(newScene);
    }
}


export interface Scene {

    update(event : CoreEvent) : void;
    redraw(canvas : Canvas) : void;
    dispose() : any;
}


export class Core {

    private canvas : Canvas;
    private keyboard : Keyboard;
    private event : CoreEvent;
    private data : DataGenerator;
    private transition : TransitionEffectManager;
    private sound : Sound;

    private activeScene : Scene;
    private activeSceneType : Function;

    private timeSum : number;
    private oldTime : number;

    private initialized : boolean;


    constructor(canvasWidth : number, canvasHeight : number, frameSkip = 0) {

        this.data = new DataGenerator();
        this.canvas = new Canvas(canvasWidth, canvasHeight, this.data);
        this.keyboard = new Keyboard();
        this.transition = new  TransitionEffectManager();
        this.sound = new Sound();

        this.event = new CoreEvent(frameSkip+1, this, 
            this.keyboard, this.data, this.transition, this.sound);

        this.timeSum = 0.0;
        this.oldTime = 0.0;

        this.initialized = false;

        this.activeScene = null;
        this.activeSceneType = null;
    }


    private loop(ts : number) {

        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.event.step;

        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;

        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount --) > 0) {

            if (!this.initialized && this.data.hasLoaded()) {
                
                this.activeScene = new this.activeSceneType.prototype.constructor(null, this.event);
                    
                this.initialized = true;
            }

            if (this.initialized) {

                this.activeScene.update(this.event);
            }

            this.keyboard.update();
            this.transition.update(this.event);
            this.sound.update(this.event);

            this.timeSum -= FRAME_WAIT;
        }

        if (this.initialized) {

            this.activeScene.redraw(this.canvas);
            this.transition.draw(this.canvas);
        }

        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public run(initialScene : Function, onStart : ((event : CoreEvent) => void) = () => {}) {

        this.activeSceneType = initialScene;

        onStart(this.event);

        this.loop(0);
    }


    public changeScene(newScene : Function) {

        let param = this.activeScene.dispose();
        this.activeScene = new newScene.prototype.constructor(param, this.event);
    }
    
}
