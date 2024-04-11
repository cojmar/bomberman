
export class TileMap {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/json/map_prop.json')
        scene.load.image('tiles', 'assets/img/map.png')
    }
    constructor(scene, data = {}) {
        this.scene = scene
        if (!scene.sys.game.tile_layer_data) scene.sys.game.tile_layer_data = Object.assign({}, scene.cache.tilemap.get('map').data.layers[0])

        this.collisions = [
            34, 20,// 20 = dark gray, 32 = dark blue
            // 136, // dark brown
            80, // yellow
            122,// light brown
            104, // purple,
            76,//light green
            62,//green

        ]
        this.safe_spots = [
            29, 30,// blue 
            100, 99,// purple,
            57, 58,//green,
            71, 72,//light green
        ]
        this.spawn_spots = [
            [1, 1],
            [14, 11],
            [3, 11],
            [16, 3],
        ]

        // Replace tiles in this.map
        //this.map.putTileAt(57, 1, 1)
        //this.map.replaceByIndex(57, 29)       
        this.init_map(Object.assign(scene.sys.game.tile_layer_data, data || {}))
        this.def_map()
    }
    def_map() {
        //this.init_map(this.scene.sys.game.tile_layer_data)
        //this.set_map([1, 1, 1, [29, 0, 0]], 1)
        //this.reset_map()
    }
    init_map(data = {}) {
        let layer_data = this.scene.cache.tilemap.get('map').data.layers[0]
        if (data?.width) layer_data.width = data.width
        if (data?.height) layer_data.height = data.height
        this.scene.cache.tilemap.get('map').data.layers[0].data = Object.assign(Array(layer_data.width * layer_data.height).fill(1), data.data || [])
        this.map = this.scene.make.tilemap({ key: 'map', infinite: true })
        const tileset = this.map.addTilesetImage('tiles')
        if (this.scene.map_layer) this.scene.map_layer.destroy()
        this.scene.map_layer = this.map.createLayer('Tile Layer 1', tileset, 0, 0)
        this.scene.game_layer.add([this.scene.map_layer])
        this.map.setCollision(this.collisions)
        this.init_data = this.get_map().data
        this.update()
    }
    reset_map() {
        this.set_map(this.init_data)
    }
    set_map(data, fill = false) {
        if (typeof data !== 'object') data = [data]
        let width = this.map.layers[0].width
        let set_tile = (tile, index) => {
            if (typeof tile === 'object') this.map.putTileAt(...tile)
            else {
                let x = index % width
                let y = Math.floor(index / width)
                this.map.putTileAt(tile, x, y)
            }
        }
        if (fill) Array(this.map.layers[0].width * this.map.layers[0].height).fill(fill).map((tile, index) => set_tile(tile, index))
        data.forEach((tile, index) => set_tile(tile, index))
        this.update()
    }
    get_map() {
        let data = []
        this.map.layers[0].data.map(t => t.map(t2 => data.push(t2.index)))

        return {
            width: this.map.layers[0].width,
            height: this.map.layers[0].height,
            data
        }
    }
    update() {
        this.scene.net.send_cmd('set_data', { map_data: this.get_map() })
    }
}