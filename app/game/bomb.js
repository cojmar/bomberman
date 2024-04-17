import { GameObject } from "./game_object.js"
export class Bomb extends GameObject {
    static {
        this.img_data = ['bomb', 'assets/img/ball.png', {
            frameWidth: 32,
            frameHeight: 48
        }]
    }


    create() {
        this.setTexture('bomb')
        this.setScale(1)
    }
    render() {
        if (this.time() > 10000) this.destroy()
    }

}


