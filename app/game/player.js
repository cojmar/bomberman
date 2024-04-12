export class Player extends Phaser.Physics.Arcade.Sprite {
    static preload(scene) {
        scene.load.spritesheet('player', 'assets/img/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        })
    }
    constructor(scene, uid = 'default', data) {
        super(scene, 0, 0, 'player')
        if (!scene.players) scene.players = new Map()
        if (scene.players.has(uid)) return false

        this.uid = uid
        scene.add.existing(this)
        scene.game_layer.add(this)
        scene.physics.add.existing(this)
        scene.collision_layer.add(this)

        this.safe_spots = []
        if (this.scene?.map?.safe_spots) this.safe_spots = [...this.safe_spots, ...this.scene.map.safe_spots]
        if (scene.map_layer) this.map_collider = scene.physics.add.collider(this, scene.map_layer, (obj1, tile) => {
            this.scene.map.brake_tile(tile)
        })

        this.setScale(0.58)
        this.body.immovable = true
        this.body.setSize(20, 30, true)
        this.body.setOffset(6, 18)
        this.data = {
            "direction": "",
            "x": 0,
            "y": 0,
            destroy: () => scene.players.delete(uid)
        }
        if (typeof data === 'object') this.set_data(data)
        this.init_anims()
        scene.players.set(uid, this)
    }
    get_tile(x, y) {
        if (!x) x = this.x
        if (!y) y = this.y
        if (!this.scene.map_layer) return false
        return this.scene.map_layer.getTileAtWorldXY(x, y) || false
    }

    init_anims() {
        if (!this.scene.anims.anims.entries['player_left']) this.scene.anims.create({
            key: 'player_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })

        if (!this.scene.anims.anims.entries['player_turn']) this.scene.anims.create({
            key: 'player_turn',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        })

        if (!this.scene.anims.anims.entries['player_right']) this.scene.anims.create({
            key: 'player_right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        })
    }
    set_data(data) {
        if (typeof data !== "object") return false
        Object.keys(data).map(k => { this.data[k] = data[k] })
        if (data.x) this.x = data.x
        if (data.y) this.y = data.y
    }
    action_respawn() {
        if (this.uid !== this.scene.net.me.info.user) return false
        this.scene.spawn_player(true)
    }

    update() {
        let direction = this.data.direction
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            let tile = this.get_tile()
            if (this.safe_spots.indexOf(tile.oindex) !== -1) return

            if (obj1.x > obj2.x) direction = direction.replace('l', '')
            else direction = direction.replace('r', '')

            if (obj1.y > obj2.y) direction = direction.replace('u', '')
            else direction = direction.replace('d', '')
        })

        if (direction.indexOf('l') !== -1) this.setVelocityX(-100)
        else if (direction.indexOf('r') !== -1) this.setVelocityX(100)
        else this.setVelocityX(0)

        if (direction.indexOf('u') !== -1) this.setVelocityY(-100)
        else if (direction.indexOf('d') !== -1) this.setVelocityY(100)
        else this.setVelocityY(0)

        if (this.data.direction.indexOf('l') !== -1) this.anims.play('player_left', true)
        else if (this.data.direction.indexOf('r') !== -1) this.anims.play('player_right', true)
        else this.anims.play('player_turn', true)

        this.depth = this.y + 20

    }
}


