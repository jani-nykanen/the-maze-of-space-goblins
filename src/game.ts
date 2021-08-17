import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { DataGenerator } from "./datagen.js";
import { State } from "./keyboard.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;


    constructor() {

        this.stage = new Stage();
    }


    public update(event : CoreEvent) {
      
        this.stage.update(event);

        if (event.keyboard.getActionState("back") == State.Pressed) {

            this.stage.undo();
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);
        canvas.moveTo();

        this.stage.draw(canvas);
    }
    
    
    public dispose = () : void => <any> 0;
}
