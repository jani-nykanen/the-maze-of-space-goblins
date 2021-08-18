import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { DataGenerator } from "./datagen.js";
import { State } from "./keyboard.js";
import { Stage } from "./stage.js";
import { TransitionEffectType } from "./transition.js";



export class GameScene implements Scene {


    private stage : Stage;


    constructor() {

        this.stage = new Stage();
    }

    
    private reset(event : CoreEvent) {

        event.transition.activate(true, 
            TransitionEffectType.BoxVertical, 1.0/20.0,
            () => this.stage.reset());
    }


    public update(event : CoreEvent) {
      
        if (event.transition.isActive()) return;

        this.stage.update(event);

        if (event.keyboard.getActionState("back") == State.Pressed) {

            this.stage.undo();
        }
        else if (event.keyboard.getActionState("restart") == State.Pressed) {

            this.reset(event);
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);
        canvas.moveTo();

        this.stage.draw(canvas);
    }
    
    
    public dispose = () : void => <any> 0;
}
