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

    }

    create() {
        this.setTexture('bomb')
        this.setScale(1)
    }
    render() {
        let direction = this.data.direction
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            let tile = this.get_tile()
            if (this.safe_spots.indexOf(tile.oindex) !== -1) return
            if (this.time() < 600) return
            this.map_collision(tile)
        })
        if (this.time() > 10000) this.destroy()
    }

}


