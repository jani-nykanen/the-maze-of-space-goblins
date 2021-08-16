import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { DataGenerator } from "./datagen.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;


    constructor() {

        this.stage = new Stage();
    }


    public update(event : CoreEvent) {
      
        this.stage.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);
        canvas.moveTo();

        this.stage.draw(canvas);

        canvas.drawBitmap(canvas.data.getBitmap("art1"), 0, 0);
        canvas.drawBitmap(canvas.data.getBitmap("art2"), 0, 16);
        canvas.drawBitmap(canvas.data.getBitmap("art3"), 0, 32);
    }
    
    
    public dispose = () : void => <any> 0;
}
