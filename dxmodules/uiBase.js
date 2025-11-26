//build:20240524
/**
 * The base class of UI will be inherited by other controls. Subclasses are not allowed to modify the corresponding function behavior. This js does not need to be directly referenced and used.
 */
import utils from "./uiUtils.js"
import logger from './dxLogger.js'
import * as os from "os"
const uibase = {}
/**
* Modify or get/obtain the width of the control
* @param {number} w is not required. If it is not filled in, it will get/obtain the width, otherwise it will modify the width.
*/
uibase.width = function (w) {
     if (!utils.validateNumber(w)) {
          return this.obj.getWidth()
     }
     this.obj.lvObjSetWidth(w)
}
/**
* Modify or get/obtain the height of the control
* @param {number} h is not required. If it is not filled in, it will get/obtain the height, otherwise it will modify the height.
*/
uibase.height = function (h) {
     if (!utils.validateNumber(h)) {
          return this.obj.getHeight()
     }
     this.obj.lvObjSetHeight(h)
}
/**
 * get/obtain removes the width of borders and padding
 * @returns 
 */
uibase.contentWidth = function () {
     return this.obj.lvObjGetContentWidth()
}
/**
 * get/obtain removes the height of borders and padding
 * @returns 
 */
uibase.contentHeight = function () {
     return this.obj.lvObjGetContentHeight()
}
/**
 * Scroll distance above get/obtain
 * @returns 
 */
uibase.scrollTop = function () {
     return this.obj.getScrollTop()
}
/**
 * Scroll distance below get/obtain
 * @returns 
 */
uibase.scrollBottom = function () {
     return this.obj.getScrollBottom()
}
/**
 * get/obtain left scroll distance
 * @returns 
 */
uibase.scrollLeft = function () {
     return this.obj.getScrollLeft()
}
/**
 * get/obtain right scroll distance
 * @returns 
 */
uibase.scrollRight = function () {
     return this.obj.getScrollRight()
}
/**
* Modify the width and height of a control
*  @param {number} w required 
*  @param {number} h required 
*/
uibase.setSize = function (w, h) {
     let err = 'dxui.setSize: width or height should not be empty'
     utils.validateNumber(w, err)
     utils.validateNumber(h, err)
     this.obj.lvObjSetSize(w, h)
}
/**
* Modify or get/obtain the x-coordinate of the control equivalent to the parent object
* @param {number} x is not required. If not filled in, it will get/obtain the x coordinate, otherwise it will modify the x coordinate.
*/
uibase.x = function (x) {
     if (!utils.validateNumber(x)) {
          return this.obj.getX()
     }
     this.obj.lvObjSetX(x)
}
/**
* Modify or get/obtain the x-coordinate of the control equivalent to the parent object
* @param {number} y is not required. If not filled in, the get/obtainy coordinate will be obtained, otherwise the y coordinate will be modified.
*/
uibase.y = function (y) {
     if (!utils.validateNumber(y)) {
          return this.obj.getY()
     }
     this.obj.lvObjSetY(y)
}
/**
* Modify the x and y coordinates of the control relative to the parent object
*  @param {number} x required 
*  @param {number} y required 
*/
uibase.setPos = function (x, y) {
     let err = 'dxui.setPos: x or y should not be empty'
     utils.validateNumber(x, err)
     utils.validateNumber(y, err)
     this.obj.lvObjSetPos(x, y)
}
/**
 * Move the control to the top level, which is equivalent to the last child control created by the parent object and will cover all other child controls.
 */
uibase.moveForeground = function () {
     this.obj.moveForeground()
}
/**
 * Move the control to the bottom layer, which is equivalent to the first child control created by the parent object and will be overwritten by all other child controls.
 */
uibase.moveBackground = function () {
     this.obj.moveBackground()
}
/**
 * subscribeevent, the supported event types refer to utils.EVENT
 * @param {number} type enumeration utils.EVENT, such as click, long press, etc.
 * @param {function} The callback function triggered by cb event (cannot be an anonymous function)
 * @param {object} ud user data
 */
