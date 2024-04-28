import { GameObject } from "./game_object.js"
export class Bomb extends GameObject {
    static {
        this.img_data = ['bomb', 'assets/img/ball.png', {
            frameWidth: 32,
            frameHeight: 48
        }]
    }


    map_collision(tile) {
        this.data.direction = ""
        this.set_data(this.get_tile_center())
        setTimeout(() => this.set_data(this.get_tile_center()))
        if (this.data.player === this.scene.net.me.info.user) this.scene.set_object('Bomb', this.uid, this.data)

    }

    create() {
        this.setTexture('bomb')
        this.body.setSize(20, 20, true)
        this.setScale(1)
    }
    explode() {

        if (this.data.player === this.scene.net.me.info.user) this.scene.player.set_data({ bombs: this.scene.player.data.bombs + 1 })
        let bomb_tile = this.get_tile()

        let tiles_to_brake = []

        for (let x = bomb_tile.x - this.data.range; x <= bomb_tile.x + this.data.range; x++) tiles_to_brake.push(this.scene.map.map.getTileAt(x, bomb_tile.y))
        for (let y = bomb_tile.y - this.data.range; y <= bomb_tile.y + this.data.range; y++) tiles_to_brake.push(this.scene.map.map.getTileAt(bomb_tile.x, y))

        tiles_to_brake.map(t => {
            if (this.scene.map.brake_tile(t) && this.data.player === this.scene.net.me.info.user) {
                this.scene.player.set_data({ bombs: this.scene.player.data.bombs + 1 })
            }
        })
        this.destroy()
    }
    render() {
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            if (this.data.player === obj2.uid) return
            this.data.direction = ""
            this.set_data(this.get_tile_center())
        })
        if (this.time() > this.data.time * 1000) this.explode()
    }

}


