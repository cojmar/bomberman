export class UI {
    constructor(scene) {
        this.scene = scene
        this.scene.game_padding = [220, 10, 10, 10, 3]
        this.scene.ui_colors = [0x525151, 0x2b2b2b, 0xd1cdcd]


        this.scene.ui_layer = this.scene.add.layer().setInteractive()
        this.scene.game_layer = this.scene.add.layer()
        this.scene.forground_layer = this.scene.add.layer()




        this.init_cameras()
        this.init_cursors()
        this.init_screen()
    }

    init_screen() {
        if (this.scene.init_screen_timeout) clearTimeout(this.scene.init_screen_timeout)
        this.scene.init_screen_timeout = setTimeout(() => {
            this.scene.sys.game.scale.resize(window.innerWidth, window.innerHeight)
            if (this.scene.game_camera) this.scene.game_camera.setViewport(this.scene.game_padding[0], this.scene.game_padding[1], window.innerWidth - this.scene.game_padding[0] - this.scene.game_padding[2], window.innerHeight - this.scene.game_padding[1] - this.scene.game_padding[3])
            this.init_ui()
        }, 10)
    }
    init_cursors() {
        // Arrows
        this.scene.cursors = [this.scene.input.keyboard.createCursorKeys()]
        // WASD
        this.scene.cursors.push({
            up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        })
        this.scene.input.keyboard.on('keyup-' + 'SPACE', (event) => {
            console.log('sp')
        })
    }
    init_cameras() {
        //main camera
        this.scene.cameras.main.setBackgroundColor(this.scene.ui_colors[0])
        if (this.scene.game_layer) this.scene.cameras.main.ignore(this.scene.game_layer)

        //minimap
        const minimap = this.scene.cameras.add(- 35, -30, 240, 200)
        minimap.zoom = 0.3
        minimap.centerToSize()
        if (this.scene.ui_layer) minimap.ignore(this.scene.ui_layer)
        if (this.scene.forground_layer) minimap.ignore(this.scene.forground_layer)

        //game camera
        this.scene.game_camera = this.scene.cameras.add(200, 0)
        this.scene.game_camera.zoom = 2
        this.scene.game_camera.setBackgroundColor(this.scene.ui_colors[1])
        if (this.scene.ui_layer) this.scene.game_camera.ignore(this.scene.ui_layer)
        if (this.scene.forground_layer) this.scene.game_camera.ignore(this.scene.forground_layer)

        //forground camera
        this.scene.forground_cam = this.scene.cameras.add()
        if (this.scene.ui_layer) this.scene.forground_cam.ignore(this.scene.ui_layer)
        if (this.scene.game_layer) this.scene.forground_cam.ignore(this.scene.game_layer)

        // drag

        const camera = this.scene.game_camera
        let cameraDragStartX
        let cameraDragStartY

        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.downX > this.scene.game_padding[0] + this.scene.game_padding[4] * 2 && pointer.downX < (this.scene.game_padding[0] + this.scene.game_padding[4] * 2) + 20
                &&
                pointer.downY > this.scene.game_padding[1] + this.scene.game_padding[4] * 2 && pointer.downY < (this.scene.game_padding[1] + this.scene.game_padding[4] * 2) + 20
            ) {
                this.scene.game_padding[0] = (this.scene.game_padding[0] === 10) ? 220 : 10
                this.init_screen()
            }
            else if (pointer.downX > this.scene.game_padding[0] &&
                pointer.downY > this.scene.game_padding[1] &&
                pointer.downX < window.innerWidth - this.scene.game_padding[2] &&
                pointer.downY < window.innerHeight - this.scene.game_padding[3]
            ) {
                this.scene.game_camera.stopFollow()
                cameraDragStartX = camera.scrollX
                cameraDragStartY = camera.scrollY
            }
        })

        this.scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                if (pointer.downX < this.scene.game_padding[0]) return
                if (pointer.downY < this.scene.game_padding[1]) return
                if (pointer.downX > window.innerWidth - this.scene.game_padding[2]) return
                if (pointer.downY > window.innerHeight - this.scene.game_padding[3]) return
                camera.scrollX = cameraDragStartX + (pointer.downX - pointer.x) / camera.zoom
                camera.scrollY = cameraDragStartY + (pointer.downY - pointer.y) / camera.zoom
            }
        })

        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.x < this.scene.game_padding[0]) return
            if (pointer.y < this.scene.game_padding[1]) return
            if (pointer.x > window.innerWidth - this.scene.game_padding[2]) return
            if (pointer.y > window.innerHeight - this.scene.game_padding[3]) return
            // Get the current world point under pointer.
            const worldPoint = camera.getWorldPoint(pointer.x, pointer.y)
            const newZoom = camera.zoom - camera.zoom * 0.001 * deltaY
            camera.zoom = Phaser.Math.Clamp(newZoom, 0.15, 2)

            // Update camera matrix, so `getWorldPoint` returns zoom-adjusted coordinates.
            camera.preRender()
            const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y)
            // Scroll the camera to keep the pointer under the same world point.
            camera.scrollX -= newWorldPoint.x - worldPoint.x
            camera.scrollY -= newWorldPoint.y - worldPoint.y
        })
    }
    init_ui() {



        //game camera border
        if (this.scene.ui_layer.cam_border) this.scene.ui_layer.cam_border.destroy()
        this.scene.ui_layer.cam_border = this.scene.add.graphics({ fillStyle: { color: this.scene.ui_colors[2] } })
        this.scene.ui_layer.cam_border.fillRectShape(new Phaser.Geom.Rectangle(this.scene.game_padding[0] - this.scene.game_padding[4], this.scene.game_padding[1] - this.scene.game_padding[4], window.innerWidth - this.scene.game_padding[0] - this.scene.game_padding[2] + (this.scene.game_padding[4] * 2), window.innerHeight - this.scene.game_padding[1] - this.scene.game_padding[3] + (this.scene.game_padding[4] * 2)))
        this.scene.ui_layer.add([this.scene.ui_layer.cam_border])


        //game but1
        if (this.scene.forground_layer.but1) this.scene.forground_layer.but1.destroy()
        this.scene.forground_layer.but1 = this.scene.add.graphics({ fillStyle: { color: this.scene.ui_colors[2] } })
        this.scene.forground_layer.but1.fillRectShape(new Phaser.Geom.Rectangle(this.scene.game_padding[0] + this.scene.game_padding[4] * 2, this.scene.game_padding[1] + this.scene.game_padding[4] * 2, 20, 20))
        this.scene.forground_layer.add([this.scene.forground_layer.but1])

        //fixed stuff 
        if (!this.scene.ui_layer.fixed_ui) {
            this.scene.ui_layer.fixed_ui = this.scene.add.graphics({ fillStyle: { color: this.scene.ui_colors[2] } })
            this.scene.ui_layer.fixed_ui2 = this.scene.add.graphics({ fillStyle: { color: this.scene.ui_colors[1] } })
            this.scene.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(9, 8, 200, 152))
            this.scene.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(200, 90, 50, 25))

            this.scene.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(9, 168, 200, 60))
            this.scene.ui_layer.fixed_ui2.fillRectShape(new Phaser.Geom.Rectangle(13, 172, 192, 52))
            this.scene.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(200, 185, 50, 25))

            this.scene.ui_layer.add([this.scene.ui_layer.fixed_ui, this.scene.ui_layer.fixed_ui2])

        }
        // text zone
        if (this.scene.ui_text) this.scene.ui_text.destroy()
        this.scene.ui_text = this.scene.add.text(10, 178, '', { font: '20px monospace', fill: '#d1cdcd' })

        this.scene.ui_layer.add([this.scene.ui_text])


    }
}