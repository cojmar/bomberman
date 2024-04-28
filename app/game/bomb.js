import { GameObject } from "./game_object.js"
export class Bomb extends GameObject {
    static {
        this.img_data = ['bomb', 'assets/img/ball.png', {
            frameWidth: 32,
            frameHeight: 48
        }]
    }
    static preload(scene) {
        scene.load.spritesheet(...this.img_data)
        scene.load.atlas('flares', 'assets/img/flares.png', 'assets/json/flares.json')

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
        if (this.done) return false
        this.done = true

        let player = this.scene.game_objects.get(this.data.player)
        let update = { bombs: player?.data.bombs || 0, range: player?.data.range || 0 }
        update.bombs++

        let bomb_tile = this.get_tile()
        let tiles_to_brake = []

        for (let x = bomb_tile.x; x <= bomb_tile.x + this.data.range; x++) {
            let t = this.scene.map.map.getTileAt(x, bomb_tile.y)
            if (!t) break
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && t.index !== 1) {
                tiles_to_brake.push(t)
                break
            } else {
                if (this.scene.map.collisions.includes(t.oindex)) break
                if (this.scene.map.safe_spots.includes(t.oindex)) break
                tiles_to_brake.push(t)
            }
        }

        for (let x = bomb_tile.x - 1; x >= bomb_tile.x - this.data.range; x--) {
            let t = this.scene.map.map.getTileAt(x, bomb_tile.y)
            if (!t) break
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && t.index !== 1) {
                tiles_to_brake.push(t)
                break
            } else {
                if (this.scene.map.collisions.includes(t.oindex)) break
                if (this.scene.map.safe_spots.includes(t.oindex)) break
                tiles_to_brake.push(t)
            }
        }
        for (let y = bomb_tile.y + 1; y <= bomb_tile.y + this.data.range; y++) {
            let t = this.scene.map.map.getTileAt(bomb_tile.x, y)
            if (!t) break
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && t.index !== 1) {
                tiles_to_brake.push(t)
                break
            } else {
                if (this.scene.map.collisions.includes(t.oindex)) break
                if (this.scene.map.safe_spots.includes(t.oindex)) break
                tiles_to_brake.push(t)
            }
        }
        for (let y = bomb_tile.y - 1; y >= bomb_tile.y - this.data.range; y--) {
            let t = this.scene.map.map.getTileAt(bomb_tile.x, y)
            if (!t) break
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && t.index !== 1) {
                tiles_to_brake.push(t)
                break
            } else {
                if (this.scene.map.collisions.includes(t.oindex)) break
                if (this.scene.map.safe_spots.includes(t.oindex)) break
                tiles_to_brake.push(t)
            }
        }






        tiles_to_brake.map(t => {

            if (this.scene.map.brake_tile(t)) {
                update.bombs++
                update.range++
            }
            let flame = this.scene.add.particles(t.pixelX + (t.baseWidth / 2), t.pixelY + (t.baseHeight / 2), 'flares',
                {
                    frame: 'white',
                    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                    colorEase: 'quad.out',
                    lifespan: 500,
                    scale: { start: 0.70, end: 0, ease: 'sine.out' },
                    speed: 10,
                    advance: 500,
                    frequency: 50,
                    blendMode: 'ADD',
                    duration: 100,
                })
            this.scene.game_layer.add(flame)
        })
        if (player) player.set_data(update)
        this.delete()


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


