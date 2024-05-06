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
    info() {

        if (!this.scene) return []

        return [
            `BOMB ${this.uid.split('-').pop()}`,
            `USER ${this?.ndata?.player.split('-').pop() || ''}`,
            ``,
            `Time ${Math.trunc(((this.ndata.time * 1000) - this.time()) / 1000) + 1 || 0}`,
            `Range ${this?.ndata?.bomb_range || 0}`,
            `Speed ${this?.ndata?.speed || 0}`,
        ]

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
        this.text = this.scene.add.text(this.x, this.y, '5', { font: '17px monospace', fill: '#010e1b', fontStyle: 'bold', align: 'center', strokeThickness: 3, stroke: '#ffffff' }).setOrigin(0.5, 0.5)
        this.scene.game_layer.add(this.text)
        if (!this.ndata.time) this.ndata.time = 0
        //save player deaths that he had at creation so at explosion if he died don't give him candy
        this.p_deaths = this.scene.game_objects.get(this.ndata.player)?.ndata?.deaths || 0

        //tween
        this.tween = this.scene.tweens.add({
            targets: [this],
            duration: 500,
            scale: 1.15,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout'
        })

        //particles
        this.emitter = this.scene.add.particles(this.x, this.y, 'flares', {
            frame: 'white',
            // color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
            colorEase: 'quad.out',
            lifespan: 500,
            scale: { start: 0.70, end: 0, ease: 'sine.out' },
            speed: 100,
            advance: 500,
            frequency: 50,
            blendMode: 'ADD',
            duration: 1000,
            alpha: 0.5,
        })

        this.emitter.on('complete', () => this.emitter.start())
        this.scene.game_layer.add(this.emitter)
    }
    update_text() {
        this.text.depth = this.depth + 1
        this.text.setPosition(this.x + this.body.velocity.x / 50, this.y + this.body.velocity.y / 50)
        let new_text = `${Math.trunc(((this.ndata.time * 1000) - this.time()) / 1000) + 1}`
        if (this.text.text !== new_text) this.text.text = new_text

    }
    on_destroy() {
        if (this.tween) this.tween.remove()
        if (this.emitter) this.emitter.destroy()
        this.text.destroy()
    }
    explode(uid) {
        if (this.done) return false
        if (!uid) uid = this.ndata.player
        this.visible = false
        this.text.visible = false
        this.done = true
        this.emitter.destroy()
        let player = this.scene.game_objects.get(this.ndata.player)
        let update = { bombs: 1, bomb_range: 0, broken_tiles: 0 }

        let bomb_tile = this.get_tile()
        let tiles_to_brake = [bomb_tile]

        for (let x = bomb_tile.x + 1; x <= bomb_tile.x + this.ndata.bomb_range; x++) {
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

        for (let x = bomb_tile.x - 1; x >= bomb_tile.x - this.ndata.bomb_range; x--) {
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
        for (let y = bomb_tile.y + 1; y <= bomb_tile.y + this.ndata.bomb_range; y++) {
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
        for (let y = bomb_tile.y - 1; y >= bomb_tile.y - this.ndata.bomb_range; y--) {
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

        let flame = this.scene.add.particles(bomb_tile.pixelX + (bomb_tile.baseWidth / 2), bomb_tile.pixelY + (bomb_tile.baseHeight / 2), 'flares',
            {
                frame: 'white',
                // color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
                colorEase: 'quad.out',
                lifespan: 500,
                scale: { start: 0.70, end: 0, ease: 'sine.out' },
                speed: 10,
                advance: 500,
                frequency: 500,
                blendMode: 'ADD',
                duration: 100,
            })
        this.scene.game_layer.add(flame)
        flame.once("complete", () => {
            flame.destroy()
            this.delete()
        })

        let obj_hit = tiles_to_brake.reduce((r, t) => {
            this.scene.game_objects.forEach(obj => {
                if (obj.uid === this.uid) return r
                let tile = obj.get_tile()
                if (!tile) return r
                if (tile.x === t.x && tile.y === t.y && !this.scene.map.safe_spots.includes(t.oindex)) r.push(obj)
            })
            if (this.scene.map.brake_tile(t)) {
                update.broken_tiles++
                this.scene.set_object('Surprise', `s-${this.uid}`, { x: t.pixelX + (t.baseWidth / 2), y: t.pixelY + (t.baseHeight / 2) })
                //update.bombs++
                //update.bomb_range++
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

        obj_hit.map(obj => (obj.visible && typeof obj.explode === 'function') ? obj.explode(uid) : false)

        if (player) {
            update.bombs += player.ndata.bombs
            update.bomb_range += player.ndata.bomb_range
            update.broken_tiles += player.ndata.broken_tiles

            if (player.ndata.deaths === this.p_deaths) player.set_data(update)
        }
    }
    render() {
        this.update_text()
        this.emitter.x = this.x
        this.emitter.y = this.y
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


