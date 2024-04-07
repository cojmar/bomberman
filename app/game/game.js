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
        this.init_game()


    }
    net_cmd(cmd_data) {
        switch (cmd_data.cmd) {
            case 'room.user_leave':
                this.players.get(cmd_data.data.user)?.destroy()
                break
            case 'room.user_data':
                if (cmd_data.data.user !== this.net.me.info.user) this.set_player(cmd_data.data.user, cmd_data.data.data)
                break
            default:
                //console.log(cmd_data)
                break
        }

    }

    init_game() {
        this.players = new Map()
        this.game_layer.getChildren().forEach(child => child.destroy())
        if (this.collision_layer) this.collision_layer.destroy()
        this.collision_layer = this.physics.add.group()
        this.map = new TileMap(this)
        this.spwans = this.map.spawn_spots || [0, 0]

        Object.values(this.net.room.users).map((user, i) => {
            console.log(i)
            this.set_player(user.info.user, user.data)
        })

        this.player = this.players.get(this.net.me.info.user)
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
        let player = this.players.get(uid) || new Player(this, uid, { x: 48, y: 48 })
        player.set_data(data)
        return player
    }

    update(time, delta) {
        if (this.ui_text) {
            let tile = this.player.get_tile()
            this.ui_text.text = `X:${tile.x} Y:${tile.y} TYPE:${tile.index}`
        }
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
                this.player.set_data({ direction })
                this.send_cmd('set_data', { direction, x: this.player.x, y: this.player.y })

                if (this.game_camera) this.game_camera.startFollow(this.player)
            }
        }

        if (this.players) this.players.forEach(async player => player.update())
    }

}