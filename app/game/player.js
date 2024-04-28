import { GameObject } from "./game_object.js"
export class Player extends GameObject {
    static {
        this.img_data = ['player', 'assets/img/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        }]
    }
    create() {
        this.body.setSize(20, 30, true)
        this.body.setOffset(6, 18)
        this.setScale(0.58)
    }
    explode() {
        this.action_respawn()
        setTimeout(() => this.set_data({ bombs: 1, range: 1 }))
    }
    init_anims() {
        if (!this.scene.anims.anims.entries['player_left']) this.scene.anims.create({
            key: 'player_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })

        if (!this.scene.anims.anims.entries['player_turn']) this.scene.anims.create({
            key: 'player_turn',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        })

        if (!this.scene.anims.anims.entries['player_right']) this.scene.anims.create({
            key: 'player_right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        })
    }
    map_collision(tile) {
        return false
        let tile_broken = this.scene.map.brake_tile(tile)

        if (this.uid === this.scene.sys.game.net.me.info.user && tile_broken) this.scene.bombs++

    }

    action_respawn() {
        if (this.uid !== this.scene.net.me.info.user) return false
        this.scene.spawn_player(true)
    }

    action_bomb(user) {
        if (this.uid !== this.scene.net.me.info.user) return false
        if (this.uid !== this.scene.sys.game.net.me.info.user) return false
        let tc = JSON.stringify(this.get_tile_center())
        let ok = true

        Object.values(this.scene.world_data).map(wd => {
            if (JSON.stringify(this.scene.game_objects.get(wd[1]).get_tile_center()) === tc) ok = false
        })

        if (!ok) return false
        if (this.data.bombs <= 0) return false
        this.set_data({ bombs: this.data.bombs - 1 })


        let n = this.time()
        let oid = `${this.uid}-bomb-${n}`
        //if (this.scene.world_data[oid]) return false
        this.scene.set_object('Bomb', oid, Object.assign({ player: this.uid, direction: this.data.direction, time: 5, range: this.data.range, speed: 100 }, this.get_tile_center()))
        this.get_tile().setTint(0xff0000)
    }

    render() {
        let direction = this.data.direction
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {

            let tile = this.get_tile()
            if (this.safe_spots.indexOf(tile.oindex) !== -1) return

            if (obj1.x > obj2.x) direction = direction.replace('l', '')
            else direction = direction.replace('r', '')

            if (obj1.y > obj2.y) direction = direction.replace('u', '')
            else direction = direction.replace('d', '')

            this.data.direction = direction
        })

        if (this.data.direction.indexOf('l') !== -1) this.anims.play('player_left', true)
        else if (this.data.direction.indexOf('r') !== -1) this.anims.play('player_right', true)
        else this.anims.play('player_turn', true)
    }
}


