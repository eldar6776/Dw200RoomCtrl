import logger from "../dxmodules/dxLogger.js";
import ui from "../dxmodules/dxUi.js";
import gpio from "../dxmodules/dxGpio.js"
import utils from "../dxmodules/uiUtils.js";
import keyboard from '../src/keyboard.js';
import bus from '../modules/eventBusExtended.js'
import common from '../dxmodules/dxCommon.js'
import code from '../dxmodules/dxCode.js'
import config from '../dxmodules/dxConfig.js'
import std from '../dxmodules/dxStd.js'
import screen from "../modules/screen.js";
import auth from "../modules/auth.js";






const page = {}
page.ID = 'first'
let view = null
const uiElements = {}

uiElements.btnPassword = null
uiElements.lblPassword = null
uiElements.viewNfcData = null


uiElements.IDs = {
  btnPassword: page.ID + 'btnPassword',
  lblPassword: page.ID + 'lblPassword',
  viewNfcData: page.ID + 'viewNfcData',
  lblWelcome: page.ID + 'lblWelcome',
  intervShowNfcData: page.ID + 'intervShowNfcData'
}






page.open = function()
{
  view = ui.View.build(page.ID, ui.Utils.LAYER.MAIN)
  view.padAll(0)
  view.borderWidth(0)
  view.bgColor(0x000000)
  view.setPos(0, 0)
  view.setSize(480, 320)

  let btnPassword = ui.Button.build(uiElements.IDs.btnPassword, view)
  btnPassword.align(ui.Utils.ALIGN.CENTER, 0, 0)
  btnPassword.setSize(180, 40)
  btnPassword.padAll(0)
  btnPassword.bgOpa(0)
  btnPassword.shadow(0, 0, 0, 0, 0x000000, 0)
  btnPassword.borderWidth(3)
  btnPassword.setBorderColor(0xffffff)
  uiElements.btnPassword = btnPassword

  let lblPassword = ui.Label.build(uiElements.IDs.lblPassword, uiElements.btnPassword)
  lblPassword.align(ui.Utils.ALIGN.CENTER, 0, 0)
  lblPassword.text('Enter Password')
  lblPassword.textColor(0xffffff)
  lblPassword.textFont(ui.Font.build('../screens/fonts/font.ttf', 20))
  uiElements.lblPassword = lblPassword






  btnPassword.on(utils.EVENT.CLICK, () => {
    keyboard.open('', (input) => {})
  })


  bus.on(auth.EVENTS.NFC_CARD_VALID, showNfcData)


  /*let lblTime = ui.Label.build(page.ID + 'timeLabel', view)
  lblTime.text(' ')
  lblTime.setPos(10, 300)
  lblTime.textColor(0xffffff)*/

  /*let pic = ui.Image.build(page.ID + 'pic', button)
  pic.source('/app/code/resources/icons/light off.png')
  pic.setPos(0, 0)*/



  /*let txtarea = ui.Textarea.build(page.ID + 'textarea', view)
  txtarea.setPos(100, 60)
  txtarea.setSize(200, 40)*/



  /*std.setInterval(() => {
    let date = new Date()
      lblTime.text(date.getUTCHours().toString().padStart(2, '0') + ':' + date.getUTCMinutes().toString().padStart(2, '0'))
    }, 1000 * 1)*/



  /*txtarea.on(ui.Utils.EVENT.CLICK, () => {
    keyboard.open(txtarea)
  })




   let txtarea2 = ui.Textarea.build(page.ID + 'textarea2', view)
  txtarea2.setPos(100, 160)
  txtarea2.setSize(200, 40)

  txtarea2.on(ui.Utils.EVENT.CLICK, () => {
    keyboard.open(txtarea2)
  })


  

  button.on(ui.Utils.EVENT.CLICK, ()=>{
      if (lightStatus) {
          lightStatus = 0
          //pic.source('/app/code/resources/icons/light off.png')
          button.setBorderColor(0xff0000)
          gpio.setValue(105, 0)
      }
      else {
          lightStatus = 1
          //pic.source('/app/code/resources/icons/light on.png')
          button.setBorderColor(0x00ff00)
          gpio.setValue(105, 1)
      }
     var lightsCount = (config.get('lights.count'));
     ++lightsCount
          config.setAndSave("lights.count", lightsCount)
          label.text(lightsCount.toString())
  })*/

          ui.loadMain(view)
}





page.close = function(){
    ui.del(view)
    if(view) view = null
    
    for (const key in uiElements) {
        uiElements[key] = null;
    }

    nfcData = null
}





function showNfcData(nfcData){
  let viewNfcData = ui.View.build(uiElements.IDs.viewNfcData, ui.Utils.LAYER.TOP)
  viewNfcData.padAll(0)
  viewNfcData.borderWidth(0)
  viewNfcData.bgColor(0x000000)
  viewNfcData.setPos(0, 0)
  viewNfcData.setSize(480, 320)
  uiElements.viewNfcData = viewNfcData

  let lblWelcome = ui.Label.build(uiElements.IDs.lblWelcome, viewNfcData)
  lblWelcome.text('Welcome\n' + nfcData.firstName + ' ' + nfcData.lastName)
  lblWelcome.align(ui.Utils.ALIGN.CENTER, 0, 0)
  lblWelcome.textColor(0xffffff)
  lblWelcome.textFont(ui.Font.build('../screens/fonts/font.ttf', 20))

  //ui.loadMain(uiElements.viewNfcData)


  ui.setInterval(uiElements.IDs.intervShowNfcData, closeNfcData, 2 * 1000)
}





function closeNfcData(){
  logger.info('closing')
  ui.del(uiElements.viewNfcData)
  //ui.loadMain(view)
  ui.clearInterval(uiElements.IDs.intervShowNfcData)
}









export default page
