import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { Intro } from "./intro.js";
import { State } from "./keyboard.js";
import { MAP_DATA } from "./mapdata.js";
import { clamp } from "./math.js";
import { Menu, MenuButton } from "./menu.js";
import { StarrySkyRenderer } from "./sky.js";
import { SoundSource } from "./soundsrc.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


const APPEAR_TIME = 90;


export class TitleScreen implements Scene {


    private menu : Menu;
    private startIndex : number;

    private background : StarrySkyRenderer;
    private phase : number;
    private enterTimer : number;
    private waveTimer : number;

    private animTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.startIndex = 1;
        this.waveTimer = 0;

        this.menu = new Menu(
            [
                new MenuButton("NEW GAME",
                event => {
                    this.startGame(true, event);
                }),
                new MenuButton("CONTINUE",
                event => {
                    this.startGame(false, event);
                }),
                new MenuButton("AUDIO: " + (event.sound.isEnabled() ? "ON " : "OFF") ,
                event => {

                    event.sound.toggle(!event.sound.isEnabled());
                    this.menu.changeButtonText(2, 
                        "AUDIO: " + (event.sound.isEnabled() ? "ON " : "OFF"));
                }
                )
            ]
        );

        this.menu.activate();
        this.background = new StarrySkyRenderer();

        this.phase = param == null ? 0 : 1;
        this.enterTimer = 1.0;

        event.transition.activate(false,
            TransitionEffectType.Fade, 1.0/30.0, null,
            [0, 0, 0], 4);

        this.animTimer = 0;
    }


    private startGame(newGame : boolean, event : CoreEvent) {

        this.startIndex = 1;
        if (!newGame) {
            
            try {

                this.startIndex = clamp(
                    Number(window.localStorage.getItem("jn__spacemonsters_save")), 
                    1, MAP_DATA.length);
            }
            catch (e) {

                this.startIndex = 1;
                console.log(e);
            }
        }

        event.transition.activate(true, TransitionEffectType.CirleIn, 1.0/30.0,
            event => event.changeScene(this.startIndex == 1 ? Intro : GameScene),
            [0, 0, 0])
            .setCenter(new Vector2(80, 72));
    }


    public update(event : CoreEvent) {

        const ENTER_SPEED = 1.0/60.0;
        const WAVE_SPEED = 0.05;

        this.background.update(event);

        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.step) % (Math.PI*2);

        if (this.phase == 0) {

            this.background.setSpeed(0, -0.5);
            if ((this.animTimer += event.step) >= APPEAR_TIME) {

                ++ this.phase;
                this.background.setSpeed(0, 0);
            }
            return;
        }

        if (event.transition.isActive()) return;

        if (this.phase == 1) {

            this.enterTimer = (this.enterTimer + ENTER_SPEED * event.step) % 1.0;

            if (event.keyboard.getActionState("start") == State.Pressed ||
                event.keyboard.getActionState("fire") == State.Pressed) {

                ++ this.phase;
                event.sound.playSequence(SoundSource.StartBeep, 0.60, "square");
            }

            return;
        }

        this.menu.update(event);
    }


    private drawLogo(canvas : Canvas) {

        const AMPLITUDE = 4.0;
        const JUMP_Y = 136;

        let logo = canvas.data.getBitmap("logo");

        let x = canvas.width/2 - logo.width/2;
        let y = 8;

        if (this.phase == 0) {

            y += Math.round((1.0 - this.animTimer/APPEAR_TIME) * JUMP_Y);
        }

        let step = (Math.PI*2) / logo.height;
        let dx : number;

        for (let dy = 0; dy < logo.height; ++ dy) {

            dx = Math.round(Math.sin(this.waveTimer + step * dy) * AMPLITUDE);

            canvas.drawBitmapRegion(logo, 0, dy, logo.width, 1,
                dx + x,  dy + y);
        }
        
    }   


    public redraw(canvas : Canvas) {

        canvas.clear();
        this.background.draw(canvas);

        this.drawLogo(canvas);

        if (this.phase == 0)  
            return;

        let midx = canvas.width/2;

        if (this.phase == 1) {

            if (this.enterTimer < 0.5) {

                canvas.drawText(canvas.data.getBitmap("fontYellow"), 
                    "PRESS ENTER", midx, canvas.height-44, 0, 0, true);
            }
        }
        else {

            this.menu.draw(canvas,
                0, 28, 0, 13, true);
        }

        canvas.drawText(canvas.data.getBitmap("font"), 
            "#2021 JANI NYK$NEN", midx, canvas.height-9, 0, 0, true);
    }


    public dispose = () : any => <any> this.startIndex;
}
