import ui from '../dxmodules/dxUi.js'









const page = {}
page.pageID = ''
page.view = null
page.uiElements = null





/**
 * override - used for building ui
 */
page.open = function(){}



page.close = function(){
    ui.del(page.view)
    if(page.view) page.view = null
    
    for (const key in page.uiElements) {
        page.uiElements[key] = null;
    }
}







export default Page
