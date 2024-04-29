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
        this.init_tile = JSON.stringify(this.get_tile_center())
        this.text = this.scene.add.text(this.x, this.y, '5', { font: '20px monospace', fill: '#000000', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0.5)
        this.scene.game_layer.add(this.text)
        this.text.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24).outerStrength = 4

    }
    update_text() {
        this.text.depth = this.depth + 1
        this.text.setPosition(this.x + this.body.velocity.x / 50, this.y + this.body.velocity.y / 50)
        this.text.text = Math.trunc(((this.data.time * 1000) - this.time()) / 1000) + 1

    }
    on_destroy() {

        this.text.destroy()
    }
    explode() {
        if (this.done) return false
        this.done = true

        let player = this.scene.game_objects.get(this.data.player)
        let update = { bombs: 0, range: 0, kills: 0 }
        update.bombs++

        let bomb_tile = this.get_tile()
        let tiles_to_brake = []

        for (let x = bomb_tile.x; x <= bomb_tile.x + this.data.range; x++) {
            let t = this.scene.map.map.getTileAt(x, bomb_tile.y)
            if (!t) break
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && !t.broken) {
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
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && !t.broken) {
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
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && !t.broken) {
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
            if (this.scene.map.brakeable_tiles.includes(t.oindex) && !t.broken) {
                tiles_to_brake.push(t)
                break
            } else {
                if (this.scene.map.collisions.includes(t.oindex)) break
                if (this.scene.map.safe_spots.includes(t.oindex)) break
                tiles_to_brake.push(t)
            }
        }

        let obj_hit = tiles_to_brake.reduce((r, t) => {
            this.scene.game_objects.forEach(obj => {
                if (obj.uid === this.uid) return r
                let tile = obj.get_tile()
                if (!tile) return r
                if (tile.x === t.x && tile.y === t.y) r.push(obj)
            })
            if (this.scene.map.brake_tile(t)) {
                update.bombs++
                update.range++
            }
            let flame = this.scene.add.particles(t.pixelX + (t.baseWidth / 2), t.pixelY + (t.baseHeight / 2), 'flares',
                {
                    frame: 'white',
                    // color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
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
            return r
        }, [])
        obj_hit.map(obj => {
            if (obj.constructor.name === 'Player' && this.data.player !== obj.uid) update.kills++
            if (typeof obj.explode === 'function') obj.explode()
        })
        if (player) {
            update.kills += player.data.kills
            update.bombs += player.data.bombs
            update.range += player.data.range
            player.set_data(update)
        }
        this.delete()
    }
    render() {
        this.update_text()
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            if (this.data.player === obj2.uid) {
                if (!this.last_colision) this.last_colision = this.time()
                if (this.time() - this.last_colision > 100 && !this.moved) this.moved = true
                this.last_colision = this.time()
                return
            }
            this.data.direction = ""
            this.set_data(this.get_tile_center())
        })
        if (this.time() > this.data.time * 1000) this.explode()
    }

}


