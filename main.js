class Main extends Phaser.Scene {
    cursors;
    player;

    preload() {
        this.load.tilemapTiledJSON('map', 'assets/json/map_prop.json');
        this.load.image('tiles', 'assets/img/map.png');
        this.load.image('ball', 'assets/img/ball.png');
        this.load.spritesheet('dude', 'assets/img/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('tiles');
        const layer = map.createLayer('Tile Layer 1', tileset, 0, 0);



        map.setCollision([34, 20]); // 20 = dark gray, 32 = dark blue

        // map.setCollision([ 136 ]); // dark brown
        // map.setCollision([ 80 ]); // yellow
        // map.setCollision([ 122 ]); // light brown

        this.player = this.physics.add.sprite(48, 48, 'dude').setScale(0.58);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.physics.add.collider(this.player, layer);


        this.cameras.main.startFollow(this.player, false, 25, 25)
        this.cameras.main.zoom = 2
        const minimap = this.cameras.add(-106, -84, 430, 340);
        minimap.zoom = 0.5

        // this.physics.add.collider(player, layer, () => {
        //     console.log('colliding');
        // });

        // this.physics.add.overlap(player, layer, () => {
        //     console.log('overlapping');
        // });

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update(time, delta) {
        this.player.setVelocity(0);


        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-100);
            this.player.anims.play('left', true);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(100);
            this.player.anims.play('right', true);
        }
        else {
            this.player.anims.play('turn');
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-100);
            this.player.anims.play('turn');
        }
        else if (this.cursors.down.isDown) {
            this.player.setVelocityY(100);
            this.player.anims.play('turn');
        }
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
            gravity: { y: 0 }
        }
    },
    scene: Main
};

const game = new Phaser.Game(config);
window.addEventListener("resize", () => game.scale.resize(window.innerWidth, window.innerHeight))
