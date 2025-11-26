//build：20240311
// line control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let line = {}

line.build = function (id, parent) {
    let temp = utils.validateBuild(line.all, id, parent, 'line')
    let my = {type: 'line'}
    my.obj = new utils.GG.NativeLine({ uid: id }, temp)
    my.id = id
    /**
     * Set the coordinates of all points of the line
     * @param {Array} points required, an array composed of all points, such as [[x1,y1],[x2,y2]]
     * @param {number} count required, the number of points to be drawn. Note that this value can be less than the length of points.
     */
    my.setPoints = function (points, count) {
        this.obj.lvLineSetPoints(points, count)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default line;