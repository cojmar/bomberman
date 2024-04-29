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
        this.ndata.direction = ""
        this.set_data(this.get_tile_center())
        setTimeout(() => this.set_data(this.get_tile_center()))
        if (this.ndata.player === this.scene.net.me.info.user) this.scene.set_object('Bomb', this.uid, this.ndata)

    }

    create() {
        this.setTexture('bomb')
        this.body.setSize(20, 20, true)
        this.init_tile = JSON.stringify(this.get_tile_center())
        this.text = this.scene.add.text(this.x, this.y, '5', { font: '20px monospace', fill: '#000000', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0.5)
        this.scene.game_layer.add(this.text)
        this.text.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24).outerStrength = 4

        this.p_deaths = this.scene.game_objects.get(this.ndata.player)?.ndata?.deaths || 0

        let fx1 = this.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24)

        this.tween = this.scene.tweens.add({
            targets: [fx1, this],
            outerStrength: 2,
            duration: 500,
            scale: 1.15,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout'
        })

    }
    update_text() {
        this.text.depth = this.depth + 1
        this.text.setPosition(this.x + this.body.velocity.x / 50, this.y + this.body.velocity.y / 50)
        this.text.text = Math.trunc(((this.ndata.time * 1000) - this.time()) / 1000) + 1

    }
    on_destroy() {
        this.tween.remove()
        this.text.destroy()
    }
    explode() {
        if (this.done) return false
        this.done = true

        let player = this.scene.game_objects.get(this.ndata.player)
        let update = { bombs: 1, range: 0, kills: 0 }

        let bomb_tile = this.get_tile()
        let tiles_to_brake = []
        if (!this.scene.map.safe_spots.includes(bomb_tile.oindex)) tiles_to_brake.push(bomb_tile)


        for (let x = bomb_tile.x + 1; x <= bomb_tile.x + this.ndata.range; x++) {
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

        for (let x = bomb_tile.x - 1; x >= bomb_tile.x - this.ndata.range; x--) {
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
        for (let y = bomb_tile.y + 1; y <= bomb_tile.y + this.ndata.range; y++) {
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
        for (let y = bomb_tile.y - 1; y >= bomb_tile.y - this.ndata.range; y--) {
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
            flame.once("complete", () => flame.destroy())
            return r
        }, [])
        obj_hit.map(obj => {
            if (obj.constructor.name === 'Player' && this.ndata.player !== obj.uid) update.kills++
            if (typeof obj.explode === 'function') obj.explode()
        })
        if (player) {
            update.kills += player.ndata.kills
            update.bombs += player.ndata.bombs
            update.range += player.ndata.range

            if (player.ndata.deaths !== this.p_deaths) update = { kills: update.kills }
            player.set_data(update)
        }
        let t = this.get_tile()
        let flame = this.scene.add.particles(t.pixelX + (t.baseWidth / 2), t.pixelY + (t.baseHeight / 2), 'flares',
            {
                frame: (tiles_to_brake.length > 0) ? 'white' : 'blue',
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
        flame.once("complete", () => flame.destroy())
        this.delete()
    }
    render() {
        this.update_text()
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            if (this.ndata.player === obj2.uid) {
                if (!this.last_colision) this.last_colision = this.time()
                if (this.time() - this.last_colision > 100 && !this.moved) this.moved = true
                this.last_colision = this.time()
                return
            }
            this.ndata.direction = ""
            this.set_data(this.get_tile_center())
        })
        if (this.time() > this.ndata.time * 1000) this.explode()
    }

}


