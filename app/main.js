import { Game } from "./game/game.js"
import Network from "./network.js"

class Main extends Phaser.Scene {
    constructor() {
        super({ key: 'main' })
    }
    create() {
        this.net = this.sys.game.net
        this.sys.game.net_cmd = (data) => this.net_cmd(data)
        //this.net.send_cmd("list")
        this.scene.start('game')
    }
    net_cmd(data) {
        console.log(data)
    }
}

let net = new Network()
net.on('connect', () => net.send_cmd('auth', { 'user': '', 'room': 'bomb-main' }))

net.on('auth.info', (data) => {
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
    game.net = net
    game.net.on("cmd", (data) => { if (game.net_cmd) game.net_cmd(data) })
    window.addEventListener("resize", () => game?.resize())
})

net.connect('wss://ws.emupedia.net/ws/')