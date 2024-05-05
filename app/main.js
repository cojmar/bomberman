import { Game } from "./game/game.js"
import Network from "./network.js"

class Main extends Phaser.Scene {
    constructor() {
        super({ key: 'main' })
    }
    preload() {
        this.sys.game.preloader = (scene) => {
            if (!scene) scene = this
            let width = window.innerWidth
            let height = window.innerHeight
            let progressBar = scene.add.graphics()
            let progressBox = scene.add.graphics()
            progressBox.fillStyle(0x222222, 0.8)
            progressBox.fillRect((width / 2) - 160, (height / 2) - 30, 320, 50)


            let loadingText = scene.make.text({
                x: width / 2,
                y: height / 2 - 50,
                text: 'Loading...',
                style: {
                    font: '20px monospace',
                    fill: '#ffffff'
                }
            })
            loadingText.setOrigin(0.5, 0.5)

            let percentText = scene.make.text({
                x: width / 2,
                y: height / 2 - 5,
                text: '0%',
                style: {
                    font: '18px monospace',
                    fill: '#ffffff'
                }
            })
            percentText.setOrigin(0.5, 0.5)

            let assetText = scene.make.text({
                x: width / 2,
                y: height / 2 + 50,
                text: '',
                style: {
                    font: '18px monospace',
                    fill: '#ffffff'
                }
            })
            assetText.setOrigin(0.5, 0.5)

            scene.load.on('progress', function (value) {
                percentText.setText(parseInt(value * 100) + '%')
                progressBar.clear()
                progressBar.fillStyle(0xffffff, 1)
                progressBar.fillRect((width / 2) - 150, (height / 2) - 20, 300 * value, 30)
            })

            scene.load.on('fileprogress', function (file) {
                assetText.setText('Loading asset: ' + file.key)
            })
            scene.load.on('complete', function () {
                progressBar.destroy()
                progressBox.destroy()
                loadingText.destroy()
                percentText.destroy()
                assetText.destroy()
            })
        }
        this.sys.game.preloader(this)

        return
        this.load.image('logo', 'zenvalogo.png')
        for (let i = 0; i < 5000; i++) {
            this.load.image('logo' + i, 'zenvalogo.png')
        }
    }
    create() {
        if (!this.sys.game.default_room) this.sys.game.default_room = this.sys.game.net.me.room
        this.sys.game.net_cmd = (data) => this.net_cmd(data)
        this.sys.game.resize = () => this.on_resize()
        this.net = this.sys.game.net
        this.net.send_cmd('join', 'lobby')

        let game_to_join = `${this.sys.game.default_room}${window.location.hash.replace('#', '').replace('gpu', '')}`

        this.input.keyboard.on('keyup', e => (e.code !== 'Escape') ? this.join_game(game_to_join) : false)
        this.input.on('pointerdown', e => this.join_game(game_to_join))
        this.add_text(10, 10, 40, 'BOMBERMAN BETA')
        this.add_text(10, 50, 12, 'MADE BY COJMAR (2024)')
        this.add_text(10, 160, 20, [
            'CONTROLS',
            '   WASD or ARROWS - move',
            '   SPACE - place bomb',
            '   ESC - exit to main menu'
        ].join('\n'))
        this.add_text(10, 280, 20, [
            'GAME PLAY',
            '   SCORING POINTS',
            '       KILL other players',
            '       BRAKE TILES',
            '       INCREASE POWERS',
            `   PLAYER WHO GETS FIRST TO MAX SCORE WINS`,
            `   CLICK ON OBJECTS TO SEE THERE STATS`
        ].join('\n'))
        this.start_text = this.add_text(window.innerWidth / 2, 120, 30, 'PRESS ANY KEY TO START')
        this.start_text.setOrigin(0.5, 0.5)
        this.tween = this.tweens.add({
            targets: [this.start_text],
            scale: 0.8,
            ease: 'sine.inout',
            yoyo: true,
            loop: -1
        })
    }
    on_resize() {
        this.start_text.x = window.innerWidth / 2
        this.sys.game.scale.resize(window.innerWidth, window.innerHeight)
    }
    add_text(x, y, size, data) {
        const text = this.add.text(x, y, data, { fontFamily: 'Arial Black', fontSize: size, strokeThickness: 3, stroke: '#ffffff', align: 'left' })
        const gradient = text.context.createLinearGradient(0, 0, 0, text.height)
        gradient.addColorStop(0, '#f26522')
        gradient.addColorStop(0.5, '#fff200')
        gradient.addColorStop(0.5, '#f7941d')
        gradient.addColorStop(1, '#ed1c24')
        text.setFill(gradient)
        return text
    }
    net_cmd(data) {
        if (data.cmd === 'room.info' && data.data.name !== 'lobby') {
            this.scene.stop('main')
            this.scene.start('game')
        }
    }
    join_game(game) {
        this.net.send_cmd('join', game)
    }
}

let net = new Network()
net.on('connect', () => net.send_cmd('auth', { 'user': '', 'room': 'bomberman' }))

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