uibase.on = function (type, cb, ud) {
     this.obj.addEventCb(() => {
          if (cb) {
               cb({ target: this, ud: ud })
          }
     }, type)
}
/**
 * sendevent, for example, to simulate clicking a button, you can sendCLICKevent to the button
 * @param {number} type enumeration utils.EVENT, such as click, long press, etc.
 */
uibase.send = function (type) {
     NativeObject.APP.NativeComponents.NativeEvent.lvEventSend(this.obj, type)
}
/**
 * Hide ui objects
 */
uibase.hide = function () {
     if (!this.obj.hasFlag(1)) {
          this.obj.lvObjAddFlag(1);
     }
}
/**
 * check/determine whether to hide
 * @returns 
 */
uibase.isHide = function () {
     return this.obj.hasFlag(1);
}
/**
 * Show hidden ui objects
 */
uibase.show = function () {
     if (this.obj.hasFlag(1)) {
          this.obj.lvObjClearFlag(1);
     }
}
/**
 * Disable objects
 * @param {*} en false/true, true is disabled, false is enabled
 */
uibase.disable = function (en) {
     if (en) {
          this.obj.addState(utils.STATE.DISABLED)
     } else {
          this.obj.clearState(utils.STATE.DISABLED)
     }
}
/**
 * Whether the object is clickable
 * @param {*} en false/true, true means clickable, false means not clickable
 */
uibase.clickable = function (en) {
     if (en) {
          this.obj.lvObjAddFlag(utils.OBJ_FLAG.CLICKABLE)
     } else {
          this.obj.lvObjClearFlag(utils.OBJ_FLAG.CLICKABLE)
     }
}
/**
 * check/determine whether to disable or not
 * @returns true is disabled, false is enabled
 */
uibase.isDisable = function () {
     return this.obj.hasState(utils.STATE.DISABLED)
}
/**
 * focus object
 * @param {*} en false/true, true is focus, false is defocus
 */
uibase.focus = function (en) {
     if (en) {
          this.obj.addState(utils.STATE.FOCUSED)
     } else {
          this.obj.clearState(utils.STATE.FOCUSED)
     }
}
/**
 * check/determine whether to focus
 * @returns true means it is focused, false means it is not focused.
 */
uibase.isFocus = function () {
     return this.obj.hasState(utils.STATE.FOCUSED)
}

/**
 * To set the UI style, you can set it individually by style, or you can define the style object first and then bind it to the UI object.
 * Bind ui objects and style objects to different parts or different status/state
 * @param {object} style The object returned by style.js buildfunction
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.addStyle = function (style, type) {
     if (!style || !style.obj) {
          throw new Error('dxui.addStyle: style should not be null')
     }
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjAddStyle(style.obj, type);
}
/**
* Set the left, right, top and bottom padding to a value
* @param {number} pad margin value
* @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
*/
uibase.padAll = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStylePadAll(pad, type)
}
/**
 * Set/get/obtain right padding to a value
 * @param {number} pad margin value
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.padRight = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadRight(type)
     }
     this.obj.setStylePadRight(pad, type)
}
/**
  * Set/get/obtain left padding to a value
  * @param {number} pad margin value
  * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
  */
uibase.padLeft = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadLeft(type)
     }
     this.obj.setStylePadLeft(pad, type)
}
/**
  * Set the upper padding of /get/obtain to a value
  * @param {number} pad margin value
  * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
  */
uibase.padTop = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadTop(type)
     }
     this.obj.setStylePadTop(pad, type)
}
/**
  * Set the padding under /get/obtain to a value
  * @param {number} pad margin value
  * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
  */
