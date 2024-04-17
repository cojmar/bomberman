export class GameObject extends Phaser.Physics.Arcade.Sprite {
    static {
        this.img_data = ['', '', {
            frameWidth: 0,
            frameHeight: 0
        }]
    }

    static preload(scene) {
        scene.load.spritesheet(...this.img_data)
    }
    constructor(scene, uid = 'default', data) {
        super(scene, 0, 0, 'bomb')
        this.uid = uid
        scene.add.existing(this)
        scene.game_layer.add(this)
        scene.physics.add.existing(this)
        scene.collision_layer.add(this)
        this.data = {
            "direction": "",
            "x": 0,
            "y": 0,
            destroy: () => scene.game_objects.delete(uid)
        }
        if (typeof data === 'object') this.set_data(data)
        this.setScale(0.58)
        this.body.immovable = true
        this.body.setSize(20, 30, true)
        this.body.setOffset(6, 18)

        if (!this.scene.game_objects) this.scene.game_objects = new Map()
        if (this.scene.game_objects.has(this.uid)) return false
        this.scene.game_objects.set(this.uid, this)
        this.init_anims()
        this.create()

    }
    init_anims() {


    }
    create() {

    }
    get_data() {
        let r = Object.assign(this.data)
        delete r.destroy
        return r
    }
    get_tile(x, y) {
        if (!x) x = this.x
        if (!y) y = this.y
        if (!this.scene.map_layer) return false
        return this.scene.map_layer.getTileAtWorldXY(x, y) || false
    }

    set_data(data) {
        if (typeof data !== "object") return false
        Object.keys(data).map(k => { this.data[k] = data[k] })
        if (data.x) this.x = data.x
        if (data.y) this.y = data.y
    }

    render(time, delta) {

    }

    async update(time, delta) {
        this.depth = this.y + 20
        this.render(time, delta)

        let direction = this.data.direction
        if (direction.indexOf('l') !== -1) this.setVelocityX(-100)
        else if (direction.indexOf('r') !== -1) this.setVelocityX(100)
        else this.setVelocityX(0)

        if (direction.indexOf('u') !== -1) this.setVelocityY(-100)
        else if (direction.indexOf('d') !== -1) this.setVelocityY(100)
        else this.setVelocityY(0)

    }
}


