
export class TileMap {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/json/map_prop.json')
        scene.load.image('tiles', 'assets/img/map.png')
    }
    constructor(scene, data = {}) {
        this.scene = scene
        if (!scene.sys.game.tile_layer_data) scene.sys.game.tile_layer_data = Object.assign({}, scene.cache.tilemap.get('map').data.layers[0])
        this.collisions = []
        this.safe_spots = []
        this.brakeable_tiles = []
        this.spawn_tiles = []
        scene.cache.tilemap.get('map').data.tilesets[0].tiles.map(t => {
            if (t?.properties) {
                let index = t.id + 1
                if (t.properties?.find(v => v.name === 'collision')?.value || false) this.collisions.push(index)
                if (t.properties?.find(v => v.name === 'breakable')?.value || false) this.brakeable_tiles.push(index)
                if (t.properties?.find(v => v.name === 'safe')?.value || false) this.safe_spots.push(index)
                if (t.properties?.find(v => v.name === 'spawn')?.value || false) {
                    this.spawn_tiles.push(index)
                    this.safe_spots.push(index)
                }
            }
        })
        this.init_map(this.def_map())
        this.set_map(data || {})
    }
    init_spawns() {
        this.spawn_spots =
            this.get_map().data.reduce((a, t, index) => (this.spawn_tiles.indexOf(t) !== -1) ? [...a, this.get_x_y(index)] : a, [])
    }
    brake_tile(tile) {
        if (!tile) tile = this.scene.player.get_tile()
        if (this.scene.map.brakeable_tiles.indexOf(tile.index) === -1) return false
        this.scene.map.set_map([[tile.index - 5, tile.x, tile.y]])
    }
    def_map() {
        return this.scene.sys.game.tile_layer_data
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
        this.init_spawns()
        this.update()
    }
    reset_map() {
        this.set_map(this.init_data, false, false)
    }
    get_x_y(index) {
        let width = this.map.layers[0].width
        let x = index % width
        let y = Math.floor(index / width)
        return [x, y]
    }
    set_map(data, fill = false, update = true) {
        if (typeof data !== 'object') data = [data]

        let set_tile = (tile, index) => {
            if (typeof tile === 'object') this.map.putTileAt(...tile)
            else this.map.putTileAt(tile, ...this.get_x_y(index))
        }
        if (fill) Array(this.map.layers[0].width * this.map.layers[0].height).fill(fill).map((tile, index) => set_tile(tile, index))
        if (Array.isArray(data)) data.forEach((tile, index) => set_tile(tile, index))
        if (update) this.update()
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
        clearTimeout(this.update_to)
        this.update_to = setTimeout(() => {
            if (this?.brakeable_tiles?.length) {
                let all_gone = true
                this.get_map().data.map(t => { if (this.brakeable_tiles.indexOf(t) !== -1) all_gone = false })
                if (all_gone) this.reset_map()
            }
            this.scene.net.send_cmd('set_data', { map_data: this.get_map() })
            this.init_spawns()
        })

    }
}