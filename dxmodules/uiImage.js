//build：20240311
// image control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let image = {}

image.build = function (id, parent) {
    let temp = utils.validateBuild(image.all, id, parent, 'image')
    let my = {type: 'image'}
    my.obj = new utils.GG.NativeImage({ uid: id }, temp)
    my.id = id
    /**
     * Set the source of image or get/obtain source
     * @param {string} path is not required, the absolute path of the image file. If it is not filled in or is not of string type, it will be get/obtain.
     */
    my.source = function (path) {
        if (utils.validateString(path)) {
            this.obj.lvImgSetSrc(path)
        } else {
            return this.obj.lvImgGetSrc()
        }
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default image;