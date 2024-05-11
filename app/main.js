import { Game } from "./game/game.js"
import Network from "./network.js"

class Main extends Phaser.Scene {
    constructor() {
        super({ key: 'main' })
    }
    preload() {
        this.load.script('webfont', './assets/js/webfont.js')
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
    async create() {

        await new Promise(r => WebFont.load({
            custom: {
                families: ['Roboto Mono']
            },
            active: () => r()
        }))

        if (!this.sys.game.default_room) this.sys.game.default_room = this.sys.game.net.me.room
        this.sys.game.net_cmd = (data) => this.net_cmd(data)
        this.sys.game.resize = () => this.on_resize()
        this.net = this.sys.game.net
        this.net.send_cmd('join', 'lobby')

        this.sys.game.game_to_join = `${this.sys.game.default_room}${window.location.hash.replace('#', '').replace('gpu', '')}`

        this.input.keyboard.on('keyup', e => (e.code !== 'Escape') ? this.join_game(this.sys.game.game_to_join) : false)
        this.input.on('pointerdown', e => this.join_game(this.sys.game.game_to_join))
        this.add_text(10, 10, 40, 'BOMBERMAN BETA')
        this.add_text(10, 50, 12, 'MADE BY COJMAR (2024)')
        this.add_text(10, 160, 20, [
            'CONTROLS',
            '   WASD or ARROWS - move',
            '   SPACE - place bomb',
            '   DIRECTION + SPACE - throw bomb if u have bomb speed',
            '   E - select/center yourself',
            '   MOUSE DRAG MAP',
            '   MOUSE WHEEL - zoom in out',
            '   CLICK ON OBJECTS TO SEE THERE STATS',
            '   ESC - exit to main menu'
        ].join('\n'), false)
        this.add_text(10, 410, 20, [
            'GAME PLAY',
            '   SCORING POINTS',
            '       KILL other players',
            '       BRAKE TILES',
            '       INCREASE POWERS',
            '   BOMBS DO NOT DETONATE IN SPAWNS',
            `   PLAYER WHO GETS FIRST TO MAX SCORE WINS`,

        ].join('\n'), false)
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
    add_text(x, y, size, data, yello_gradient = true) {
        const text = this.add.text(x, y, data, { fontFamily: 'Roboto Mono', fontSize: size, strokeThickness: 2, stroke: '#ffffff', align: 'left', fontStyle: 'bold' })
        const gradient = text.context.createLinearGradient(0, 0, 0, text.height)
        gradient.addColorStop(0, '#f26522')
        if (yello_gradient) gradient.addColorStop(0.5, '#fff200')
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

new class {
    constructor() {
        this.mode = (window.location.hash.indexOf('gpu') !== -1) ? 'gpu' : 'cpu'
        this.net = new Network()
        this.net.on('connect', () => this.net.send_cmd('auth', { 'user': '', 'room': 'bomberman' }))
        this.net.on('auth.info', (data) => this.start_game())
        window.addEventListener("resize", () => this.resize())
        this.net.connect('wss://ws.emupedia.net/ws/')
        window.u_network = this.net

    }
    start_game() {
        if (this.game) this.game.destroy(true, false)
        this.game = new Phaser.Game({
            type: (this.mode === 'cpu') ? Phaser.CANVAS : (this.mode === 'gpu') ? Phaser.WEBGL : Phaser.AUTO,
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

        let net_time = new Date(this.net.me.info.last_login_date).getTime()
        let now_time = Date.now()
        this.game.time = () => net_time + (Date.now() - now_time)

        this.game.net = this.net
        this.game.net.on("cmd", (data) => { if (this.game.net_cmd) this.game.net_cmd(data) })
        this.game.main = this
    }
    resize() {
        if (this.game.resize) this.game.resize()
    }
}