uibase.padBottom = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadBottom(type)
     }
     this.obj.setStylePadBottom(pad, type)
}
/**
 * Set/get/obtain border width
 * @param {number} w 
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.borderWidth = function (w, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(w)) {
          return this.obj.lvObjGetStyleBorderWidth(type)
     }
     this.obj.lvObjSetStyleBorderWidth(w, type)
}
/**
 * Set border color
 * @param {number} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.setBorderColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.setStyleBorderColor(utils.colorParse(color), type)
}
/**
 * Set edge rounding
 * @param {number} r 
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.radius = function (r, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleRadius(r, type)
}
/**
 * Set the background transparency, the value range is 0-100, the smaller the value, the better
 * @param {number} opa must be 0-100
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.bgOpa = function (opa, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleBgOpa(utils.OPA_MAPPING(opa), type)
}
/**
 * Set background color
 * @param {any} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.bgColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleBgColor(utils.colorParse(color), type)
}
/**
 * Set shadow
 * @param {number} width shadow width
 * @param {number} x horizontal offset
 * @param {number} y vertical offset
 * @param {number} spread spread distance
 * @param {number} color color
 * @param {number} opa transparency, must be 0-100
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.shadow = function (width, x, y, spread, color, opa, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleShadowWidth(width, type)
     this.obj.lvObjSetStyleShadowOfsX(x, type)
     this.obj.lvObjSetStyleShadowOfsY(y, type)
     this.obj.lvObjSetStyleShadowSpread(spread, type)
     this.obj.setStyleShadowColor(color, type)
     this.obj.setStyleShadowOpa(utils.OPA_MAPPING(opa), type)
}
/**
 * Set text color
 * @param {any} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.textColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleTextColor(utils.colorParse(color), type)
}
/**
 * Set text alignment method/way
 * @param {number} align refer to utils.TEXT_ALIGN
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.textAlign = function (align, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleTextAlign(align, type)
}
/**
 * Set text font
 * @param {object} font The object returned by build in font.js
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.textFont = function (font, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!font || !font.obj) {
          throw new Error("dxui.textFont: 'font' parameter should not be null")
     }
     this.obj.lvObjSetStyleTextFont(font.obj, type)
}
/**
 * Set line object (line) color
 * @param {any} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.lineColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleLineColor(utils.colorParse(color), type)
}
/**
 * Set line object (line) width
 * @param {number} w 
 * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
 */
uibase.lineWidth = function (w, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleLineWidth(w, type)
}
/**
 * Set the rounded corners of the line object (line)
 * @param {boolean} enable true/false
 */
uibase.lineRound = function (enable) {
     this.obj.lvObjSetStyleLineRounded(enable)
}
/**
 * Set the scroll bar display method/way of the UI object
 * @param {boolean} state ture/false 
 */
uibase.scrollbarMode = function (state) {
     this.obj.lvObjSetScrollbarMode(state)
}
/**
 * Set whether the ui object supports scrolling
 * @param {boolean} state 
 */
uibase.scroll = function (state) {
     if (state) {
          this.obj.lvObjAddFlag(16)
     } else {
          this.obj.lvObjClearFlag(16)
     }
}
/**
 * Align objects to other reference objects
 * @param {object} ref reference object
 * @param {number} type Alignment direction, refer to dxui.Utils.ALIGN enumeration
 * @param {number} x offset x
 * @param {number} y offset y
 */
uibase.alignTo = function (ref, type, x, y) {
     if (!ref || !ref.obj) {
          throw new Error("dxui.alignto: 'ref' parameter should not be null")
     }
     this.obj.lvObjAlignTo(ref.obj, type, x, y)
}
/**
 * Align object to parent object
 * @param {number} type Alignment direction, refer to dxui.Utils.ALIGN enumeration
 * @param {number} x offset x
 * @param {number} y offset y
 */
uibase.align = function (type, x, y) {
     this.obj.lvObjAlign(type, x, y)
}
/**
 * Flexible box layout can position, arrange and distribute elements more flexibly, making it easier to create responsive and scalable layouts.
 * It's based on a container, and some flex items inside. Here are some concepts for using this layout:
 * 1. Container: The container contains internal flexible items, which can arrange the items inside according to rules such as left to right or right to left.
 * 2. Main axis and side axis: The main axis is the main arrangement method/way of items in the container, usually horizontally or vertically, which allows items to be arranged horizontally or vertically.
 * The side axis, the axis perpendicular to the main axis, can specify the method/way for the arrangement of items on the side axis.
 * The main axis and side axis are set by flexFlow(), and there are mainly two types: ROW (horizontal direction) and COLUMN (vertical direction). Those with WRAP suffix will automatically wrap when the items exceed the container. Those with REVERSE suffix are opposite to the default arrangement direction, that is, arranged from right to left (if the main axis is vertical, it will be arranged from bottom to top).
 * 3. Spindle alignment method/way: START (default spindle order), END (default spindle order is opposite), CENTER (centered in the direction of the spindle), SPACE_EVENLY (evenly distributed on the spindle, with equal distances between pairs), SPACE_AROUND (evenly distributed on the spindle, each item equally divides the distance on the spindle), SPACE_BETWEEN (top grid at both ends, equally divided in the middle), set by flexAlign().
 * 4. Cross-axis alignment method/way: Treat each row or column as an item, align it in the cross-axis direction, and align the method/way with the main axis, set by flexAlign().
 * 5. Overall alignment method/way: Treat all items in the container as a whole and align them in the container. The alignment method/way is the same as the main axis and is set by flexAlign().
 * @param {number} type Main axis and side axis settings
 */
