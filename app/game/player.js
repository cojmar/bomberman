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

        scene.add.existing(this)
        scene.game_layer.add(this)
        scene.physics.add.existing(this)
        scene.collision_layer.add(this)

        let safe_spots = [29, 30]

        if (scene.map_layer) scene.physics.add.collider(this, scene.map_layer, () => {
            //console.log('colision')
        })
        scene.physics.add.collider(this, scene.collision_layer, (obj1, obj2) => {
            // Calculate the distance between obj1 and obj2
            let distance = Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y)
            let tile = this.get_tile()
            if (safe_spots.indexOf(tile.index) !== -1) return false
            this.collision = true
            this.setVelocity(-this.body.velocity.x * 1.5, -this.body.velocity.y * 1.5); // Invert the direction and send the body back where it was before no collision


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
    update() {
        if (this.collision) return this.collision = false

        if (this.data.direction.indexOf('l') !== -1) {
            this.setVelocityX(-100)
            this.anims.play('player_left', true)
        }
        else if (this.data.direction.indexOf('r') !== -1) {
            this.setVelocityX(100)
            this.anims.play('player_right', true)
        }
        else {
            this.setVelocityX(0)
            this.anims.play('player_turn', true)
        }

        if (this.data.direction.indexOf('u') !== -1) this.setVelocityY(-100)
        else if (this.data.direction.indexOf('d') !== -1) this.setVelocityY(100)
        else this.setVelocityY(0)

        this.depth = this.y + 20
    }
}

