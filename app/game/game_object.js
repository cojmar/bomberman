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
        super(scene, 0, 0, '')
        this.uid = uid
        scene.add.existing(this)
        scene.game_layer.add(this)
        scene.physics.add.existing(this)
        scene.collision_layer.add(this)
        this.data = {
            "direction": "",
            "x": 0,
            "y": 0,
            "speed": 80,
            "creation_time": this.scene.sys.game.time(),
            destroy: () => {
                this.scene.game_objects.delete(this.uid)
                if (this.scene?.world_data[this.uid]) this.scene.unset_world_object(this.uid)
            }
        }

        if (typeof data === 'object') this.set_data(data)
        this.setScale(0.58)
        this.body.immovable = true


        if (!this.scene.game_objects) this.scene.game_objects = new Map()
        if (this.scene.game_objects.has(this.uid)) return false
        this.scene.game_objects.set(this.uid, this)
        this.init_anims()

        if (this.scene.map_layer) this.map_collider = this.scene.physics.add.collider(this, this.scene.map_layer, (obj1, tile) => this.map_collision(tile))
        this.safe_spots = []
        if (this.scene?.map?.safe_spots) this.safe_spots = [...this.safe_spots, ...this.scene.map.safe_spots]

        this.create()

    }
    map_collision(tile) {

    }
    time() {
        return this.scene.sys.game.time() - this.data.creation_time
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
        if (!this?.scene?.map_layer) return false
        return this.scene.map_layer.getTileAtWorldXY(x, y) || false
    }

    get_tile_center(x, y) {
        let tile = this.get_tile(x, y)
        return (tile) ?
            {
                x: tile.pixelX + (tile.baseWidth / 2),
                y: tile.pixelY + (tile.baseHeight / 2)
            } : {
                x: 0,
                y: 0
            }
    }
    delete() {
        try {
            this.destroy()
        } catch (error) {
            this.scene.game_objects.delete(this.uid)
            if (this.scene?.world_data[this.uid]) this.scene.unset_world_object(this.uid)
            delete this

        }
    }

    set_data(data) {
        if (!this?.data) return false

        if (typeof data !== "object") return false
        Object.keys(data).map(k => { this.data[k] = data[k] })
        if (data.x) this.x = data.x
        if (data.y) this.y = data.y


        if (this.uid === this.scene.net.me.info.user && Object.keys(data).length) this.scene.send_cmd('set_data', data)

    }

    render(time, delta) {

    }

    update(time, delta) {
        if (this.updateing) return false
        this.updateing = true
        this.depth = this.y + 20
        this.render(time, delta)

        if (!this.data) return

        let direction = this.data.direction
        if (direction.indexOf('l') !== -1) this.setVelocityX(-this.data.speed)
        else if (direction.indexOf('r') !== -1) this.setVelocityX(this.data.speed)
        else this.setVelocityX(0)

        if (direction.indexOf('u') !== -1) this.setVelocityY(-this.data.speed)
        else if (direction.indexOf('d') !== -1) this.setVelocityY(this.data.speed)
        else this.setVelocityY(0)

        if (!this.data.destroy) this.data.destroy = () => {
            this.scene.game_objects.delete(this.uid)
            if (this.scene?.world_data[this.uid]) this.scene.unset_world_object(this.uid)
        }


        this.updateing = false
    }

}


