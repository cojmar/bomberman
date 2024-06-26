import { Player } from './player.js'
import { UI } from './ui.js'
import { TileMap } from './tilemap.js'
import { Bomb } from './bomb.js'
import { Surprise } from './surprise.js'

export class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'game' })

    }
    preload() {
        this.sys.game.preloader(this)
        Player.preload(this)
        Bomb.preload(this)

        TileMap.preload(this)


    }

    create() {
        this.ui = new UI(this)
        this.sys.game.net_cmd = (data) => this.net_cmd(data)
        this.sys.game.resize = () => this.ui.init_screen()
        this.net = this.sys.game.net
        this.send_cmd = (cmd, data) => this.sys.game.net.send_cmd(cmd, data)

        if (!this.sys.game.init_events) {
            this.sys.game.init_events = true
            this.game.events.on('blur', () => {
                this.idle = true
                if (this.player) this.player.set_data({ idle: this.idle })
                if (this.sys.game.net.room.name !== this.sys.game.game_to_join) return false
                this.died_afk = false
                this.killed_afk = {}
            })
            this.game.events.on('focus', () => {
                this.idle = false
                if (this.player) this.player.set_data({ idle: this.idle })
                if (this.sys.game.net.room.name !== this.sys.game.game_to_join) return false
                if (this.is_host()) return false
                let host = this.host()
                if (!host?.data?.map_data) return false
                let map_data = this.map.get_map()

                if (JSON.stringify(map_data) !== JSON.stringify(host.data.map_data)) {
                    if (
                        host.data.map_data.width !== map_data.width ||
                        host.data.map_data.height !== map_data.height
                    ) this.map.init_map(host.data.map_data, false, false)
                    else this.map.set_map(host.data.map_data.data, false, false)
                }

                this.game_objects.forEach(obj => (obj.constructor.name !== 'Player') ? obj.delete() : false)
                this.world_data = JSON.parse(host?.data?.world_data || "{}")

                Object.keys(this.world_data).map(k => this.set_object(...this.world_data[k], false))


                if (this.died_afk) this.player.explode(this.died_afk)
                if (Object.keys(this.killed_afk).length) this.player.set_data({ kills: this.player.ndata.kills + Object.keys(this.killed_afk).length })
                this.died_afk = false
                this.killed_afk = {}
                Object.values(this.net.room.users).map(user => (user.info.user !== this.player.uid) ? this.set_player(user.info.user, user.data) : this.set_player(this.player.uid, this.player.get_data()))


            })
        }
        this.init_game()
        // setTimeout(() => this.scene.switch('main'), 4000)
    }
    get_time() {

        return this.sys.game.time()
    }
    net_cmd(cmd_data) {
        switch (cmd_data.cmd) {
            case 'room.user_leave':
                this.game_objects.get(cmd_data.data.user)?.delete()
                break
            case 'room.user_data':
                if (cmd_data.data.user === this.net.me.info.user) return false

                this.set_player(cmd_data.data.user, cmd_data.data.data)

                if (this.is_host(cmd_data.data.user) || !this.net.room.host) {

                    if (cmd_data.data.data?.map_data?.data && cmd_data.data.user && this.is_host(cmd_data.data.user)) {
                        let map_data = this.map.get_map()
                        if (JSON.stringify(map_data) === JSON.stringify(cmd_data.data.data.map_data)) return false
                        if (
                            cmd_data.data.data.map_data.width !== map_data.width ||
                            cmd_data.data.data.map_data.height !== map_data.height
                        ) this.map.init_map(cmd_data.data.data.map_data, false)
                        else this.map.set_map(cmd_data.data.data.map_data.data, false, false)
                    }
                }
                break
            case 'player_joined':
                if (Object.keys(this.net.room.users).length === 2 && this.is_host()) this.send_cmd('new_game')
                break
            case 'new_game':
                this.reset_game()
                break
            case 'game_over':
                this.game_over()
                break
            case 'random':
                console.log(this.game_objects.get(this.host().info.user).random().frac())
                console.log(this.game_objects.get(this.host().info.user).random().pick(['a', 'b', 'c']))

                break
            case 'action':
                if (this.game_done) return false
                try {
                    this.game_objects.get(cmd_data.data.user)[`action_${cmd_data.data.data}`]()
                } catch (error) { }
                break

            case 'set_object':
                if (cmd_data.data.user === this.net.me.info.user) return false
                this.set_object(...cmd_data.data.data, false)
                break
            case 'spawn':
                let t = this.game_objects.get(cmd_data.data.user)?.get_tile()?.animation
                if (t) t.play()
                let p = this.game_objects.get(cmd_data.data.user)
                if (p) p.visible = true
                break
            case 'pk':
                if (cmd_data.data.data[1] === this.player.uid) this.died_afk = cmd_data.data.data[0]
                else if (cmd_data.data.data[0] === this.player.uid) this.killed_afk[cmd_data.data.data[1]] = true
                break;
            default:
                //console.log(cmd_data)
                break
        }
    }

    add_hoc_host() {
        return Object.values(this.net.room.users).reduce((r, user) => (!user.data.idle && !r) ? user : r, false) || Object.values(this.net.room.users).shift()
    }
    host() {
        let host = (this.net.room.host) ? this.net.room.users[this.net.room.host] : this.add_hoc_host()
        if (host?.data?.idle) host = this.add_hoc_host()
        return host
    }
    is_host(uid = false) {
        if (!this.host()) return false
        if (!uid) uid = this.net.me.info.user
        return (uid === this.host().info.user)
    }
    random(seedn = []) {
        let seed = `${this.get_time()}`.split('').splice(-8, 5).join('') / 1
        Phaser.Math.RND.sow([seed, ...seedn])
        return Phaser.Math.RND
    }
    exit_game() {
        this.player.set_data({ map_data: false, world_data: false, update_time: 0 })
        this.scene.stop('game')
        this.scene.start('main')
    }
    async game_over() {
        if (this.game_done) return false
        this.game_done = true

        this.player.set_data({ direction: "" })
        this.player.update()
        this.update_world_data({})
        this.game_objects.forEach(obj => (obj.constructor.name !== 'Player') ? obj.delete() : obj.visible = false)
        await this.ui.message([
            'Game Over',
            `You ${(this.player.get_score() === this.player.get_ladder().pop()) ? 'win' : 'loose'}`
        ].join('\n'))
        let wins = (this.player.get_score() === this.player.get_ladder().pop()) ? (this.player.ndata.wins || 0) + 1 : this.player.ndata.wins || 0

        setTimeout(() => this.set_player(this.net.me.info.user, { wins }))
        this.reset_game()
    }
    reset_game() {
        this.ui.message('New Game')
        if (Object.keys(this.world_data).length) this.update_world_data({})

        this.game_objects.forEach(obj => (obj.constructor.name !== 'Player') ? obj.delete() : obj.visible = true)
        this.game_done = false
        this.map.reset_map()
        this.spawn_player()
        this.set_player(this.net.me.info.user, this.default_player_data)
        this.obj_to_display = this.player
    }


    init_game() {

        this.cheats = (window.location.hash.indexOf('cheats') !== -1)
        this.died_afk = false
        this.killed_afk = {}
        this.default_player_data = { bombs: 1, bomb_range: 1, kills: 0, deaths: 0, bomb_speed: 0, bomb_time: 5, broken_tiles: 0, idle: false }
        this.game_objects = new Map()
        this.game_layer.getChildren().forEach(child => child.destroy())
        if (this.collision_layer) this.collision_layer.destroy()
        this.collision_layer = this.physics.add.group()

        this.world_data = JSON.parse(this.host(true)?.data?.world_data || "{}")
        this.map = new TileMap(this, this.host(true)?.data?.map_data?.data || {})

        // setInterval(() => (this.is_host()) ? this.send_cmd('random') : '', 1000)

        // this.map.spawn_tiles.push(1)
        // this.map.init_map({ width: 5, height: 5, data: [20, 20, 20, 20, 20, 20, 1, 1, 1, 20, 20, 1, 1, 1, 20, 20, 1, 1, 1, 20, 20, 20, 20, 20, 20] })

        Object.values(this.net.room.users).map(user => {
            if (!user.data.x) {
                let start_tile = this.get_user_spawn_tile(user.info.user)
                if (!start_tile) return false
                user.data.x = start_tile.pixelX + (start_tile.baseWidth / 2)
                user.data.y = start_tile.pixelY + (start_tile.baseHeight / 2)
            }
            this.set_player(user.info.user, user.data)
        })

        Object.keys(this.world_data).map(k => this.set_object(...this.world_data[k], false))

        this.spawn_player()
        this.set_player(this.net.me.info.user, Object.assign(this.default_player_data, { wins: this.player.get_data()?.wins || 0 }))
        this.obj_to_display = this.player

        this.net.send_cmd('player_joined')

        let tile = this.player.get_tile_center()
        //this.set_object('Surprise', `s-${this.player.uid}`, { x: tile.x, y: tile.y, time: 10 })

    }

    get_user_spawn_tile(uid, random = false) {
        if (!this.map.spawn_spots.length) return false
        let index = Object.keys(this.net.room.users).indexOf(uid)
        let spawnIndex = (random) ? Math.floor(this.game_objects.get(uid).random().frac() * this.map.spawn_spots.length) : index % this.map.spawn_spots.length
        //spawnIndex = 0

        return this.map_layer.getTileAt(...this.map.spawn_spots[spawnIndex])
    }

    spawn_player(random = false) {
        let start_tile = this.get_user_spawn_tile(this.net.me.info.user, random)
        if (!start_tile) return false

        this.player = this.set_player(this.net.me.info.user, {
            x: start_tile.pixelX + (start_tile.baseWidth / 2),
            y: start_tile.pixelY + (start_tile.baseHeight / 2),
            visible: true
        })
        this.died_afk = false

        this.net.send_cmd('set_data', this.player.ndata)
        if (this.game_camera) this.game_camera.startFollow(this.player)
        this.net.send_cmd('spawn')
    }

    set_player(uid = 'default', data) {
        if (!data) data = {}
        let player = this.game_objects.get(uid) || this.new_object(Player, uid)
        if (!player) return false
        player.set_data(data)
        return player
    }
    set_object(obj_type, uid = 'default', data, emit = true) {
        if (!data) return false
        let obj = this.game_objects.get(uid) || this.new_object(eval(`${obj_type}`), uid, data)
        this.world_data[uid] = [obj_type, uid, obj.get_data()]
        this.update_world_data()
        if (emit) this.send_cmd('set_object', this.world_data[uid])
        return obj
    }
    unset_world_object(uid) {
        this.game_objects.delete(uid)
        if (this.world_data[uid]) {
            delete this.world_data[uid]
            this.update_world_data()
        }


    }
    update_world_data(data = false) {
        if (data) this.world_data = Object.assign(data)
        return this.send_cmd('set_data', { world_data: JSON.stringify(this.world_data) })
    }

    new_object(obj, uid = 'default', data) {
        let r = new obj(this, uid, data)
        r.set_data(data)
        return r
    }
    get_max_score() {
        // return 1
        return 10 + (Object.keys(this.net.room.users).length * 20)
    }

    update(time, delta) {
        if (this.game_done) return false
        if (this.updateing) return false
        this.updateing = true
        if (!this.obj_to_display) this.obj_to_display = this.player
        if (this.player.get_ladder().pop() >= this.get_max_score() && this.is_host() && !this.restarting) {
            this.restarting = true
            setTimeout(() => this.restarting = false, 5000)
            this.send_cmd('game_over')
        }

        if (this.ui_text && this.obj_to_display) {
            let fps = Math.floor(this.sys.game.loop.actualFps)
            if (fps < 40 && !this.check_if_open_gl && this.sys.game.main.mode !== 'gpu') {
                this.check_if_open_gl = true
                let a = confirm("LOW FPS SWITCH TO GPU?")
                if (a) {
                    this.sys.game.main.mode = 'gpu'
                    this.sys.game.main.start_game()

                } else {
                    this.game_camera.startFollow(this.player)
                    this.game_camera.startFollow(this.player)
                }


            }
            try {
                let new_text =
                    [
                        `FPS ${fps} ${(this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) ? 'GPU' : 'CPU'}`,
                        `Players ${Object.keys(this.net.room.users).length}`,
                        `                      `,
                        ...this.obj_to_display.info()
                    ].join('\n')
                if (!new_text) new_text = ''
                this.ui.set_info(new_text)

                // if (this.ui_text && this?.ui_text?.text !== new_text) if (this.ui_text) this.ui_text.text = new_text
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



            if (this.player.ndata && direction !== this.player.ndata.direction) {
                this.player.set_data({ direction, x: this.player.x, y: this.player.y })
                if (this.game_camera) this.game_camera.startFollow(this.player)
                //this.obj_to_display = this.player
            }
        }

        if (this.game_objects) this.game_objects.forEach(async obj => obj.update(time, delta))
        if (this.map) this.map.update(time, delta)
        this.updateing = false

    }

}