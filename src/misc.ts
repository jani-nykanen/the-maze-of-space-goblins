import { Canvas } from "./canvas.js";


export const drawBox = (canvas : Canvas, x : number, y : number,
    w : number, h : number) => {

    const MARGIN = 6;

    const COLORS = [
        0b111111,
        0,
        0b000110
    ];

    let dx = canvas.width/2 - w/2 + x;
    let dy = canvas.height/2 - h/2 + y;

    for (let j = 0; j <= 2; ++ j) {

        canvas.setFillColor(...canvas.data.getRGB222Color(COLORS[j]));
        canvas.fillRect(
            dx - MARGIN + j, 
            dy - MARGIN + j, 
            w + MARGIN*2 - j*2, 
            h + MARGIN*2 - j*2);
    }
}
