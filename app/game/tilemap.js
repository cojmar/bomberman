export class TileMap {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/json/map_prop.json')
        scene.load.image('tiles', 'assets/img/map.png')
    }
    static init_map(scene) {
        const map = scene.make.tilemap({ key: 'map' })
        const tileset = map.addTilesetImage('tiles')
        scene.colision_layer = map.createLayer('Tile Layer 1', tileset, 0, 0)

        scene.game_layer.add([scene.colision_layer])

        map.setCollision([34, 20]) // 20 = dark gray, 32 = dark blue
        // map.setCollision([ 136 ]) // dark brown
        // map.setCollision([ 80 ]) // yellow
        // map.setCollision([ 122 ]) // light brown
    }
}