uibase.flexFlow = function (type) {
     this.obj.lvObjSetFlexFlow(type)
}
/**
 * 
 * @param {number} main Alignment method/way of child elements according to the main axis direction
 * @param {number} cross Alignment method/way of child elements according to the cross axis direction
 * @param {number} track the alignment method/way of all child elements to the container
 */
uibase.flexAlign = function (main, cross, track) {
     this.obj.lvObjSetFlexAlign(main, cross, track)
}
/**
 * Update the size of a control. It can be called first when get/obtain the size of a control is 0, which is equivalent to updating the display cache.
 */
uibase.update = function () {
     this.obj.lvObjUpdateLayout()
}
/**
 * Add the status/state of a control
 * @param {number} state status/state enumeration
 */
uibase.addState = function (state) {
     this.obj.addState(state)
}
/**
 * Delete the status/state of a control. If you want a focused input box to be out of focus, you can call this method to delete the FOCUSEDstatus/state.
 * @param {number} state status/state enumeration
 */
uibase.clearState = function (state) {
     this.obj.clearState(state)
}
/**
 * Check/determine whether a control has status/state. If you want to check/determine whether an input box is focused, you can use this method and pass in the FOCUSED parameter.
 * @param {number} state status/state enumeration
 * @returns true/false
 */
uibase.hasState = function (state) {
     return this.obj.hasState(state)
}
/**
 * Redrawing a control and forcing the control's cache to be refreshed can forcefully solve the problem of blurred screens, but if called in an infinite loop, performance will be reduced.
 */
uibase.invalidate = function () {
     this.obj.invalidate()
}
/**
 * Scroll a sub-control until it is displayed. If you want to scroll an item that has been scrolled out of the container and is invisible to a position where it can be seen, call this method.
 * @param {boolean} en Whether to turn on the animation. If it is turned on, it will scroll out slowly, and if it is turned off, it will jump out directly.
 * @param {boolean} notRecursive Default recursive, suitable for general scrolling and scrolling nested controls
 */
uibase.scrollToView = function (en, isRecursive) {
     if (isRecursive) {
          this.obj.scrollToView(en)
     } else {
          this.obj.scrollToViewRecursive(en)
     }
}
/**
 * Scroll the x direction of a control
 * @param {number} x scrolling x-axis distance
 * @param {boolean} en whether to enable animation
 */
uibase.scrollToX = function (x, en) {
     this.obj.scrollToX(x, en)
}
/**
 * Scroll the y direction of a control
 * @param {number} y scrolling y-axis distance
 * @param {boolean} en whether to enable animation
 */
uibase.scrollToY = function (y, en) {
     this.obj.scrollToY(y, en)
}
/**
 * Element snapshot (actually a screenshot, if you want to save a full-screen screenshot, you can use this method on the screen object)
 * @param {string} fileName required, the file name to save the snapshot (note that the suffix should correspond to format)
 * @param {number} type not required, defaultpng, snapshot format 0:bmp/1:png/2:jpg(jpeg)
 * @param {number} cf not required, an RGB color storage format
 */
uibase.snapshot = function (fileName, type = 1, cf = NativeObject.APP.NativeComponents.NativeEnum.LV_IMG_CF_TRUE_COLOR_ALPHA) {
     if (!fileName) {
          return
     }
     // Stored in /app/data/snapshot location by default
     os.mkdir("/app/data/snapshot/")
     this.obj.lvSnapshotTake(cf, "/app/data/snapshot/" + fileName, type)
}
export default uibase;