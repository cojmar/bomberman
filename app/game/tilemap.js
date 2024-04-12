
export class TileMap {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/json/map_prop.json')
        scene.load.image('tiles', 'assets/img/map.png')
        //scene.load.scenePlugin('AnimatedTiles', 'assets/js/AnimatedTiles.min.js', 'animatedTiles', 'animatedTiles');

    }
    constructor(scene, data = {}) {
        this.scene = scene
        if (!scene.sys.game.tile_layer_data) scene.sys.game.tile_layer_data = Object.assign({}, scene.cache.tilemap.get('map').data.layers[0])
        this.collisions = []
        this.safe_spots = []
        this.brakeable_tiles = []
        this.spawn_tiles = []
        this.animated_tiles = {}
        scene.cache.tilemap.get('map').data.tilesets[0].tiles.map(t => {
            if (t?.properties) {
                let index = t.id + 1
                if (t?.animation) this.animated_tiles[index] = { time: 0, frame: 0, frames: t.animation }
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
        if (this.scene.map.brakeable_tiles.indexOf(tile.oindex) === -1) return false

        this.scene.map.set_map([[tile.oindex - 5, tile.x, tile.y]])
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

        this.sync_data()

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
    set_map(data, fill = false, sync = true) {
        if (typeof data !== 'object') data = [data]

        let set_tile = (tile, index) => {
            let t = (typeof tile === 'object') ? this.map.putTileAt(...tile) : this.map.putTileAt(tile, ...this.get_x_y(index))
            t.oindex = t.index
            return t
        }
        if (fill) Array(this.map.layers[0].width * this.map.layers[0].height).fill(fill).map((tile, index) => set_tile(tile, index))
        if (Array.isArray(data)) data.forEach((tile, index) => set_tile(tile, index))
        if (sync) this.sync_data()
    }
    get_map() {
        let data = []
        this.map.layers[0].data.map(t => t.map(t2 => {
            if (!t2.oindex) t2.oindex = t2.index
            data.push(t2.oindex)
        }))

        return {
            width: this.map.layers[0].width,
            height: this.map.layers[0].height,
            data
        }
    }
    get_tiles_by_index(index) {
        return this.map.layers[0].data.reduce((a, t) => [...a, ...t.filter(v => v?.oindex == index)], [])
    }
    sync_data() {
        this.init_spawns()

        clearTimeout(this.update_to)
        this.update_to = setTimeout(() => {
            if (this?.brakeable_tiles?.length) {
                let all_gone = true
                this.get_map().data.map(t => { if (this.brakeable_tiles.indexOf(t) !== -1) all_gone = false })
                if (all_gone) this.reset_map()
            }
            if (!this.scene.idle) this.scene.net.send_cmd('set_data', { map_data: this.get_map() })
            //this.scene.animatedTiles.init(this.map)
        })

    }
    update(time, delta) {
        Object.keys(this.animated_tiles).map(index => {
            this.get_tiles_by_index(index).map(t => {
                if (!t.animation) {
                    t.animation = Object.assign({
                        play: (frame = 0, autoplay = false) => {
                            t.animation.autoplay = autoplay
                            t.animation.frame = frame
                            if (t.animation.frame >= t.animation.frames.length) t.animation.frame = 0
                            t.animation.playing = true
                        },
                        stop: () => {
                            t.animation.autoplay = false
                            t.animation.playing = false
                        },
                        update: (time, delta) => {
                            if (!t.animation.playing) return false
                            let frame = t.animation.frames[t.animation.frame]
                            if (time - t.animation.time < frame.duration) return false
                            t.animation.time = time
                            t.animation.frame++
                            if (t.animation.frame >= t.animation.frames.length) t.animation.frame = 0
                            frame = t.animation.frames[t.animation.frame]
                            t.index = frame.tileid + 1
                            if (t.animation.frame === t.animation.frames.length - 1 && !t.animation.autoplay) t.animation.stop()
                        }
                    }, this.animated_tiles[index])
                    let autoplay = t?.properties?.autoplay
                    if (autoplay) t.animation.play(0, autoplay)
                }
                t.animation.update(time, delta)
            })
        })
    }
}