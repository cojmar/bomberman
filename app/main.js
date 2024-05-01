import { Game } from "./game/game.js"
import Network from "./network.js"

class Main extends Phaser.Scene {
    constructor() {
        super({ key: 'main' })
    }
    create() {
        this.sys.game.net_cmd = (data) => this.net_cmd(data)
        this.net = this.sys.game.net
        this.net.send_cmd('join', 'lobby')


        //this.net.send_cmd("list")
        this.join_game('bomb-main')

    }
    net_cmd(data) {
        //console.log(data)
    }
    join_game(game) {
        this.net.send_cmd('join', game)
        this.scene.start('game')
    }
}

let net = new Network()
net.on('connect', () => net.send_cmd('auth', { 'user': '', 'room': 'bomb-main' }))

net.on('auth.info', (data) => {
    const game = new Phaser.Game({
        type: (window.location.hash.indexOf('gpu') !== -1) ? Phaser.AUTO : Phaser.CANVAS,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: window,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                fps: 60,
                // debug: true // Show hitboxes
            }
        },
        scene: [Main, Game]
    })
    let net_time = new Date(net.me.info.last_login_date).getTime()
    let now_time = Date.now()
    game.time = () => net_time + (Date.now() - now_time)

    game.net = net
    game.net.on("cmd", (data) => { if (game.net_cmd) game.net_cmd(data) })
    window.addEventListener("resize", () => (game.resize) ? game.resize() : false)
})

net.connect('wss://ws.emupedia.net/ws/')
window.u_network = net