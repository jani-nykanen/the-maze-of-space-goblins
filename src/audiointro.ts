import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { StartIntro } from "./startintro.js";


const TEXT =
`WOULD YOU LIKE\nTO ENABLE AUDIO?\nYOU CAN CHANGE\nTHIS LATER.\n\nPRESS ENTER TO\nCONFIRM.`;


export class AudioIntro implements Scene {


    static INITIAL_SAMPLE_VOLUME = 0.50;
    static INITIAL_MUSIC_VOLUME = 0.60;

    private yesNoMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                    event => {

                        event.sound.createContext();
                        event.sound.toggle(true);

                        event.changeScene(StartIntro);
                    }),

                new MenuButton("NO",
                    event => {

                        event.sound.createContext();
                        event.sound.toggle(false);

                        event.changeScene(StartIntro);
                    })
            ]
        );

        this.yesNoMenu.activate(1);
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        canvas.drawText(canvas.data.getBitmap("font"), TEXT,
            16, 12, 0, 1, false);

        this.yesNoMenu.draw(canvas, 0, 40, 0, 12);
    }


    public dispose = () : any => <any>0;

}
