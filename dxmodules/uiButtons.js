//build：20240314
// button group control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let buttons = {}

buttons.build = function (id, parent) {
    let temp = utils.validateBuild(buttons.all, id, parent, 'buttons')
    let my = {type: 'buttons'}
    my.obj = new utils.GG.NativeBtnmatrix({ uid: id }, temp)
    my.id = id
    /**
     * Set the data corresponding to the button group, which must be an array format. The example is as follows: representing three rows of buttons, a total of 12 buttons
     * ["1", "2", "3", "0", "\n",
     * "4", "5", "6", "Cancel", "\n",
     * "7", "8", "9", "Confirm", ""]
     * @param {array} d is not required. If it is not filled in or is not an object type, it is get/obtaindata.
     */
    my.data = function (d) {
        if (utils.validateObject(d)) {
            this.obj.lvBtnmatrixSetMap(d)
        } else {
            return this.obj.lvBtnmatrixGetMap()
        }
    }
    /**
     * Click any button in the button group and call selectedData to get/obtain the id and text of the clicked button.
     * Return example: {id:11,text:'Cancel'}
     */
    my.clickedButton = function () {
        let id = this.obj.lvBtnmatrixGetSelectedBtn();
        if (id == 0xFFFF) {
            // When clicking the button group boundary, an illegal value of 0xFFFF will appear, and empty will be returned.
            return { id: null, text: null }
        }
        let txt = this.obj.lvBtnmatrixGetBtnText(id);
        return { id: id, text: txt }
    }
    /**
     * Set the status/state of a specific button in the button group. You can change it to selected, unavailable, etc.
     * @param {number} id The index of the button, starting from 0 and going from left to right from top to bottom. It is also the id returned by clicking the button clickedButton.
     *  @@param {number} state Refer to dxui.Utils.BUTTONS_STATE
     */
    my.setState = function (id, state) {
        this.obj.lvBtnmatrixSetBtnCtrl(id, state)
    }
    /**
     *  清除按钮组里某一个特定按钮的已经设置好的status/state
     * @param {number} id The index of the button, starting from 0 and going from left to right from top to bottom. It is also the id returned by clicking the button clickedButton.
     * @param {number} state refer to dxui.Utils.BUTTONS_STATE
     */
    my.clearState = function (id, state) {
        this.obj.lvBtnmatrixClearBtnCtrl(id, state)
    }
    /**
     * Set the status/state of all buttons in the button group. You can change it to selected, unavailable, etc.
     * @param {number} state refer to dxui.Utils.BUTTONS_STATE
     */
    my.setAllState = function (state) {
        this.obj.lvBtnmatrixSetBtnCtrlAll(state)
    }
    /**
     * Clear the set status/state of all buttons in the button group
     * @param {number} state refer to dxui.Utils.BUTTONS_STATE
     */
    my.clearAllState = function (state) {
        this.obj.lvBtnmatrixClearBtnCtrlAll(state)
    }
    /**
     * Set how many spaces the button width of a certain ID occupies
     * @param {number} id button serial number, starting from 0
     * @param {number} width width spans the number of grids
     */
    my.setBtnWidth = function (id, width) {
        this.obj.lvBtnmatrixSetBtnWidth(id, width)
    }
    /**
     * Set the button icon of a certain id
     * @param {number} id button serial number, starting from 0
     * @param {string} src icon file path
     */
    my.setBtnIcon = function (id, src) {
        this.obj.addEventCb((e) => {
            // get/obtain draw control object
            let dsc = e.lvEventGetDrawPartDsc()
            // If you are drawing the id button
            if (dsc.type == utils.ENUM.LV_BTNMATRIX_DRAW_PART_BTN && dsc.id == id) {
                // get/obtain picture information
                let header = utils.GG.NativeDraw.lvImgDecoderGetInfo(src)
                // Define an area and display it in the center. Note: converting size to area requires -1, converting area to size requires +1
                let x1 = dsc.draw_area.x1 + (dsc.draw_area.x2 - dsc.draw_area.x1 + 1 - header.w) / 2;
                let y1 = dsc.draw_area.y1 + (dsc.draw_area.y2 - dsc.draw_area.y1 + 1 - header.h) / 2;
                let x2 = x1 + header.w - 1;
                let y2 = y1 + header.h - 1;
                let area = utils.GG.NativeArea.lvAreaSet(x1, y1, x2, y2)
                // Draw picture information
                let img_draw_dsc = utils.GG.NativeDraw.lvDrawImgDscInit()
                // draw pictures
                utils.GG.NativeDraw.lvDrawImg(dsc.dsc, img_draw_dsc, area, src)
            }
        }, utils.ENUM.LV_EVENT_DRAW_PART_END)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all,comp,parent)
    return comp;
}
export default buttons;