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
        this.sys.game.resize = () => this.ui.init_screen()
        this.new_game()

    }

    new_game() {
        this.players = new Map()
        this.game_layer.getChildren().forEach(child => child.destroy())

        TileMap.init_map(this)
        this.player = this.set_player()
        this.set_player({ uid: 2 })
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

    set_player(data) {
        if (!data) data = {}
        let uid = data?.uid || 'default'
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
                this.player.set_data({ direction })
                if (this.game_camera) this.game_camera.startFollow(this.player)
            }
        }

        if (this.players) this.players.forEach(async player => player.update())
    }

}