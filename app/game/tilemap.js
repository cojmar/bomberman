export class TileMap {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/json/map_prop.json')
        scene.load.image('tiles', 'assets/img/map.png')
    }
    constructor(scene) {
        this.map = scene.make.tilemap({ key: 'map' })
        const tileset = this.map.addTilesetImage('tiles')
        if (scene.map_layer) scene.map_layer.destroy()
        scene.map_layer = this.map.createLayer('Tile Layer 1', tileset, 0, 0)
        scene.game_layer.add([scene.map_layer])
        this.collisions = [
            34, 20,// 20 = dark gray, 32 = dark blue
            136, // dark brown
            80, // yellow
            122,// light brown
            104, // purple,
            76,//light green
            62,//green

        ]
        this.safe_spots = [
            29, 30,// blue 
            100, 99,// purple,
            59, 57,//green,
            71, 72,//light green
        ]
        this.spawn_spots = [
            [1, 1],
            [14, 11],
            [3, 11],
            [16, 3],
        ]


        this.map.setCollision(this.collisions)


    }
}