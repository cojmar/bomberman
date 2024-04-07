import { Player } from './player.js'
import { UI } from './ui.js'
import { TileMap } from './tilemap.js'

export class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'game' })

    }
    preload() {
        Player.preload(this)
        TileMap.preload(this)
        this.ui = new UI(this)
    }

    create() {
        this.net = this.sys.game.net
        this.sys.game.net_cmd = (data) => this.net_cmd(data)


        this.sys.game.resize = () => this.ui.init_screen()
        this.send_cmd = (cmd, data) => this.sys.game.net.send_cmd(cmd, data)
        this.new_game()


        setTimeout(() => {
            // this.scene.switch('main')
        }, 5000)

        setInterval(() => {
            //this.send_cmd('set_data', Object.assign(this.player.data, { x: this.player.x, y: this.player.y }))
        }, 1000)

    }
    net_cmd(cmd_data) {
        switch (cmd_data.cmd) {
            case 'room.user_leave':
                if (this.players.has(cmd_data.data.user)) {
                    this.players.get(cmd_data.data.user).destroy()
                    this.players.delete(cmd_data.data.user)
                }
                break
            case 'room.user_data':
                this, this.set_player(cmd_data.data.user, cmd_data.data.data)
                break
            default:
                console.log(cmd_data)
                break
        }

    }

    new_game() {
        this.players = new Map()
        this.game_layer.getChildren().forEach(child => child.destroy())

        TileMap.init_map(this)

        Object.values(this.net.room.users).map(user => {

            this.set_player(user.info.user, user.data)
        })

        this.player = this.set_player(this.net.me.info.user)
        this.net.send_cmd('set_data', this.player.data)


        if (this.game_camera) this.game_camera.startFollow(this.player)

        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setTint(0xff0000)
        })

        this.input.on('gameobjectout', (pointer, gameObject) => {
            gameObject.clearTint()
        })

        // this.physics.add.collider(player, layer, () => {
        //     console.log('colliding')
        // })

        // this.physics.add.overlap(player, layer, () => {
        //     console.log('overlapping')
        // })
    }

    set_player(uid = 'default', data) {
        if (!data) data = {}

        let player = false

        if (!this.players.has(uid)) {
            player = new Player(this)
            player.set_data({ x: 48, y: 48 })
            this.players.set(uid, player)
            this.physics.add.collider(player, this.colision_layer)
            if (this.game_layer) this.game_layer.add(player)
            this.players.set(uid, player)
        }
        else player = this.players.get(uid)

        player.set_data(data)
        return player
    }

    update(time, delta) {
        // calculate movment direction
        if (this.player) {
            let direction = ""
            if (this.cursors.reduce((r, c) => {
                if (!r) r = (c.left.isDown)
                return r
            }, false)) direction = "l"
            else if (this.cursors.reduce((r, c) => {
                if (!r) r = (c.right.isDown)
                return r
            }, false)) direction = "r"

            if (this.cursors.reduce((r, c) => {
                if (!r) r = (c.up.isDown)
                return r
            }, false)) direction += "u"
            else if (this.cursors.reduce((r, c) => {
                if (!r) r = (c.down.isDown)
                return r
            }, false)) direction += "d"

            // send direction
            if (direction !== this.player.data.direction) {
                this.send_cmd('set_data', { direction, x: this.player.x, y: this.player.y })

                if (this.game_camera) this.game_camera.startFollow(this.player)
            }
        }

        if (this.players) this.players.forEach(async player => player.update())
    }

}