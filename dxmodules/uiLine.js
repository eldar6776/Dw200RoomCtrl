//build：20240311
//line kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let line = {}

line.build = function (id, parent) {
    let temp = utils.validateBuild(line.all, id, parent, 'line')
    let my = {type: 'line'}
    my.obj = new utils.GG.NativeLine({ uid: id }, temp)
    my.id = id
    /**
     * Postavlja koordinate svih tačaka linije
     * @param {Array} points Obavezno, niz svih tačaka, npr. [[x1,y1],[x2,y2]]
     * @param {number} count Obavezno, broj tačaka za crtanje. Napomena: ova vrijednost može biti manja od dužine niza 'points'.
     */
    my.setPoints = function (points, count) {
        this.obj.lvLineSetPoints(points, count)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default line;