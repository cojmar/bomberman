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
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            let tile = this.get_tile()
            if (this.safe_spots.indexOf(tile.oindex) !== -1) return false
            if (obj2.uid === this.scene.sys.game.net.me.info.user) return false
            if (obj2.uid === this.uid) return false
            this.map_collision(tile)
        })
        if (this.time() > this.data.time * 1000) {
            if (this?.data?.player === this.scene.sys.game.net.me.info.user) this.scene.bombs++
            let bomb_tile = this.get_tile()

            let tiles_to_brake = []

            for (let x = bomb_tile.x - this.data.range; x <= bomb_tile.x + this.data.range; x++) tiles_to_brake.push(this.scene.map.map.getTileAt(x, bomb_tile.y))
            for (let y = bomb_tile.y - this.data.range; y <= bomb_tile.y + this.data.range; y++) tiles_to_brake.push(this.scene.map.map.getTileAt(bomb_tile.x, y))

            tiles_to_brake.map(t => {
                if (this.scene.map.brake_tile(t) && this.data.player === this.scene.sys.game.net.me.info.user) {
                    this.scene.bombs++
                }
            })


            this.destroy()

        }
    }

}


