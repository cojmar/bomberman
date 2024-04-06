import { Player } from './player.js';

class Main extends Phaser.Scene {

    player;

    preload() {
        Player.preload(this)
        this.load.tilemapTiledJSON('map', 'assets/json/map_prop.json');
        this.load.image('tiles', 'assets/img/map.png')
        this.load.image('ball', 'assets/img/ball.png')
    }

    init_screen() {
        if (this.init_screen_timeout) clearTimeout(this.init_screen_timeout)
        this.init_screen_timeout = setTimeout(() => {
            this.sys.game.scale.resize(window.innerWidth, window.innerHeight)
            if (this.game_camera) this.game_camera.setViewport(this.game_padding[0], this.game_padding[1], window.innerWidth - this.game_padding[0] - this.game_padding[2], window.innerHeight - this.game_padding[1] - this.game_padding[3])
            this.init_ui()
        }, 10)
    }
    create() {
        this.game_padding = [220, 10, 10, 10, 3]
        this.ui_colors = [0x525151, 0x2b2b2b, 0xd1cdcd]
        this.sys.game.resize = () => this.init_screen()

        this.players = new Map()
        this.game_camera = false

        this.ui_layer = this.add.layer().setInteractive()
        this.game_layer = this.add.layer()
        this.forground_layer = this.add.layer()

        this.init_map()
        this.init_cameras()
        this.init_cursors()

        this.player = this.set_player()
        this.set_player({ uid: 2 })
        if (this.game_camera) this.game_camera.startFollow(this.player)


        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setTint(0xff0000)
        })

        this.input.on('gameobjectout', (pointer, gameObject) => {
            gameObject.clearTint()
        })

        // this.physics.add.collider(player, layer, () => {
        //     console.log('colliding');
        // });

        // this.physics.add.overlap(player, layer, () => {
        //     console.log('overlapping');
        // });

        this.init_screen()
    }
    init_cursors() {
        // Arrows
        this.cursors = [this.input.keyboard.createCursorKeys()]
        // WASD
        this.cursors.push({
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        })
    }
    init_cameras() {
        //main camera
        this.cameras.main.setBackgroundColor(this.ui_colors[0])
        if (this.game_layer) this.cameras.main.ignore(this.game_layer)

        //minimap
        const minimap = this.cameras.add(- 35, -30, 240, 200)
        minimap.zoom = 0.3
        minimap.centerToSize()
        if (this.ui_layer) minimap.ignore(this.ui_layer)
        if (this.forground_layer) minimap.ignore(this.forground_layer)

        //game camera
        this.game_camera = this.cameras.add(200, 0)
        this.game_camera.zoom = 2
        this.game_camera.setBackgroundColor(this.ui_colors[1])
        if (this.ui_layer) this.game_camera.ignore(this.ui_layer)
        if (this.forground_layer) this.game_camera.ignore(this.forground_layer)

        //forground camera
        this.forground_cam = this.cameras.add()
        if (this.ui_layer) this.forground_cam.ignore(this.ui_layer)
        if (this.game_layer) this.forground_cam.ignore(this.game_layer)

        // drag

        const camera = this.game_camera;
        let cameraDragStartX;
        let cameraDragStartY;

        this.input.on('pointerdown', (pointer) => {
            if (pointer.downX > this.game_padding[0] + this.game_padding[4] * 2 && pointer.downX < (this.game_padding[0] + this.game_padding[4] * 2) + 20
                &&
                pointer.downY > this.game_padding[1] + this.game_padding[4] * 2 && pointer.downY < (this.game_padding[1] + this.game_padding[4] * 2) + 20
            ) {
                this.game_padding[0] = (this.game_padding[0] === 10) ? 220 : 10
                this.init_screen()
            }
            else if (pointer.downX > this.game_padding[0] &&
                pointer.downY > this.game_padding[1] &&
                pointer.downX < window.innerWidth - this.game_padding[2] &&
                pointer.downY < window.innerHeight - this.game_padding[3]
            ) {
                this.game_camera.stopFollow()
                cameraDragStartX = camera.scrollX;
                cameraDragStartY = camera.scrollY;
            }
        })

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                if (pointer.downX < this.game_padding[0]) return
                if (pointer.downY < this.game_padding[1]) return
                if (pointer.downX > window.innerWidth - this.game_padding[2]) return
                if (pointer.downY > window.innerHeight - this.game_padding[3]) return
                camera.scrollX = cameraDragStartX + (pointer.downX - pointer.x) / camera.zoom
                camera.scrollY = cameraDragStartY + (pointer.downY - pointer.y) / camera.zoom
            }
        })

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.x < this.game_padding[0]) return
            if (pointer.y < this.game_padding[1]) return
            if (pointer.x > window.innerWidth - this.game_padding[2]) return
            if (pointer.y > window.innerHeight - this.game_padding[3]) return
            // Get the current world point under pointer.
            const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
            const newZoom = camera.zoom - camera.zoom * 0.001 * deltaY;
            camera.zoom = Phaser.Math.Clamp(newZoom, 0.15, 2);

            // Update camera matrix, so `getWorldPoint` returns zoom-adjusted coordinates.
            camera.preRender();
            const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y);
            // Scroll the camera to keep the pointer under the same world point.
            camera.scrollX -= newWorldPoint.x - worldPoint.x;
            camera.scrollY -= newWorldPoint.y - worldPoint.y;
        });
    }
    init_map() {
        const map = this.make.tilemap({ key: 'map' })
        const tileset = map.addTilesetImage('tiles')
        this.colision_layer = map.createLayer('Tile Layer 1', tileset, 0, 0)

        this.game_layer.add([this.colision_layer])

        map.setCollision([34, 20]) // 20 = dark gray, 32 = dark blue
        // map.setCollision([ 136 ]); // dark brown
        // map.setCollision([ 80 ]); // yellow
        // map.setCollision([ 122 ]); // light brown
    }
    init_ui() {
        //game camera border
        if (this.ui_layer.cam_border) this.ui_layer.cam_border.destroy()
        this.ui_layer.cam_border = this.add.graphics({ fillStyle: { color: this.ui_colors[2] } })
        this.ui_layer.cam_border.fillRectShape(new Phaser.Geom.Rectangle(this.game_padding[0] - this.game_padding[4], this.game_padding[1] - this.game_padding[4], window.innerWidth - this.game_padding[0] - this.game_padding[2] + (this.game_padding[4] * 2), window.innerHeight - this.game_padding[1] - this.game_padding[3] + (this.game_padding[4] * 2)))
        this.ui_layer.add([this.ui_layer.cam_border])


        //game but1
        if (this.forground_layer.but1) this.forground_layer.but1.destroy()
        this.forground_layer.but1 = this.add.graphics({ fillStyle: { color: this.ui_colors[2] } })
        this.forground_layer.but1.fillRectShape(new Phaser.Geom.Rectangle(this.game_padding[0] + this.game_padding[4] * 2, this.game_padding[1] + this.game_padding[4] * 2, 20, 20))
        this.forground_layer.add([this.forground_layer.but1])

        //fixed stuff 
        if (!this.ui_layer.fixed_ui) {
            this.ui_layer.fixed_ui = this.add.graphics({ fillStyle: { color: this.ui_colors[2] } })
            this.ui_layer.fixed_ui2 = this.add.graphics({ fillStyle: { color: this.ui_colors[1] } })
            this.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(9, 8, 200, 152))
            this.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(200, 90, 50, 25))

            this.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(9, 168, 200, 60))
            this.ui_layer.fixed_ui2.fillRectShape(new Phaser.Geom.Rectangle(13, 172, 192, 52))
            this.ui_layer.fixed_ui.fillRectShape(new Phaser.Geom.Rectangle(200, 185, 50, 25))

            this.ui_layer.add([this.ui_layer.fixed_ui, this.ui_layer.fixed_ui2])
        }

    }


    set_player(data) {
        if (!data) data = {}
        let uid = data?.uid || 'default'
        let player = false

        if (!this.players.has(uid)) {
            player = new Player(this)
            player.set_data({ x: 48, y: 48 })
            this.players.set(uid, player)
            this.physics.add.collider(player, this.colision_layer)
            if (this.game_layer) this.game_layer.add(player)
            this.players.set(uid, player)
        }
        else player = this.players.get(uid)

        player.set_data(data)
        return player
    }

    update(time, delta) {
        // calculate movment direction
        let direction = ""
        if (this.cursors.reduce((r, c) => {
            if (!r) r = (c.left.isDown)
            return r
        }, false)) direction = "l"
        else if (this.cursors.reduce((r, c) => {
            if (!r) r = (c.right.isDown)
            return r
        }, false)) direction = "r"

        if (this.cursors.reduce((r, c) => {
            if (!r) r = (c.up.isDown)
            return r
        }, false)) direction += "u"
        else if (this.cursors.reduce((r, c) => {
            if (!r) r = (c.down.isDown)
            return r
        }, false)) direction += "d"

        // send direction
        if (direction !== this.player.data.direction) {
            this.player.set_data({ direction })
            if (this.game_camera) this.game_camera.startFollow(this.player)
        }

        this.players.forEach(async player => player.update())
    }

}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: window,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            // debug: true // Show hitboxes
        }
    },
    scene: Main
};

const game = new Phaser.Game(config);
window.addEventListener("resize", () => game.resize())
