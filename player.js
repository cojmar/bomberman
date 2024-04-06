export class Player extends Phaser.Physics.Arcade.Sprite {
    static preload(scene) {
        scene.load.spritesheet('player', 'assets/img/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        })
    }
    constructor(scene) {
        super(scene, 0, 0, 'player')
        scene.add.existing(this)
        scene.physics.add.existing(this)
        this.setScale(0.58)
        this.body.setSize(20, 30, true)
        this.body.setOffset(6, 18)
        this.data = {
            "uid": "",
            "name": "",
            "direction": "",
            "x": 0,
            "y": 0
        }
        this.init_anims(scene)
    }
    init_anims(scene) {
        if (!scene.anims.anims.entries['player_left']) scene.anims.create({
            key: 'player_left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })

        if (!scene.anims.anims.entries['player_turn']) scene.anims.create({
            key: 'player_turn',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        })

        if (!scene.anims.anims.entries['player_right']) scene.anims.create({
            key: 'player_right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        })
    }
    set_data(data) {
        if (typeof data !== "object") return false
        Object.keys(data).map(k => { this.data[k] = data[k] })
        if (data.x) this.x = data.x
        if (data.y) this.y = data.y
    }
    update() {

        if (this.data.direction.indexOf('l') !== -1) {
            this.setVelocityX(-100)
            this.anims.play('player_left', true)
        }
        else if (this.data.direction.indexOf('r') !== -1) {
            this.setVelocityX(100)
            this.anims.play('player_right', true)
        }
        else {
            this.setVelocityX(0)
            this.anims.play('player_turn', true)
        }

        if (this.data.direction.indexOf('u') !== -1) this.setVelocityY(-100)
        else if (this.data.direction.indexOf('d') !== -1) this.setVelocityY(100)
        else this.setVelocityY(0)

        this.depth = this.y + 20
    }
}


