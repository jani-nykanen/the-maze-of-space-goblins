import { Canvas, getColorString } from "./canvas.js";
import { Core } from "./core.js";
import { GameScene } from "./game.js";


const BRICK = [0, 0b100000, 0b110100, 0b111000]; 

const UFO1 = [0, -1, 0b001011, 0b101111]; 
const UFO2 = [0, -1, 0b001011, 0b101010]; 

const ROCK1 = [0, -1, 0b101000, 0b111110]; 
const ROCK2 = [0, -1, 0b101000, 0b010100]; 

const STAR = [0, 0, 0b101011, 0b111111]; 

const ALIEN_GREEN_1 = [0, -1, 0b101100, 0b011000];
const ALIEN_GREEN_2 = [0, -1, 0b000100, 0b011000];

const ALIEN_BLUE_1 = [0, -1, 0b101111, 0b011011];
const ALIEN_BLUE_2 = [0, -1, 0b000110, 0b011011];

const ALIEN_YELLOW_1 = [0, -1, 0b111110, 0b111000];
const ALIEN_YELLOW_2 = [0, -1, 0b100100, 0b111000]

const FACE = [0, -1, 0b101010, 0b111111];

const PSTAR_1 = [0, -1, 0b111110, 0b111100];
const PSTAR_2 = [0, -1, 0b111000 ,0b111100];

const CROSS = [0, -1, 0b100111, 0b010010];
const GRAY_TO_BLACK = [0b010101, -1, -1, -1];

const CURSOR = [0, -1, 0b111000, 0b111101];


const PALETTE_1 = [

    // Line 1
    BRICK, BRICK, UFO1, UFO1, UFO1, UFO1, UFO1, UFO1,
    ROCK1, ROCK1, STAR, CROSS, ALIEN_GREEN_1, ALIEN_GREEN_2, ALIEN_GREEN_1, ALIEN_GREEN_2,
    ALIEN_GREEN_1, ALIEN_GREEN_2,  FACE, FACE, PSTAR_1, PSTAR_2, CROSS, null,
    null,  null,  null, null, null, null, null, null,

    // Line 2
    BRICK, BRICK, UFO2, UFO2, UFO2, UFO2, UFO2, UFO2,
    ROCK2, ROCK2, STAR, CROSS, ALIEN_GREEN_2, ALIEN_GREEN_2, ALIEN_GREEN_2, ALIEN_GREEN_2, 
    ALIEN_GREEN_2, ALIEN_GREEN_2,  FACE, FACE, PSTAR_2, PSTAR_2, CURSOR, null,
    null,  null,  null, null, null, null, null, null,
];


const PALETTE_2 = [

    // Line 1
    null, null, null, null, null, null, null, null,
    null, null, null, null, ALIEN_BLUE_1, ALIEN_BLUE_2, ALIEN_BLUE_1, ALIEN_BLUE_2,
    ALIEN_BLUE_1, ALIEN_BLUE_2,  null, null, null, null, GRAY_TO_BLACK, null,
    null,  null,  null, null, null, null, null, null,

    // Line 2
    null, null, null, null, null, null, null, null,
    null, null, null, null, ALIEN_BLUE_2, ALIEN_BLUE_2, ALIEN_BLUE_2, ALIEN_BLUE_2, 
    ALIEN_BLUE_2, ALIEN_BLUE_2,  null, null, null, null, null, null,
    null,  null,  null, null, null, null, null, null,
];


const PALETTE_3 = [

    // Line 1
    null, null, null, null, null, null, null, null,
    null, null, null, null, ALIEN_YELLOW_1, ALIEN_YELLOW_2, ALIEN_YELLOW_1, ALIEN_YELLOW_2,
    ALIEN_YELLOW_1, ALIEN_YELLOW_2,  null, null, null, null, null, null,
    null,  null,  null, null, null, null, null, null,

    // Line 2
    null, null, null, null, null, null, null, null,
    null, null, null, null, ALIEN_YELLOW_2, ALIEN_YELLOW_2, ALIEN_YELLOW_2, ALIEN_YELLOW_2, 
    ALIEN_YELLOW_2, ALIEN_YELLOW_2,  null, null, null, null, null, null,
    null,  null,  null, null, null, null, null, null,
];


const drawTitle = (canvas : HTMLCanvasElement, ctx : CanvasRenderingContext2D) : void => {

    const OFFSET = 1;

    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "rgb(255, 255, 85)";
    ctx.textAlign = "center";

    for (let i = 1; i >= 0; -- i) {

        ctx.fillStyle = i == 0 ? "rgb(255, 255, 85)" : "rgb(170, 85, 0)";

        ctx.fillText("STAGE", canvas.width/2 + OFFSET*i, 24 + OFFSET*i);
        ctx.fillText("CLEAR!", canvas.width/2 + OFFSET*i, 48 + OFFSET*i);
    }
}


window.onload = () => (new Core(160, 144))
    .addAction("left", "ArrowLeft")
    .addAction("up", "ArrowUp")
    .addAction("right", "ArrowRight")
    .addAction("down", "ArrowDown")
    .addAction("fire", "Space")
    .addAction("back", "Backspace")
    .addAction("start", "Enter")
    .addAction("restart", "KeyR")
    .run(GameScene, event => {

        event.data.loadImage("art.png", img => {
            
            event.data.generateColorBitmap("art1", img, PALETTE_1);
            event.data.generateColorBitmap("art2", img, PALETTE_2);
            event.data.generateColorBitmap("art3", img, PALETTE_3);
        });

        event.data.generateBitmapFont("font", "Arial", 10, 256, 256);
        event.data.generateBitmapFont("fontYellow", "Arial", 10, 256, 256, 0b111101);
        event.data.customDrawFunction("clear", 96, 56, drawTitle, 80);
    });
