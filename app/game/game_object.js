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
        this.ndata = {
            "direction": "",
            "x": 0,
            "y": 0,
            "speed": 80,
            "creation_time": this.scene.get_time(),
            "update_time": this.scene.get_time()
        }
        if (typeof data === 'object') this.set_data(data)
        this.body.immovable = true
        if (!this.scene.game_objects) this.scene.game_objects = new Map()
        if (this.scene.game_objects.has(this.uid)) return false
        this.scene.game_objects.set(this.uid, this)
        this.init_anims()
        this.setBounce(0.1)

        this.safe_spots = []
        if (this.scene?.map?.safe_spots) this.safe_spots = [...this.safe_spots, ...this.scene.map.safe_spots]
        this.create()
    }
    random(seedn = []) {
        return this.scene.random([this.uid, ...seedn])
    }
    map_collision(tile) {

    }
    time() {
        return this.scene.get_time() - this.ndata.creation_time
    }


    init_anims() {


    }
    create() {

    }
    get_data() {
        let r = Object.assign(this.ndata)
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
    on_destroy() {

    }

    delete() {
        this.on_destroy()
        this.scene?.game_objects.delete(this.uid)
        if (this.scene?.world_data[this.uid]) this.scene.unset_world_object(this.uid)
        setTimeout(_ => this.destroy())
    }

    set_data(data) {
        //console.log(data)
        if (!this?.ndata) return false
        if (typeof data !== "object") return false
        Object.keys(data).map(k => { this.ndata[k] = data[k] })
        this.ndata.update_time = this.time()
        if (data.x) this.x = data.x
        if (data.y) this.y = data.y
        if (typeof data.visible !== 'undefined') this.visible = data.visible
        if (this.scene && this.uid === this.scene.net.me.info.user && Object.keys(data).length) this.scene.send_cmd('set_data', data)
    }

    render(time, delta) {

    }

    update(time, delta) {
        if (this.updateing) return false
        this.updateing = true
        if (!this.ndata) return this.updateing = false
        this.depth = this.y + 20
        this.render(time, delta)
        let collision = false
        this.scene.physics.world.collide(this, this.scene.map_layer, (obj1, obj2) => collision = obj2)


        //if (collision) return this.updateing = false
        let direction = this.ndata.direction
        if (collision) {
            this.map_collision(collision)
            if (this.body.blocked.up) direction = direction.replace('u', '')
            else if (this.body.blocked.down) direction = direction.replace('d', '')

            else if (this.body.blocked.left) direction = direction.replace('l', '')
            else if (this.body.blocked.right) direction = direction.replace('r', '')

        }
        if (direction.indexOf('l') !== -1) this.setVelocityX(-this.ndata.speed)
        else if (direction.indexOf('r') !== -1) this.setVelocityX(this.ndata.speed)
        else if (!collision) this.setVelocityX(0)

        if (direction.indexOf('u') !== -1) this.setVelocityY(-this.ndata.speed)
        else if (direction.indexOf('d') !== -1) this.setVelocityY(this.ndata.speed)
        else if (!collision) this.setVelocityY(0)

        this.updateing = false
    }

}


