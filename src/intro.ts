import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Dust } from "./dust.js";
import { GameScene } from "./game.js";
import { drawBox } from "./misc.js";
import { StarrySkyRenderer } from "./sky.js";
import { SoundSource } from "./soundsrc.js";
import { TransitionEffectType } from "./transition.js";
import { nextObject } from "./types.js";
import { Vector2 } from "./vector.js";


const STORY = [
[
`YOU ARE A SPACE 
TRAVELLER FROM A
FAR AWAY PLANET.
YOU ARE LOST IN
A MYSTERIOUS
SPACE MAZE.`
,
`THE MAZE IS FILLED
WITH MONSTERS. 
THEY SEEM HARM-
LESS, BUT YOU 
DECIDED TO KILL
THEM NONETHELESS.`
,
`AFTER ALL, THEY
POSSESS POWER
STARS YOU CAN USE
TO GET BACK HOME.`
],
[
`CONGRATULATIONS!
YOU HAVE COL-
LECTED ENOUGH
POWER STARS TO
RETURN HOME.`
,
`TOO BAD YOU HAD
TO KILL DOZENS
OF INNOCENT
SPACE MONSTERS
FOR THAT.`
,
`I HOPE YOU ARE
PROUD OF YOUR-
SELF.`
]
];


export class Intro implements Scene {


    private phase : number;

    private textIndex : number;
    private charIndex : number;
    private charTimer : number;

    private background : StarrySkyRenderer;

    private ufoWave : number;
    private ufoPos : Vector2;
    private movePhase : number;

    private dust : Array<Dust>;
    private dustTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.phase = Number(param) -1;

        this.textIndex = 0;
        this.charIndex = 0;
        this.charTimer = 0;

        this.background = new StarrySkyRenderer(new Vector2(-1.0, 0));
    
        this.ufoWave = 0;
        this.ufoPos = new Vector2(-16, 24);
        this.movePhase = 0;

        this.dust = new Array<Dust> ();
        this.dustTimer = 0;

        if (this.phase == 0) {

            event.transition.activate(false,
                TransitionEffectType.Fade, 1.0/30.0, null, [0, 0, 0], 4);
        }
    }


    private updateDust(event : CoreEvent) {

        const DUST_GEN_TIME = 6;
        const DUST_LIFE_TIME = 30;

        for (let d of this.dust) {

            d.update(event);
        }

        if ((this.dustTimer += event.step) >= DUST_GEN_TIME) {

            nextObject(this.dust, Dust)
                .spawn(
                    this.ufoPos.x + 2, 
                    this.ufoPos.y + 10,
                    DUST_LIFE_TIME, 4,
                    new Vector2(-2, 0));

            this.dustTimer -= DUST_GEN_TIME;
        }
    }


    private isWhitespace = (c : string) : boolean => ["\n", " ", "\t"].includes(c);


    public update(event : CoreEvent) {

        const CHAR_TIME = 4;
        const UFO_WAVE_SPEED = 0.025;
        const UFO_AMPLITUDE = 16;
        const MOVE_SPEED = 1.0;

        if (this.phase == 2) return;

        this.background.update(event);

        this.ufoWave = (this.ufoWave + UFO_WAVE_SPEED*event.step) % (Math.PI*2);
        this.ufoPos.y = 24 + Math.sin(this.ufoWave) * UFO_AMPLITUDE;

        this.updateDust(event);

        if (this.movePhase == 1) {

            if (event.transition.isActive()) return;

            if ((this.ufoPos.x += MOVE_SPEED * event.step) > 160) {

                event.transition.activate(true, TransitionEffectType.Fade,
                    1.0/30.0, event => {

                        if (this.phase == 0)
                            event.changeScene(GameScene);
                        else if (this.phase == 1)
                            this.phase = 2;

                    }, [0, 0, 0], 4); 
            }
            return;
        }
 
        if (this.movePhase == 0 && this.ufoPos.x < 80) {

            this.ufoPos.x = Math.min(80, this.ufoPos.x + MOVE_SPEED*event.step);
            return;
        }

        if (event.transition.isActive() ||
            this.phase >= STORY.length) return;

        if (this.charIndex < STORY[this.phase][this.textIndex].length) {

            if (event.keyboard.isAnyPressed()) {

                this.charIndex = STORY[this.phase][this.textIndex].length;
                // event.sound.playSequence(SoundSource.Choose, 0.60, "sawtooth");
            }
            else if ((this.charTimer += event.step) >= CHAR_TIME ||
                this.isWhitespace(STORY[this.phase][this.textIndex]) ) {

                ++ this.charIndex;
                this.charTimer = 0;
            }
        }
        else {

            if (event.keyboard.isAnyPressed()) {

                if (++ this.textIndex == STORY[this.phase].length) {

                    this.movePhase = 1;
                }
                else {

                    this.charIndex = 0;
                    this.charTimer = 0;
                }

                event.sound.playSequence(SoundSource.IntroBeep, 0.60, "square");
            }
        }
    }


    public redraw(canvas : Canvas) {

        let font = canvas.data.getBitmap("font");

        if (this.phase == 2) {

            canvas.drawText(font, "THE END",
                canvas.width/2, canvas.height/2 - 8, 0, 0, true);
            return;
        }

        canvas.clear();
        this.background.draw(canvas);

        for (let d of this.dust) {

            d.draw(canvas);
        }
        canvas.drawBitmapRegion(canvas.data.getBitmap("art1"), 
            48, 0, 16, 16,
            this.ufoPos.x, Math.round(this.ufoPos.y));

        if ((this.textIndex > 0 || this.charIndex > 0) &&
            this.textIndex < STORY[this.phase].length) {

            drawBox(canvas, 0, 27, 140, 64);

            canvas.drawText(font, 
                STORY[this.phase][this.textIndex].substring(0, this.charIndex),
                8, 66, 0, 2);
        }
    }


    public dispose = () : any => <any>null;

}
