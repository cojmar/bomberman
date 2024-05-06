import { GameObject } from "./game_object.js"
export class Surprise extends GameObject {
    static preload(scene) {
        scene.load.spritesheet(...this.img_data)
        scene.load.atlas('flares', 'assets/img/flares.png', 'assets/json/flares.json')
    }
    on_destroy() {
        if (this.tween) this.tween.remove()
        if (this.graphics) this.graphics.destroy()
        if (this.text) this.text.destroy()
    }
    explode(p, bomb) {
        if (bomb !== this?.ndata?.bomb) this.pick()
    }
    pick(player) {
        if (this.done) return
        this.done = true
        if (player && player.uid === this.scene.player.uid) {

            if (this?.ndata.stype === '💥') player.set_data({ bomb_range: player.ndata.bomb_range + 1 })
            else if (this?.ndata.stype === '💣') player.set_data({ bombs: player.ndata.bombs + 1 })
            else if (this?.ndata.stype === '💨') player.set_data({ bomb_speed: player.ndata.bomb_speed + 50 })
        }
        this.text.visible = false
        this.graphics.visible = false
        let t = this.get_tile()
        let flame = this.scene.add.particles(t.pixelX + (t.baseWidth / 2), t.pixelY + (t.baseHeight / 2), 'flares',
            {
                frame: 'blue',
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
        flame.once("complete", () => {
            flame.destroy()
            this.delete()
        })

    }
    info() {
        if (!this.scene) return []
        let desc = ''
        if (this?.ndata?.stype === '💥') desc = 'Bomb Range +1'
        else if (this?.ndata?.stype === '💣') desc = 'Bombs +1'
        else if (this?.ndata?.stype === '💨') desc = 'Bomb Speed +50'

        return [
            `POWER ${this.uid.split('-').pop()}`,
            `TYPE ${this?.ndata?.stype || ''}`,
            ``,
            desc

        ]
    }
    create() {
        this.setTexture()
        let center = 0
        this.graphics = this.scene.add.graphics({ fillStyle: { color: 0x000000 } })

        const circle = new Phaser.Geom.Circle(- center, - center, 10)
        this.graphics.fillCircleShape(circle)



        this.graphics.lineStyle(20, 0xffffff)

        this.graphics.beginPath()
        this.graphics.arc(- center, - center, 1, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(360), false, 0.001)
        this.graphics.strokePath()
        this.graphics.closePath()
        this.scene.game_layer.add(this.graphics)
        this.graphics.x = this.x + center
        this.graphics.y = this.y + center

        if (!this.ndata.stype) this.ndata.stype = this.random().pick(['💥', '💣', '💨'])
        //this.ndata.stype = '💨'


        this.text = this.scene.add.text(this.x + 0.5, this.y - 0.5, this.ndata.stype, { font: '12px monospace', fill: '#010e1b', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0.5)
        this.scene.game_layer.add(this.text)

        //tween
        this.tween = this.scene.tweens.add({
            targets: [this.graphics, this.text],
            duration: 500,
            scale: 1.15,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout'
        })
    }


}
