import { Game } from "./game/game.js"

class Main extends Phaser.Scene {
    constructor() {
        super({ key: 'main' })
    }
    create() {
        console.log('ok')
        this.scene.start('game')
    }

}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: window,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            // debug: true // Show hitboxes
        }
    },
    scene: [Main, Game]
})
window.addEventListener("resize", () => game.resize())
