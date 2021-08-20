import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { clamp } from "./math.js";
import { Menu, MenuButton } from "./menu.js";
import { StarrySkyRenderer } from "./sky.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";



export class TitleScreen implements Scene {


    private menu : Menu;
    private startIndex : number;

    private background : StarrySkyRenderer;


    constructor(param : any, event : CoreEvent) {

        this.startIndex = 1;

        this.menu = new Menu(
            [
                new MenuButton("NEW GAME",
                event => {
                    this.startGame(true, event);
                }),
                new MenuButton("CONTINUE",
                event => {
                    this.startGame(false, event);
                })
            ]
        );

        this.menu.activate();
        this.background = new StarrySkyRenderer();
    }


    private startGame(newGame : boolean, event : CoreEvent) {

        this.startIndex = 1;
        if (!newGame) {
            
            try {

                this.startIndex = clamp(Number(window.localStorage.getItem("jn__spacemonsters_save")), 1, 13);
            }
            catch (e) {

                this.startIndex = 1;
                console.log(e);
            }
        }

        event.transition.activate(true, TransitionEffectType.CirleIn, 1.0/30.0,
            event => event.changeScene(GameScene),
            [0, 0, 0])
            .setCenter(new Vector2(80, 72));
    }


    public update(event : CoreEvent) {

        this.background.update(event);

        if (event.transition.isActive()) return;

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) {

        let logo = canvas.data.getBitmap("logo");

        canvas.clear();
        this.background.draw(canvas);

        canvas.drawBitmap(logo, canvas.width/2 - logo.width/2, 16);

        this.menu.draw(canvas,
            canvas.width/2 - 38, 88, -8, 13);

        canvas.drawText(canvas.data.getBitmap("font"), 
            "©2021 JANI NYKÄNEN", canvas.width/2, canvas.height-13, -9, 0, true);
    }


    public dispose = () : any => <any> this.startIndex;
}
