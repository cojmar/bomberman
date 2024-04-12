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
                if (cmd_data.data.user === this.net.me.info.user) return false
                this.set_player(cmd_data.data.user, cmd_data.data.data)
                if (this.is_host(cmd_data.data.user) || !this.net.room.host) {
                    if (cmd_data.data.data?.map_data?.data) {
                        let map_data = this.map.get_map()
                        if (JSON.stringify(map_data) === JSON.stringify(cmd_data.data.data.map_data)) return false
                        if (
                            cmd_data.data.data.map_data.width !== map_data.width ||
                            cmd_data.data.data.map_data.height !== map_data.height
                        ) this.map.init_map(cmd_data.data.data.map_data)
                        else this.map.set_map(cmd_data.data.data.map_data.data)
                    }
                }
                break
            case 'action':
                try {
                    this.players.get(cmd_data.data.user)[`action_${cmd_data.data.data}`]()
                } catch (error) { }
                break
            default:
                //console.log(cmd_data)
                break
        }
    }

    host() {

        return (this.net.room.host) ? this.net.room.users[this.net.room.host] : Object.values(this.net.room.users).shift() || false
    }
    is_host(uid = false) {
        if (!uid) uid = this.net.me.info.user
        return (uid === this.host().info.user)
    }

    init_game() {
        this.players = new Map()
        this.game_layer.getChildren().forEach(child => child.destroy())
        if (this.collision_layer) this.collision_layer.destroy()
        this.collision_layer = this.physics.add.group()
        //console.log(this.host())
        this.map = new TileMap(this, this.host()?.data?.map_data?.data || {})
        /*
                this.map.spawn_tiles.push(1)
                this.map.init_map({ width: 5, height: 5, data: [20, 20, 20, 20, 20] })
        */


        Object.values(this.net.room.users).map(user => {
            if (!user.data.x) {
                let start_tile = this.get_user_spawn_tile(user.info.user)
                if (!start_tile) return false
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


        // // Set a seed for the random number generator
        // Phaser.Math.RND.sow([123, 456, 789]);
        // console.log(Phaser.Math.RND.state())
        // // Now, Phaser.Math.RND will return the same sequence of random numbers
        // console.log(Phaser.Math.RND.frac()); // 0.123
        // console.log(Phaser.Math.RND.frac()); // 0.456
        // Phaser.Math.RND.sow([123, 456, 789])
        // console.log(Phaser.Math.RND.frac()); // 0.789
        // console.log(Phaser.Math.RND.frac()); // 0.789
    }

    get_user_spawn_tile(uid, random = false) {
        if (!this.map.spawn_spots.length) return false
        let index = Object.keys(this.net.room.users).indexOf(uid)
        let spawnIndex = (random) ? Math.floor(Math.random() * this.map.spawn_spots.length) : index % this.map.spawn_spots.length
        // spawnIndex = 0

        return this.map_layer.getTileAt(...this.map.spawn_spots[spawnIndex])
    }

    spawn_player(random = false) {
        let start_tile = this.get_user_spawn_tile(this.net.me.info.user, random)
        if (!start_tile) return false

        this.player = this.set_player(this.net.me.info.user, {
            x: start_tile.pixelX + (start_tile.baseWidth / 2),
            y: start_tile.pixelY + (start_tile.baseHeight / 2)
        })

        this.net.send_cmd('set_data', this.player.data)
        if (this.game_camera) this.game_camera.startFollow(this.player)
        setTimeout(() => {
            let tile = this.player.get_tile()
            if (tile?.properties?.spawn) tile?.animation?.play()
        }, 200)

    }

    set_player(uid = 'default', data) {
        if (!data) data = {}
        let player = this.players.get(uid) || new Player(this, uid, { x: -1000, y: -1000 })
        player.set_data(data)
        let tile = player.get_tile()
        if (tile?.properties?.spawn) tile?.animation?.play()

        return player
    }

    update(time, delta) {
        if (this.ui_text) {

            try {
                let tile = this.player.get_tile()
                this.ui_text.text = ` Players ${Object.keys(this.net.room.users).length}\n X:${tile.x} Y:${tile.y} T:${tile?.oindex}`
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
            if (this.player.data)
                if (direction !== this.player.data.direction) {
                    this.player.set_data({ direction })
                    this.send_cmd('set_data', { direction, x: this.player.x, y: this.player.y })

                    if (this.game_camera) this.game_camera.startFollow(this.player)
                }
        }

        if (this.players) this.players.forEach(async player => player.update(time, delta))
        if (this.map) this.map.update(time, delta)
    }

}