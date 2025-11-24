//build：20240311
//image kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let image = {}

image.build = function (id, parent) {
    let temp = utils.validateBuild(image.all, id, parent, 'image')
    let my = {type: 'image'}
    my.obj = new utils.GG.NativeImage({ uid: id }, temp)
    my.id = id
    /**
     * Postavlja izvor slike ili dobija izvor
     * @param {string} path Nije obavezno, apsolutna putanja do datoteke slike. Ako nije popunjeno ili nije tipa string, dobija se izvor.
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