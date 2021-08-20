import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { clamp } from "./math.js";
import { Menu, MenuButton } from "./menu.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";



export class TitleScreen implements Scene {


    private menu : Menu;
    private startIndex : number;


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

        if (event.transition.isActive()) return;

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        this.menu.draw(canvas,
            canvas.width/2 - 38, 96, -8, 13);
    }


    public dispose = () : any => <any> this.startIndex;
}
