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

        //setTimeout(() => this.scene.switch('main'), 4000)
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
        this.spwans = this.map.spawn_spots || [[0, 0]]

        Object.values(this.net.room.users).map(user => {
            if (!user.data.x) {
                let start_tile = this.get_user_spawn_tile(user.info.user)
                user.data.x = start_tile.pixelX + (start_tile.baseWidth / 2)
                user.data.y = start_tile.pixelY + (start_tile.baseHeight / 2)
            }
            this.set_player(user.info.user, user.data)
        })

        this.spawn_player()

        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setTint(0xff0000)
        })

        this.input.on('gameobjectout', (pointer, gameObject) => {
            gameObject.clearTint()
        })
    }

    get_user_spawn_tile(uid, random = false) {
        let index = Object.keys(this.net.room.users).indexOf(uid)
        let spawnIndex = (random) ? Math.floor(Math.random() * this.spwans.length) : index % this.spwans.length
        //spawnIndex = 0
        return this.map_layer.getTileAt(...this.spwans[spawnIndex])
    }

    spawn_player(random = false) {
        let start_tile = this.get_user_spawn_tile(this.net.me.info.user)
        this.player = this.set_player(this.net.me.info.user, {
            x: start_tile.pixelX + (start_tile.baseWidth / 2),
            y: start_tile.pixelY + (start_tile.baseHeight / 2)
        })

        this.net.send_cmd('set_data', this.player.data)
        if (this.game_camera) this.game_camera.startFollow(this.player)
    }

    set_player(uid = 'default', data) {
        if (!data) data = {}
        let player = this.players.get(uid) || new Player(this, uid, { x: -1000, y: -1000 })
        player.set_data(data)
        return player
    }

    update(time, delta) {
        if (this.ui_text) {
            let tile = this.player.get_tile()
            try {
                this.ui_text.text = ` Players ${Object.keys(this.net.room.users).length}\n X:${tile.x} Y:${tile.y} T:${tile.index}`
            } catch (error) { }
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