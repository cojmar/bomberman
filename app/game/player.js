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
        this.init_score = 181

    }
    info() {
        if (!this.scene) return []
        let tile = this.get_tile()
        return [
            `User ${this?.scene?.net.room.users[this.uid]?.info.user.split('-').pop() || 'LEFT'}`,
            `Wins ${this?.ndata?.wins || 0}`,
            `Score ${this?.get_score() || 0}/${this.scene.get_max_score()}`,
            `Top ${this?.get_ladder().shift()}/${Object.keys(this.scene.net.room.users).length}`,
            ``,
            `Kills ${this?.ndata?.kills || 0}`,
            `Deaths ${this?.ndata?.deaths || 0}`,
            `Move Speed ${this?.ndata?.speed || 0}`,
            `Broken Tiles ${this?.ndata?.broken_tiles || 0}`,
            `X:${tile?.x || 0} Y:${tile?.y || 0}`,
            ``,
            `Bombs ${this?.ndata?.bombs || 0}`,
            `Bomb Range ${this?.ndata?.bomb_range || 0}`,
            `Bomb Time ${this?.ndata?.bomb_time || 0}`,
            `Bomb Speed ${this?.ndata?.bomb_speed || 0}`,
        ]
    }
    explode(uid) {
        let killer = (uid !== this.uid) ? this.scene.game_objects.get(uid) : false
        if (killer) killer.set_data({ kills: killer.ndata.kills + 1 })

        this.set_data({ visible: false })
        setTimeout(() => {
            this.set_data({ bombs: 1, bomb_range: 1, deaths: this.ndata.deaths + (uid) ? 1 : 0 })
            this.action_respawn()
        }, 500)
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
        if (!this.scene.cheats) return false
        let tile_broken = this.scene.map.brake_tile(tile)
        if (tile_broken) this.set_data({ broken_tiles: this.ndata.broken_tiles + 1 })

    }

    action_respawn() {
        if (this.scene.game_done) return false
        if (this.uid !== this.scene.net.me.info.user) return false
        this.set_data({ visible: true })
        this.scene.spawn_player(true)
    }
    get_score() {
        let score = Array.from(['speed', 'bomb_speed', 'bomb_range', 'kills', 'broken_tiles']).reduce((r, k) => r + this.ndata[k], 0)
        return score - this?.init_score || 0
    }
    get_ladder() {
        let players = []
        this.scene?.game_objects.forEach(obj => (obj.constructor.name === 'Player') ? players.push({ uid: obj.uid, score: obj.get_score() }) : false)
        players.sort((a, b) => b.score - a.score)
        return [players.findIndex(v => v.uid === this.uid) + 1, players.length, players[0]?.score || 0]
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
        if (this.ndata.bombs <= 0) return false
        this.set_data({ bombs: this.ndata.bombs - 1 })


        let n = this.time()
        let oid = `${this.uid}-bomb-${n}`

        let bomb = this.scene.set_object('Bomb', oid, Object.assign({ player: this.uid, direction: this.ndata.direction, time: this.ndata.bomb_time, bomb_range: this.ndata.bomb_range, speed: this.ndata.bomb_speed }, this.get_tile_center()))
        //this.scene.obj_to_display = bomb

    }

    render() {
        if (this.ndata.direction.indexOf('l') !== -1) this.anims.play('player_left', true)
        else if (this.ndata.direction.indexOf('r') !== -1) this.anims.play('player_right', true)
        else this.anims.play('player_turn', true)

        let direction = this.ndata.direction
        this.scene.physics.world.collide(this, this.scene.collision_layer, (obj1, obj2) => {
            if (!obj2.visible) return
            if (obj2.constructor.name === 'Bomb' && !obj2.moved) return false

            let tile = this.get_tile()
            if (this.safe_spots.indexOf(tile.oindex) !== -1) return

            if (obj1.x > obj2.x) direction = direction.replace('l', '')
            else direction = direction.replace('r', '')

            if (obj1.y > obj2.y) direction = direction.replace('u', '')
            else direction = direction.replace('d', '')

            this.ndata.direction = direction
        })


    }
}


